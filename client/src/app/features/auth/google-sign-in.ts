import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { Auth } from '../../core/services/auth';

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      width?: number;
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    },
  ): void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

/**
 * Google sign-in on login/register. Always visible; uses GIS when a client ID is configured.
 */
@Component({
  selector: 'app-google-sign-in',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './google-sign-in.html',
  styleUrl: './google-sign-in.scss',
})
export class GoogleSignIn implements AfterViewInit {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly configured = signal(false);
  protected readonly busy = signal(false);

  readonly signInError = output<string>();

  private readonly buttonHost = viewChild<ElementRef<HTMLElement>>('buttonHost');
  private clientId = '';

  ngAfterViewInit(): void {
    void this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    this.clientId = await this.resolveClientId();
    this.configured.set(this.clientId.length > 0);
    this.cdr.detectChanges();

    if (!this.configured()) {
      return;
    }

    await this.initializeButton();
  }

  private async resolveClientId(): Promise<string> {
    if (environment.googleClientId.length > 0) {
      return environment.googleClientId;
    }

    try {
      const config = await this.auth.getPublicConfig();
      return config.googleClientId.trim();
    } catch {
      return '';
    }
  }

  private async initializeButton(): Promise<void> {
    const host = this.buttonHost()?.nativeElement;
    if (!host) {
      return;
    }

    try {
      await this.loadScript();
      window.google?.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response) => {
          void this.handleCredential(response.credential);
        },
      });
      window.google?.accounts.id.renderButton(host, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
      });
    } catch {
      this.signInError.emit('Google Sign-In failed to load. Please try again.');
    }
  }

  private async handleCredential(credential: string): Promise<void> {
    if (this.busy()) {
      return;
    }

    this.busy.set(true);
    try {
      await this.auth.loginWithGoogle(credential);
      await this.router.navigate(['/groups']);
    } catch (err: unknown) {
      const message =
        (err as { error?: { error?: string } })?.error?.error ??
        'Google sign-in failed. Please try again.';
      this.signInError.emit(message);
    } finally {
      this.busy.set(false);
    }
  }

  private loadScript(): Promise<void> {
    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }

    const existing = document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`);
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('GIS script failed')), {
          once: true,
        });
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GIS_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('GIS script failed'));
      document.head.appendChild(script);
    });
  }
}
