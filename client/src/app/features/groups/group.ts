import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { Group, GroupMember } from '../../core/models/group';
import { environment } from '../../../environments/environment';

export interface GroupPayload {
  name: string;
  description?: string;
  avatar?: string;
  avatarFile?: File;
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
    const body = this.buildRequestBody(payload);
    const group = await firstValueFrom(
      this.http.post<Group>(`${environment.apiUrl}/groups`, body),
    );
    this._groups.update((gs) => [...gs, group]);
    return group;
  }

  async update(id: string, payload: GroupPayload): Promise<void> {
    const body = this.buildRequestBody(payload);
    const updated = await firstValueFrom(
      this.http.put<Group>(`${environment.apiUrl}/groups/${id}`, body),
    );
    this._groups.update((gs) => gs.map((g) => (g.id === id ? updated : g)));
  }

  private buildRequestBody(payload: GroupPayload): FormData | Omit<GroupPayload, 'avatarFile'> {
    if (payload.avatarFile) {
      const form = new FormData();
      form.append('name', payload.name);
      if (payload.description) {
        form.append('description', payload.description);
      }
      form.append('avatar', payload.avatarFile, payload.avatarFile.name);
      return form;
    }

    return {
      name: payload.name,
      ...(payload.description ? { description: payload.description } : {}),
      ...(payload.avatar !== undefined ? { avatar: payload.avatar } : {}),
    };
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
    this._groups.update((groups) => {
      const index = groups.findIndex((item) => item.id === id);
      if (index === -1) {
        return [...groups, group];
      }
      const next = [...groups];
      next[index] = group;
      return next;
    });
    return group;
  }

  async invite(groupId: string, invitee: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/groups/${groupId}/invite`, { invitee }),
    );
  }

  async fetchMembers(groupId: string): Promise<GroupMember[]> {
    return firstValueFrom(
      this.http.get<GroupMember[]>(`${environment.apiUrl}/groups/${groupId}/members`),
    );
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    const updated = await firstValueFrom(
      this.http.delete<Group>(`${environment.apiUrl}/groups/${groupId}/members/${userId}`),
    );
    this._groups.update((groups) => groups.map((group) => (group.id === groupId ? updated : group)));
  }
}
