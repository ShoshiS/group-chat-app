import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import type { GroupTimelineItem } from '../../core/models/group-timeline';
import { ChatSystemEvent } from './chat-system-event';
import { buildChatTimeline } from './chat-timeline';
import { MessageStore } from './message';
import { MessageItem } from './message-item';

@Component({
  selector: 'app-message-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MessageItem, ChatSystemEvent, MatProgressSpinnerModule],
  templateUrl: './message-list.html',
  styleUrl: './message-list.scss',
})
export class MessageList implements AfterViewChecked {
  protected readonly store = inject(MessageStore);
  readonly groupId = input.required<string>();
  readonly activities = input<GroupTimelineItem[]>([]);
  readonly activitiesLoading = input(false);

  protected readonly timeline = computed(() =>
    buildChatTimeline(this.store.messages(), this.activities()),
  );

  protected readonly isLoading = computed(() => this.store.loading() || this.activitiesLoading());

  private readonly listRef = viewChild<ElementRef<HTMLElement>>('messageList');
  private prevLength = 0;

  ngAfterViewChecked(): void {
    const length = this.timeline().length;
    if (length !== this.prevLength) {
      this.scrollToBottom();
      this.prevLength = length;
    }
  }

  protected async updateMessage(event: { id: string; text: string }): Promise<void> {
    await this.store.update(event.id, event.text);
  }

  protected async deleteMessage(id: string): Promise<void> {
    await this.store.remove(id);
  }

  private scrollToBottom(): void {
    const el = this.listRef()?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
