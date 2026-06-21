import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { Group } from '../../core/models/group';
import { environment } from '../../../environments/environment';

export interface GroupPayload {
  name: string;
  description?: string;
  avatar?: string;
}

/**
 * Singleton Signal store for the authenticated user's groups.
 * Keeps groups in sync: load once, mutate locally after each successful API call.
 */
@Injectable({ providedIn: 'root' })
export class GroupStore {
  private readonly http = inject(HttpClient);

  private readonly _groups = signal<Group[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly groups = this._groups.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isEmpty = computed(() => !this._loading() && this._groups().length === 0);

  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const groups = await firstValueFrom(this.http.get<Group[]>(`${environment.apiUrl}/groups`));
      this._groups.set(groups);
    } catch {
      this._error.set('Failed to load groups');
    } finally {
      this._loading.set(false);
    }
  }

  async create(payload: GroupPayload): Promise<Group> {
    const group = await firstValueFrom(
      this.http.post<Group>(`${environment.apiUrl}/groups`, payload),
    );
    this._groups.update((gs) => [...gs, group]);
    return group;
  }

  async update(id: string, payload: GroupPayload): Promise<void> {
    const updated = await firstValueFrom(
      this.http.put<Group>(`${environment.apiUrl}/groups/${id}`, payload),
    );
    this._groups.update((gs) => gs.map((g) => (g.id === id ? updated : g)));
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${environment.apiUrl}/groups/${id}`));
    this._groups.update((gs) => gs.filter((g) => g.id !== id));
  }

  async leave(id: string): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.apiUrl}/groups/${id}/leave`, {}));
    this._groups.update((gs) => gs.filter((g) => g.id !== id));
  }

  getById(id: string): Group | undefined {
    return this._groups().find((g) => g.id === id);
  }

  /** Returns a cached group or fetches it from the API (e.g. after a direct URL refresh). */
  async fetchById(id: string): Promise<Group> {
    const cached = this.getById(id);
    if (cached) return cached;

    const group = await firstValueFrom(
      this.http.get<Group>(`${environment.apiUrl}/groups/${id}`),
    );
    this._groups.update((gs) =>
      gs.some((g) => g.id === id) ? gs.map((g) => (g.id === id ? group : g)) : [...gs, group],
    );
    return group;
  }
}
