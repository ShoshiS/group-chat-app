import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { GroupStore } from './group';

@Component({
  selector: 'app-group-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './group-form.html',
  styleUrl: './group-form.scss',
})
export class GroupForm implements OnInit {
  private readonly store = inject(GroupStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isEdit = signal(false);
  protected readonly saving = signal(false);
  private editId = '';

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
    avatar: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(/^https?:\/\/.+/)],
    }),
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.editId = id;
      const group = this.store.getById(id);
      if (group) {
        this.form.setValue({
          name: group.name,
          description: group.description ?? '',
          avatar: group.avatar ?? '',
        });
      }
    }
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const { name, description, avatar } = this.form.getRawValue();
    const payload = {
      name,
      ...(description ? { description } : {}),
      ...(avatar ? { avatar } : {}),
    };

    try {
      if (this.isEdit()) {
        await this.store.update(this.editId, payload);
        this.snackBar.open('Group updated', 'OK', { duration: 3000 });
      } else {
        await this.store.create(payload);
        this.snackBar.open('Group created', 'OK', { duration: 3000 });
      }
      void this.router.navigate(['/groups']);
    } catch {
      this.snackBar.open('Failed to save group', 'OK', { duration: 3000 });
    } finally {
      this.saving.set(false);
    }
  }
}
