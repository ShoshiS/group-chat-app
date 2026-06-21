import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { Invitation } from '../models/invitation';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InvitationStore {
  private readonly http = inject(HttpClient);

  private readonly _invitations = signal<Invitation[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly invitations = this._invitations.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly pendingCount = computed(
    () => this._invitations().filter((invitation) => invitation.status === 'pending').length,
  );

  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const invitations = await firstValueFrom(
        this.http.get<Invitation[]>(`${environment.apiUrl}/invitations`),
      );
      this._invitations.set(invitations);
    } catch {
      this._error.set('Failed to load invitations');
    } finally {
      this._loading.set(false);
    }
  }

  async accept(id: string): Promise<void> {
    const updated = await firstValueFrom(
      this.http.put<Invitation>(`${environment.apiUrl}/invitations/${id}/accept`, {}),
    );
    this._invitations.update((items) => items.filter((item) => item.id !== updated.id));
  }

  async reject(id: string): Promise<void> {
    const updated = await firstValueFrom(
      this.http.put<Invitation>(`${environment.apiUrl}/invitations/${id}/reject`, {}),
    );
    this._invitations.update((items) => items.filter((item) => item.id !== updated.id));
  }
}
