import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import type { ChatEventStatus } from '../../core/models/group-timeline';

@Component({
  selector: 'app-chat-system-event',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './chat-system-event.html',
  styleUrl: './chat-system-event.scss',
})
export class ChatSystemEvent {
  readonly label = input.required<string>();
  readonly status = input.required<ChatEventStatus>();
  readonly at = input.required<string>();

  protected icon(): string {
    switch (this.status()) {
      case 'accepted':
        return 'person_add';
      case 'rejected':
        return 'person_off';
      case 'member_removed':
        return 'person_remove';
      default:
        return 'mail_outline';
    }
  }

  protected timeLabel(): string {
    return new Date(this.at()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
