import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Toast } from '../../core/services/toast';

@Component({
  selector: 'app-image-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './image-preview.html',
  styleUrl: './image-preview.scss',
})
export class ImagePreview {
  readonly url = input.required<string>();
  readonly filename = input.required<string>();
  readonly closed = output<void>();

  private readonly toast = inject(Toast);

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closed.emit();
  }

  protected async download(): Promise<void> {
    try {
      const response = await fetch(this.url());
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = this.filename();
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      this.toast.info('Could not download image. Opening in a new tab instead.');
      window.open(this.url(), '_blank', 'noopener');
    }
  }
}
