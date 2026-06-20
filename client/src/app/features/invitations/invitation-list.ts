import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { InvitationStore } from '../../core/services/invitation';
import { InvitationActions } from './invitation-actions';

@Component({
  selector: 'app-invitation-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatProgressSpinnerModule, InvitationActions],
  templateUrl: './invitation-list.html',
  styleUrl: './invitation-list.scss',
})
export class InvitationList {
  protected readonly store = inject(InvitationStore);

  readonly acceptInvitation = output<string>();
  readonly rejectInvitation = output<string>();
}
