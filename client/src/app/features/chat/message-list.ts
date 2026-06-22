import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import type { Message } from '../../core/models/message';
import { MessageStore } from './message';
import { MessageItem } from './message-item';

function senderId(msg: Message): string {
  return typeof msg.senderId === 'object' ? msg.senderId.id : msg.senderId;
}

function sameMinute(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate() &&
    da.getHours() === db.getHours() &&
    da.getMinutes() === db.getMinutes()
  );
}

@Component({
  selector: 'app-message-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MessageItem, MatProgressSpinnerModule],
  templateUrl: './message-list.html',
  styleUrl: './message-list.scss',
})
export class MessageList implements AfterViewChecked {
  protected readonly store = inject(MessageStore);
  readonly groupId = input.required<string>();
  readonly searchQuery = input('');

  protected readonly visibleMessages = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const messages = this.store.messages();
    if (!query) {
      return messages;
    }
    return messages.filter((message) => message.text?.toLowerCase().includes(query));
  });

  private readonly listRef = viewChild<ElementRef<HTMLElement>>('messageList');
  private prevLength = 0;

  constructor() {
    effect(() => {
      this.groupId();
      this.prevLength = 0;
    });
  }

  ngAfterViewChecked(): void {
    const msgs = this.visibleMessages();
    if (msgs.length !== this.prevLength) {
      this.scrollToBottom();
      this.prevLength = msgs.length;
    }
  }

  protected async updateMessage(event: { id: string; text: string }): Promise<void> {
    await this.store.update(event.id, event.text);
  }

  protected async deleteMessage(id: string): Promise<void> {
    await this.store.remove(id);
  }

  protected showMeta(index: number): boolean {
    if (index === 0) {
      return true;
    }
    const msgs = this.visibleMessages();
    const prev = msgs[index - 1];
    const curr = msgs[index];
    return senderId(prev) !== senderId(curr) || !sameMinute(prev.createdAt, curr.createdAt);
  }

  protected isGrouped(index: number): boolean {
    if (index === 0) {
      return false;
    }
    const msgs = this.visibleMessages();
    const prev = msgs[index - 1];
    const curr = msgs[index];
    return senderId(prev) === senderId(curr) && sameMinute(prev.createdAt, curr.createdAt);
  }

  /** Tight spacing before the next message when it continues the same sender/minute group. */
  protected isFollowedByGrouped(index: number): boolean {
    const msgs = this.visibleMessages();
    if (index >= msgs.length - 1) {
      return false;
    }
    const curr = msgs[index];
    const next = msgs[index + 1];
    return senderId(curr) === senderId(next) && sameMinute(curr.createdAt, next.createdAt);
  }

  private scrollToBottom(): void {
    const el = this.listRef()?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
