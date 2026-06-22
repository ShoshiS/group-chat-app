import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastData {
  message: string;
  variant: ToastVariant;
}

@Component({
  selector: 'app-toast-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="toast-panel toast-panel--{{ data.variant }}">
      <mat-icon class="toast-panel__icon" aria-hidden="true">{{ icon() }}</mat-icon>
      <p class="toast-panel__message">{{ data.message }}</p>
      <button class="toast-panel__close" type="button" (click)="dismiss()" aria-label="Dismiss">
        <mat-icon>close</mat-icon>
      </button>
    </div>
  `,
  styleUrl: './toast-panel.scss',
})
export class ToastPanel {
  protected readonly data = inject<ToastData>(MAT_SNACK_BAR_DATA);
  private readonly snackBarRef = inject(MatSnackBarRef);

  protected icon(): string {
    switch (this.data.variant) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  }

  protected dismiss(): void {
    this.snackBarRef.dismiss();
  }
}
