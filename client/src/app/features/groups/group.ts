import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { Group } from '../../core/models/group';
import type { GroupTimelineItem } from '../../core/models/group-timeline';
import type { GroupMember } from '../../core/models/group-member';
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

  async fetchById(id: string): Promise<Group> {
    const group = await firstValueFrom(
      this.http.get<Group>(`${environment.apiUrl}/groups/${id}`),
    );
    this._groups.update((gs) => {
      const index = gs.findIndex((g) => g.id === id);
      if (index === -1) {
        return [...gs, group];
      }
      return gs.map((g) => (g.id === id ? group : g));
    });
    return group;
  }

  async fetchMembers(groupId: string): Promise<GroupMember[]> {
    return firstValueFrom(
      this.http.get<GroupMember[]>(`${environment.apiUrl}/groups/${groupId}/members`),
    );
  }

  async fetchGroupInvitations(groupId: string): Promise<GroupTimelineItem[]> {
    return firstValueFrom(
      this.http.get<GroupTimelineItem[]>(
        `${environment.apiUrl}/groups/${groupId}/invitations`,
      ),
    );
  }

  async invite(groupId: string, email: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/groups/${groupId}/invite`, { email }),
      );
    } catch (err) {
      if (err instanceof HttpErrorResponse) {
        const message =
          typeof err.error === 'object' && err.error !== null && 'error' in err.error
            ? String((err.error as { error: string }).error)
            : 'Failed to send invitation';
        throw new Error(message);
      }
      throw err;
    }
  }

  async removeMember(groupId: string, userId: string): Promise<Group> {
    try {
      const updated = await firstValueFrom(
        this.http.delete<Group>(`${environment.apiUrl}/groups/${groupId}/members/${userId}`),
      );
      this._groups.update((gs) => gs.map((g) => (g.id === groupId ? updated : g)));
      return updated;
    } catch (err) {
      if (err instanceof HttpErrorResponse) {
        const message =
          typeof err.error === 'object' && err.error !== null && 'error' in err.error
            ? String((err.error as { error: string }).error)
            : 'Failed to remove member';
        throw new Error(message);
      }
      throw err;
    }
  }
}
