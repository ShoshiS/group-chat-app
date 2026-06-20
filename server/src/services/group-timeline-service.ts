import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

import { GroupEvent, type IGroupEvent } from '../models/group-event-model.js';
import type { IInvitation } from '../models/invitation-model.js';
import { listForGroup } from './invitation-service.js';

export type GroupTimelineKind = 'invitation' | 'member_removed';

export interface GroupTimelineItem {
  id: string;
  kind: GroupTimelineKind;
  at: string;
  status?: IInvitation['status'];
  invitee?: string;
  inviteeUsername?: string;
  memberUsername?: string;
}

export async function createMemberRemovedEvent(params: {
  groupId: Types.ObjectId;
  memberUsername: string;
}): Promise<HydratedDocument<IGroupEvent>> {
  return GroupEvent.create({
    groupId: params.groupId,
    type: 'member_removed',
    memberUsername: params.memberUsername,
  });
}

export async function listGroupTimeline(
  groupId: Types.ObjectId | string,
): Promise<GroupTimelineItem[]> {
  const [invitations, events] = await Promise.all([
    listForGroup(groupId),
    GroupEvent.findForGroup(groupId),
  ]);

  const invitationItems: GroupTimelineItem[] = invitations.map((invitation) => ({
    id: invitation._id.toString(),
    kind: 'invitation',
    at:
      invitation.status === 'pending'
        ? invitation.createdAt.toISOString()
        : invitation.updatedAt.toISOString(),
    status: invitation.status,
    invitee: invitation.invitee,
    inviteeUsername: invitation.inviteeUsername,
  }));

  const eventItems: GroupTimelineItem[] = events.map((event) => ({
    id: event._id.toString(),
    kind: 'member_removed',
    at: event.createdAt.toISOString(),
    memberUsername: event.memberUsername,
  }));

  return [...invitationItems, ...eventItems].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );
}
