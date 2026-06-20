import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import {
  type GroupInvitationActivity,
  invitationActivityLabel,
} from '../../core/models/group-invitation-activity';

@Component({
  selector: 'app-group-invitation-activity',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './group-invitation-activity.html',
  styleUrl: './group-invitation-activity.scss',
})
export class GroupInvitationActivityList {
  readonly activities = input.required<GroupInvitationActivity[]>();
  readonly loading = input(false);

  protected readonly pendingActivities = computed(() =>
    this.activities().filter((activity) => activity.status === 'pending'),
  );

  protected readonly recentActivities = computed(() =>
    this.activities().filter((activity) => activity.status !== 'pending'),
  );

  protected label(activity: GroupInvitationActivity): string {
    return invitationActivityLabel(activity);
  }

  protected icon(activity: GroupInvitationActivity): string {
    switch (activity.status) {
      case 'accepted':
        return 'person_add';
      case 'rejected':
        return 'person_off';
      default:
        return 'schedule';
    }
  }
}
