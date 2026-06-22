import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Auth } from '../../core/services/auth';
import { Toast } from '../../core/services/toast';

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_AVATAR_SIZE = 10 * 1024 * 1024;

/**
 * Profile page: displays the logged-in user's info and allows updating username and avatar.
 */
@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UpperCasePipe,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  protected readonly auth = inject(Auth);
  private readonly toast = inject(Toast);

  protected readonly saving = signal(false);
  protected readonly avatarPreview = signal<string | null>(null);

  private pendingAvatar: File | null = null;
  private previewObjectUrl: string | null = null;

  protected readonly form = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(30)],
    }),
  });

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.form.setValue({ username: user.username });
    }
  }

  protected displayAvatarUrl(): string | null {
    return this.avatarPreview() ?? this.auth.currentUser()?.avatar ?? null;
  }

  protected onAvatarPick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      this.toast.error('Avatar must be a JPEG, PNG, GIF, or WebP image');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      this.toast.error('Avatar must be 10 MB or smaller');
      return;
    }

    this.clearPreview();
    this.pendingAvatar = file;
    this.previewObjectUrl = URL.createObjectURL(file);
    this.avatarPreview.set(this.previewObjectUrl);
  }

  protected clearPendingAvatar(): void {
    this.clearPreview();
    this.pendingAvatar = null;
    this.avatarPreview.set(null);
  }

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    try {
      await this.auth.updateProfile({
        username: this.form.controls.username.value,
        avatarFile: this.pendingAvatar ?? undefined,
      });
      this.clearPreview();
      this.pendingAvatar = null;
      this.avatarPreview.set(null);
      this.toast.success('Profile updated');
    } catch {
      this.toast.error('Failed to update profile');
    } finally {
      this.saving.set(false);
    }
  }

  private clearPreview(): void {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
  }
}
