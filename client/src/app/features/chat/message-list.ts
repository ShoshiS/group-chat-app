import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  Injector,
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
export class MessageList {
  protected readonly store = inject(MessageStore);
  private readonly injector = inject(Injector);
  readonly groupId = input.required<string>();

  private readonly listRef = viewChild<ElementRef<HTMLElement>>('messageList');
  private prevLength = 0;

  constructor() {
    effect(() => {
      const length = this.store.messages().length;
      if (length === this.prevLength) return;
      this.prevLength = length;
      afterNextRender(() => this.scrollToBottom(), { injector: this.injector });
    });
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
