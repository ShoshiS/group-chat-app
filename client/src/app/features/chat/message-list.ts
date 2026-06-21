import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MessageStore } from './message';
import { MessageItem } from './message-item';

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

  private readonly listRef = viewChild<ElementRef<HTMLElement>>('messageList');
  private prevLength = 0;

  ngAfterViewChecked(): void {
    const msgs = this.store.messages();
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

  private scrollToBottom(): void {
    const el = this.listRef()?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
