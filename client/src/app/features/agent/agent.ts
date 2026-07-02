import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  actionSummary?: string;
}

interface AgentTurnResponse {
  reply: string;
  actions: { tool: string; args: Record<string, unknown>; result: Record<string, unknown> }[];
}

/**
 * Conversation state for the AI assistant. Keeps the display history as signals
 * and relays each turn to the server, which runs the Gemini function-calling
 * loop and returns the assistant's reply.
 */
@Injectable({ providedIn: 'root' })
export class Agent {
  private readonly http = inject(HttpClient);

  readonly messages = signal<ChatMessage[]>([]);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly canSend = computed(() => !this.pending());

  async send(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed || this.pending()) {
      return;
    }

    this.error.set(null);
    this.append({ role: 'user', text: trimmed });
    this.pending.set(true);

    const history = this.messages().map(({ role, text: content }) => ({ role, text: content }));

    try {
      const response = await firstValueFrom(
        this.http.post<AgentTurnResponse>(`${environment.apiUrl}/agent/chat`, {
          messages: history,
        }),
      );
      this.append({
        role: 'model',
        text: response.reply,
        actionSummary: formatActionSummary(response.actions),
      });
    } catch (err: unknown) {
      const message =
        (err as { error?: { error?: string }; message?: string })?.error?.error ??
        (err as { message?: string })?.message ??
        'Something went wrong. Please try again.';
      this.error.set(message);
    } finally {
      this.pending.set(false);
    }
  }

  reset(): void {
    this.messages.set([]);
    this.error.set(null);
  }

  private append(message: Omit<ChatMessage, 'id'>): void {
    this.messages.update((current) => [
      ...current,
      { ...message, id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${current.length}` },
    ]);
  }
}

function formatActionSummary(
  actions: AgentTurnResponse['actions'],
): string | undefined {
  if (!actions.length) {
    return undefined;
  }

  return actions
    .map((action) => {
      if (action.tool === 'create_group' && action.result['created'] === true) {
        return `✓ create_group → ${String(action.result['name'])} (${String(action.result['groupId'])})`;
      }
      if (action.tool === 'list_groups') {
        const groups = action.result['groups'] as { name: string }[] | undefined;
        return `✓ list_groups → ${groups?.length ?? 0} groups`;
      }
      if (action.tool === 'invite_member' && action.result['invited'] === true) {
        return `✓ invite_member → ${String(action.result['invitee'])}`;
      }
      if (typeof action.result['error'] === 'string') {
        return `✗ ${action.tool}: ${action.result['error']}`;
      }
      return `✓ ${action.tool}`;
    })
    .join('\n');
}
