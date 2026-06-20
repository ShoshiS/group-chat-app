import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { Auth } from '../../core/services/auth';
import { AgentChat } from '../../features/agent/agent-chat';

/**
 * Floating launcher shown on authenticated pages. Opens a compact assistant
 * panel without leaving the current route; hidden on `/agent` (full-page view).
 */
@Component({
  selector: 'app-agent-launcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgentChat],
  templateUrl: './agent-launcher.html',
  styleUrl: './agent-launcher.scss',
})
export class AgentLauncher {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly panelOpen = signal(false);

  protected readonly visible = computed(
    () => this.auth.isLoggedIn() && !this.currentUrl().startsWith('/agent'),
  );

  constructor() {
    effect(() => {
      if (!this.visible()) {
        this.panelOpen.set(false);
      }
    });
  }

  protected togglePanel(): void {
    this.panelOpen.update((open) => !open);
  }

  protected closePanel(): void {
    this.panelOpen.set(false);
  }
}
