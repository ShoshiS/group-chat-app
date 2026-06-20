import type { InvitationStatus } from './invitation';

export type GroupTimelineKind = 'invitation' | 'member_removed';
export type ChatEventStatus = InvitationStatus | 'member_removed';

export interface GroupTimelineItem {
  id: string;
  kind: GroupTimelineKind;
  at: string;
  status?: InvitationStatus;
  invitee?: string;
  inviteeUsername?: string;
  memberUsername?: string;
}

export function groupTimelineLabel(item: GroupTimelineItem): string {
  if (item.kind === 'member_removed') {
    return `${item.memberUsername ?? 'Member'} was removed from the group`;
  }

  const name = item.inviteeUsername || item.invitee || 'Member';

  switch (item.status) {
    case 'pending':
      return `Invitation sent to ${name}`;
    case 'accepted':
      return `${name} joined the group`;
    case 'rejected':
      return `${name} declined the invitation`;
    default:
      return `Group update`;
  }
}

export function groupTimelineEventStatus(item: GroupTimelineItem): ChatEventStatus {
  if (item.kind === 'member_removed') {
    return 'member_removed';
  }
  return item.status ?? 'pending';
}

/** @deprecated Use GroupTimelineItem */
export type GroupInvitationActivity = GroupTimelineItem;

/** @deprecated Use groupTimelineLabel */
export const invitationActivityLabel = groupTimelineLabel;
