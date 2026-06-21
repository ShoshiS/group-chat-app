import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Auth } from '../../core/services/auth';

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
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  protected readonly auth = inject(Auth);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly saving = signal(false);
  protected readonly avatarPreview = signal<string | null>(null);

  private pendingAvatar: File | null = null;
  private previewObjectUrl: string | null = null;

  protected readonly form = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(30)],
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
      this.snackBar.open('Use a JPEG, PNG, GIF, or WebP image', 'OK', { duration: 3000 });
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      this.snackBar.open('Image must be 10 MB or smaller', 'OK', { duration: 3000 });
      return;
    }

    this.clearPreview();
    this.pendingAvatar = file;
    this.previewObjectUrl = URL.createObjectURL(file);
    this.avatarPreview.set(this.previewObjectUrl);
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
      this.snackBar.open('Profile updated', 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Failed to update profile', 'OK', { duration: 3000 });
    } finally {
      this.saving.set(false);
    }
  }

  protected logout(): void {
    this.auth.logout();
  }

  private clearPreview(): void {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
  }
}
