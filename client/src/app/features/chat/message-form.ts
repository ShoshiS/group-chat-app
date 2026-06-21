import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MessageStore } from './message';
import { EmojiPicker } from '../../shared/emoji-picker/emoji-picker';

@Component({
  selector: 'app-message-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    EmojiPicker,
  ],
  templateUrl: './message-form.html',
  styleUrl: './message-form.scss',
})
export class MessageForm {
  readonly groupId = input.required<string>();

  protected readonly store = inject(MessageStore);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly textControl = new FormControl('', { nonNullable: true });
  protected readonly pendingFiles = signal<File[]>([]);
  protected readonly sending = signal(false);
  protected readonly aiPending = signal(false);
  protected readonly aiTooltip = computed(() =>
    this.textControl.value.trim() ? 'Improve message' : 'Suggest a reply',
  );

  private readonly messageInput = viewChild<ElementRef<HTMLTextAreaElement>>('messageInput');

  protected get previews(): { url: string; name: string; type: string }[] {
    return this.pendingFiles().map((f) => ({
      url: f.type.startsWith('image/') ? URL.createObjectURL(f) : '',
      name: f.name,
      type: f.type,
    }));
  }

  protected onFilePick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const errors = MessageStore.validateFiles(files);
    if (errors.length) {
      const msg = errors.map((e) => `${e.file}: ${e.reason}`).join('\n');
      this.snackBar.open(msg, 'OK', { duration: 5000 });
      input.value = '';
      return;
    }
    this.pendingFiles.update((existing) => [...existing, ...files]);
    input.value = '';
  }

  protected removeFile(index: number): void {
    this.pendingFiles.update((files) => files.filter((_, i) => i !== index));
  }

  protected async send(): Promise<void> {
    const text = this.textControl.value.trim();
    const files = this.pendingFiles();
    if (!text && !files.length) return;

    this.sending.set(true);
    try {
      await this.store.send(this.groupId(), text, files);
      this.textControl.reset();
      this.pendingFiles.set([]);
    } catch {
      this.snackBar.open('Failed to send message', 'OK', { duration: 3000 });
    } finally {
      this.sending.set(false);
    }
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.send();
    }
  }

  protected insertEmoji(emoji: string): void {
    const textarea = this.messageInput()?.nativeElement;
    const current = this.textControl.value;

    if (!textarea) {
      this.textControl.setValue(current + emoji);
      return;
    }

    const start = textarea.selectionStart ?? current.length;
    const end = textarea.selectionEnd ?? start;
    const next = current.slice(0, start) + emoji + current.slice(end);
    this.textControl.setValue(next);

    queueMicrotask(() => {
      textarea.focus();
      const pos = start + emoji.length;
      textarea.setSelectionRange(pos, pos);
    });
  }

  protected async onAiCompose(): Promise<void> {
    if (this.aiPending() || this.sending()) {
      return;
    }

    const draft = this.textControl.value.trim();
    if (!draft && !this.hasTextMessages()) {
      this.snackBar.open('No messages to reply to yet', 'OK', { duration: 3000 });
      return;
    }

    this.aiPending.set(true);
    try {
      const text = await this.store.compose(this.groupId(), draft || undefined);
      this.textControl.setValue(text);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const serverError = (err as { error?: { error?: string } })?.error?.error;
      const message =
        status === 503
          ? 'AI is not configured'
          : serverError ?? 'Could not generate message';
      this.snackBar.open(message, 'OK', { duration: 4000 });
    } finally {
      this.aiPending.set(false);
    }
  }

  private hasTextMessages(): boolean {
    return this.store.messages().some((message) => !!message.text?.trim());
  }
}
