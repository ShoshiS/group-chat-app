import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MessageStore } from './message';

@Component({
  selector: 'app-message-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
    MatTooltipModule,
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
}
