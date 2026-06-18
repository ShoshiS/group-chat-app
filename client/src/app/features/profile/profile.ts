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
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { Auth } from '../../core/services/auth';
import { environment } from '../../../environments/environment';

/**
 * Profile page: displays the logged-in user's info and allows updating the username.
 * Connects to GET/PUT /api/users/:id — endpoint wired by Tamar's user slice.
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
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly saving = signal(false);

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

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const userId = this.auth.currentUser()?.id;
    try {
      await firstValueFrom(
        this.http.put(`${environment.apiUrl}/users/${userId}`, this.form.getRawValue()),
      );
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
}
