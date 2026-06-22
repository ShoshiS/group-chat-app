import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/** Fallback shell while chatEntryGuard resolves the target group. */
@Component({
  selector: 'app-chat-entry',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule],
  template: '<div class="chat-entry"><mat-spinner diameter="40" /></div>',
  styles: `
    :host {
      display: flex;
      flex: 1;
      align-items: center;
      justify-content: center;
      min-height: 0;
    }
  `,
})
export class ChatEntry {}
