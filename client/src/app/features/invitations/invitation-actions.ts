import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import type { Invitation } from '../../core/models/invitation';

@Component({
  selector: 'app-invitation-actions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  templateUrl: './invitation-actions.html',
  styleUrl: './invitation-actions.scss',
})
export class InvitationActions {
  readonly invitation = input.required<Invitation>();
  readonly acceptInvitation = output<string>();
  readonly rejectInvitation = output<string>();

  protected onAccept(): void {
    this.acceptInvitation.emit(this.invitation().id);
  }

  protected onReject(): void {
    this.rejectInvitation.emit(this.invitation().id);
  }
}
