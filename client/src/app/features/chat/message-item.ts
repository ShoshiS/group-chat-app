import { DatePipe, UpperCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

import type { Attachment, Message, MessageSender } from '../../core/models/message';
import { Auth } from '../../core/services/auth';
import { messageTimestampFormat } from '../../core/utils/message-time';
import { ImagePreview } from '../../shared/image-preview/image-preview';

@Component({
  selector: 'app-message-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    UpperCasePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    ImagePreview,
  ],
  templateUrl: './message-item.html',
  styleUrl: './message-item.scss',
})
export class MessageItem {
  readonly message = input.required<Message>();
  readonly showMeta = input(true);
  readonly isGrouped = input(false);
  readonly compactBottom = input(false);

  protected readonly timestampFormat = computed(() =>
    messageTimestampFormat(this.message().createdAt),
  );
  readonly update = output<{ id: string; text: string }>();
  readonly delete = output<string>();

  private readonly auth = inject(Auth);

  protected readonly editing = signal(false);
  protected readonly previewImage = signal<Attachment | null>(null);
  protected readonly editControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(2000)],
  });

  protected get sender(): MessageSender | null {
    const s = this.message().senderId;
    return typeof s === 'object' ? s : null;
  }

  protected get senderName(): string {
    return this.sender?.username ?? 'Unknown';
  }

  protected isOwn(): boolean {
    return this.sender?.id === this.auth.currentUser()?.id;
  }

  protected startEdit(): void {
    this.editControl.setValue(this.message().text ?? '');
    this.editing.set(true);
  }

  protected cancelEdit(): void {
    this.editing.set(false);
  }

  protected submitEdit(): void {
    if (this.editControl.invalid) return;
    this.update.emit({ id: this.message().id, text: this.editControl.value });
    this.editing.set(false);
  }

  protected confirmDelete(): void {
    if (confirm('Delete this message?')) {
      this.delete.emit(this.message().id);
    }
  }

  protected openImagePreview(attachment: Attachment): void {
    this.previewImage.set(attachment);
  }

  protected closeImagePreview(): void {
    this.previewImage.set(null);
  }
}
