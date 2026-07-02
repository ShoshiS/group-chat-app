import {

  ChangeDetectionStrategy,

  Component,

  ElementRef,

  computed,

  effect,

  inject,

  input,

  output,

  signal,

  untracked,

  viewChild,

} from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';



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

  imports: [MessageItem, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],

  templateUrl: './message-list.html',

  styleUrl: './message-list.scss',

})

export class MessageList {

  protected readonly store = inject(MessageStore);

  readonly groupId = input.required<string>();

  readonly searchQuery = input('');

  readonly readBoundaryAt = input<string | null>(null);
  readonly currentUserId = input<string | null>(null);

  readonly atBottomChange = output<boolean>();

  readonly jumpToLatest = output<void>();

  protected readonly atBottom = signal(true);

  protected readonly visibleMessages = computed(() => {

    const query = this.searchQuery().trim().toLowerCase();

    const messages = this.store.messages();

    if (!query) {

      return messages;

    }

    return messages.filter((message) => message.text?.toLowerCase().includes(query));

  });



  protected readonly unreadDividerIndex = computed(() => {
    const boundary = this.readBoundaryAt();
    if (!boundary || this.searchQuery().trim()) {
      return -1;
    }

    const boundaryTime = new Date(boundary).getTime();
    const messages = this.visibleMessages();
    const currentUserId = this.currentUserId();

    return messages.findIndex((message) => {
      if (currentUserId && senderId(message) === currentUserId) {
        return false;
      }
      return new Date(message.createdAt).getTime() > boundaryTime;
    });
  });



  private readonly listRef = viewChild<ElementRef<HTMLElement>>('messageList');

  private readonly unreadDividerRef = viewChild<ElementRef<HTMLElement>>('unreadDivider');

  private stickToBottom = true;

  private scrollScheduled = false;

  private loadingOlder = false;
  private initialScrollDone = false;



  constructor() {

    effect(() => {

      this.groupId();

      this.stickToBottom = true;
      this.initialScrollDone = false;
      this.atBottom.set(true);

    });



    effect(() => {

      const groupId = this.groupId();

      const loading = this.store.loading();

      const dividerIndex = this.unreadDividerIndex();

      this.visibleMessages();



      if (!groupId || loading || this.initialScrollDone) {

        return;

      }



      untracked(() => {

        if (dividerIndex >= 0) {

          this.stickToBottom = false;

          this.scheduleScrollToUnread();

        } else if (this.stickToBottom) {

          this.scheduleScrollToBottom();

        }

        this.initialScrollDone = true;

      });

    });



    effect(() => {
      const groupId = this.groupId();
      const loading = this.store.loading();
      this.visibleMessages();

      if (!groupId || loading || !this.stickToBottom || this.unreadDividerIndex() >= 0) {
        return;
      }

      untracked(() => this.scheduleScrollToBottom());
    });

  }



  protected onScroll(): void {

    const el = this.listRef()?.nativeElement;

    if (!el) {

      return;

    }



    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

    const atBottom = distanceFromBottom < 80;

    this.stickToBottom = atBottom;
    this.atBottom.set(atBottom);
    this.atBottomChange.emit(atBottom);

    if (

      el.scrollTop < 80 &&

      this.store.hasMore() &&

      !this.store.loadingOlder() &&

      !this.loadingOlder &&

      !this.searchQuery().trim()

    ) {

      void this.loadOlderPreservingScroll();

    }

  }



  protected async updateMessage(event: { id: string; text: string }): Promise<void> {

    await this.store.update(event.id, event.text);

  }



  protected async deleteMessage(id: string): Promise<void> {

    await this.store.remove(id);

  }

  protected jumpToLatestMessages(): void {
    this.stickToBottom = true;
    this.scheduleScrollToBottom();
    this.jumpToLatest.emit();
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



  private async loadOlderPreservingScroll(): Promise<void> {

    const el = this.listRef()?.nativeElement;

    if (!el) {

      return;

    }



    this.loadingOlder = true;

    const previousHeight = el.scrollHeight;

    try {

      await this.store.loadOlder(this.groupId());

      requestAnimationFrame(() => {

        el.scrollTop = el.scrollHeight - previousHeight;

      });

    } finally {

      this.loadingOlder = false;

    }

  }



  private scheduleScrollToBottom(): void {

    if (this.scrollScheduled) {

      return;

    }



    this.scrollScheduled = true;

    requestAnimationFrame(() => {

      requestAnimationFrame(() => {

        this.scrollScheduled = false;

        this.scrollToBottom();

      });

    });

  }



  private scheduleScrollToUnread(): void {

    if (this.scrollScheduled) {

      return;

    }



    this.scrollScheduled = true;

    requestAnimationFrame(() => {

      requestAnimationFrame(() => {

        this.scrollScheduled = false;

        const divider = this.unreadDividerRef()?.nativeElement;

        if (divider) {

          divider.scrollIntoView({ block: 'center' });
          this.atBottom.set(false);

          return;

        }

        this.scrollToBottom();

      });

    });

  }



  private scrollToBottom(): void {

    const el = this.listRef()?.nativeElement;

    if (el) {

      el.scrollTop = el.scrollHeight;
      this.atBottom.set(true);

    }

  }

}


