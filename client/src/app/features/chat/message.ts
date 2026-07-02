import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { Message } from '../../core/models/message';
import { environment } from '../../../environments/environment';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export interface FileValidationError {
  file: string;
  reason: string;
}

/**
 * Signal store for the messages of the currently active chat room.
 * Cleared and reloaded whenever the user navigates to a different group.
 */
@Injectable({ providedIn: 'root' })
export class MessageStore {
  private readonly http = inject(HttpClient);

  private readonly _messages = signal<Message[]>([]);
  private readonly _loading = signal(false);
  private readonly _loadingOlder = signal(false);
  private readonly _hasMore = signal(true);
  private readonly _error = signal<string | null>(null);

  readonly messages = this._messages.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loadingOlder = this._loadingOlder.asReadonly();
  readonly hasMore = this._hasMore.asReadonly();
  readonly error = this._error.asReadonly();

  reset(): void {
    this._messages.set([]);
    this._error.set(null);
    this._hasMore.set(true);
  }

  async load(groupId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._hasMore.set(true);
    try {
      const msgs = await firstValueFrom(
        this.http.get<Message[]>(`${environment.apiUrl}/groups/${groupId}/messages`),
      );
      this._messages.set(msgs);
      this._hasMore.set(msgs.length >= 50);
    } catch {
      this._error.set('Failed to load messages');
    } finally {
      this._loading.set(false);
    }
  }

  /** Fetches the page before the oldest message currently in memory. */
  async loadOlder(groupId: string): Promise<void> {
    const oldest = this._messages()[0];
    if (!oldest || this._loadingOlder() || !this._hasMore()) {
      return;
    }

    this._loadingOlder.set(true);
    try {
      const older = await firstValueFrom(
        this.http.get<Message[]>(`${environment.apiUrl}/groups/${groupId}/messages`, {
          params: { before: oldest.id, limit: '50' },
        }),
      );
      if (older.length === 0) {
        this._hasMore.set(false);
        return;
      }

      this._messages.update((current) => {
        const ids = new Set(current.map((message) => message.id));
        const unique = older.filter((message) => !ids.has(message.id));
        return [...unique, ...current];
      });
      this._hasMore.set(older.length >= 50);
    } catch {
      // Keep existing messages; user can retry by scrolling up again.
    } finally {
      this._loadingOlder.set(false);
    }
  }

  async send(groupId: string, text: string, files: File[]): Promise<void> {
    const body = new FormData();
    if (text.trim()) body.append('text', text.trim());
    for (const file of files) body.append('files', file, file.name);

    const msg = await firstValueFrom(
      this.http.post<Message>(`${environment.apiUrl}/groups/${groupId}/messages`, body),
    );
    this.addRealtime(msg);
  }

  async update(messageId: string, text: string): Promise<void> {
    const updated = await firstValueFrom(
      this.http.put<Message>(`${environment.apiUrl}/messages/${messageId}`, { text }),
    );
    this._messages.update((ms) => ms.map((m) => (m.id === messageId ? updated : m)));
  }

  async remove(messageId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${environment.apiUrl}/messages/${messageId}`));
    this._messages.update((ms) => ms.filter((m) => m.id !== messageId));
  }

  async compose(groupId: string, draft?: string): Promise<string> {
    const body = draft?.trim() ? { draft: draft.trim() } : {};
    const response = await firstValueFrom(
      this.http.post<{ text: string }>(`${environment.apiUrl}/groups/${groupId}/messages/compose`, body),
    );
    return response.text;
  }

  /** Called by SocketService event — message already persisted, just reflect it. */
  addRealtime(message: Message): void {
    this._messages.update((ms) => {
      if (ms.some((m) => m.id === message.id)) return ms;
      return [...ms, message];
    });
  }

  updateRealtime(message: Message): void {
    this._messages.update((ms) => ms.map((m) => (m.id === message.id ? message : m)));
  }

  deleteRealtime(messageId: string): void {
    this._messages.update((ms) => ms.filter((m) => m.id !== messageId));
  }

  static validateFiles(files: File[]): FileValidationError[] {
    return files.flatMap((f) => {
      const errors: FileValidationError[] = [];
      if (!ALLOWED_TYPES.includes(f.type)) {
        errors.push({ file: f.name, reason: 'Unsupported file type' });
      }
      if (f.size > MAX_FILE_SIZE) {
        errors.push({ file: f.name, reason: 'File exceeds 10 MB limit' });
      }
      return errors;
    });
  }
}
