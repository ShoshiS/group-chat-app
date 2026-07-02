import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ToastData, ToastPanel } from '../../shared/toast/toast-panel';

/** Premium toast notifications — success, error, and info variants. */
@Injectable({ providedIn: 'root' })
export class Toast {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string, duration = 3000): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 4000): void {
    this.show(message, 'error', duration);
  }

  info(message: string, duration = 3000): void {
    this.show(message, 'info', duration);
  }

  private show(message: string, variant: ToastData['variant'], duration: number): void {
    this.snackBar.openFromComponent(ToastPanel, {
      data: { message, variant } satisfies ToastData,
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: ['premium-toast-panel', `premium-toast-panel--${variant}`],
    });
  }
}
