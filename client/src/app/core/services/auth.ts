import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { AuthResponse, AuthUser } from '../models/user';

const TOKEN_KEY = 'auth_token';

/**
 * Client auth state: JWT in localStorage, user profile in signals.
 * Session is restored on startup via GET /auth/me when a token exists.
 */
@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private initPromise: Promise<void> | null = null;

  readonly currentUser = signal<AuthUser | null>(null);
  readonly sessionReady = signal(false);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  ensureSession(): Promise<void> {
    this.initPromise ??= this.restoreSession();
    return this.initPromise;
  }

  async register(payload: {
    username: string;
    email: string;
    password: string;
  }): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, payload),
    );
    this.applyAuthResponse(response);
  }

  async login(payload: { email: string; password: string }): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload),
    );
    this.applyAuthResponse(response);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.currentUser.set(null);
    void this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private async restoreSession(): Promise<void> {
    const token = this.getToken();
    if (!token) {
      this.sessionReady.set(true);
      return;
    }

    try {
      const user = await firstValueFrom(
        this.http.get<AuthUser>(`${environment.apiUrl}/auth/me`),
      );
      this.currentUser.set(user);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      this.currentUser.set(null);
    } finally {
      this.sessionReady.set(true);
    }
  }

  private applyAuthResponse(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    this.currentUser.set(response.user);
  }
}
