import type { InvitationStatus } from './invitation';

export interface GroupInvitationActivity {
  id: string;
  invitee: string;
  inviteeUsername: string;
  status: InvitationStatus;
  createdAt: string;
  updatedAt: string;
}

export function invitationActivityLabel(activity: GroupInvitationActivity): string {
  const name = activity.inviteeUsername || activity.invitee;

  switch (activity.status) {
    case 'pending':
      return `Invitation sent to ${name}`;
    case 'accepted':
      return `${name} joined the group`;
    case 'rejected':
      return `${name} declined the invitation`;
  }
}
