import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

import type { Attachment, Message, MessageSender } from '../../core/models/message';
import { Auth } from '../../core/services/auth';
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
  readonly update = output<{ id: string; text: string }>();
  readonly delete = output<string>();

  private readonly auth = inject(Auth);

  protected readonly editing = signal(false);
  protected readonly previewImage = signal<Attachment | null>(null);
  protected readonly editControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(2000)],
  });

  constructor() {
    effect(() => {
      this.logPdfAttachments();
    });
  }

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

  protected onPdfClick(attachment: Attachment, event: MouseEvent): void {
    // #region agent log
    fetch('http://127.0.0.1:7436/ingest/d8a133c7-0636-453c-a4ac-ce2726dc7d38', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '947029' },
      body: JSON.stringify({
        sessionId: '947029',
        location: 'message-item.ts:onPdfClick',
        message: 'PDF link clicked',
        data: {
          url: attachment.url,
          originalName: attachment.originalName,
          type: attachment.type,
          defaultPrevented: event.defaultPrevented,
          href: (event.currentTarget as HTMLAnchorElement)?.href,
        },
        timestamp: Date.now(),
        hypothesisId: 'D',
      }),
    }).catch(() => {});
    fetch(attachment.url, { method: 'HEAD' })
      .then((res) => {
        fetch('http://127.0.0.1:7436/ingest/d8a133c7-0636-453c-a4ac-ce2726dc7d38', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '947029' },
          body: JSON.stringify({
            sessionId: '947029',
            location: 'message-item.ts:onPdfClick',
            message: 'PDF HEAD response',
            data: {
              url: attachment.url,
              status: res.status,
              ok: res.ok,
              contentType: res.headers.get('content-type'),
            },
            timestamp: Date.now(),
            hypothesisId: 'E',
          }),
        }).catch(() => {});
      })
      .catch((err) => {
        fetch('http://127.0.0.1:7436/ingest/d8a133c7-0636-453c-a4ac-ce2726dc7d38', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '947029' },
          body: JSON.stringify({
            sessionId: '947029',
            location: 'message-item.ts:onPdfClick',
            message: 'PDF HEAD failed',
            data: { url: attachment.url, error: String(err) },
            timestamp: Date.now(),
            hypothesisId: 'E',
          }),
        }).catch(() => {});
      });
    // #endregion
  }

  protected logPdfAttachments(): void {
    const pdfs = this.message().attachments?.filter((a) => a.type === 'pdf') ?? [];
    if (!pdfs.length) return;
    // #region agent log
    fetch('http://127.0.0.1:7436/ingest/d8a133c7-0636-453c-a4ac-ce2726dc7d38', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '947029' },
      body: JSON.stringify({
        sessionId: '947029',
        location: 'message-item.ts:logPdfAttachments',
        message: 'PDF attachments rendered',
        data: { messageId: this.message().id, pdfs },
        timestamp: Date.now(),
        hypothesisId: 'B-C',
      }),
    }).catch(() => {});
    // #endregion
  }
}
