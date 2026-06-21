import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

import type { IGroup } from '../models/group-model.js';
import { Group } from '../models/group-model.js';
import { Invitation, type IInvitation } from '../models/invitation-model.js';
import { User } from '../models/user-model.js';

export class InvitationError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = 'InvitationError';
  }
}

/** Resolves an email address or username to a registered user's email. */
export async function resolveInviteeEmail(invitee: string): Promise<string> {
  const trimmed = invitee.trim();
  if (!trimmed) {
    throw new InvitationError('Invitee is required', 400);
  }

  if (trimmed.includes('@')) {
    const user = await User.findByEmail(trimmed);
    if (!user) {
      throw new InvitationError('No user registered with this email', 404);
    }
    return user.email;
  }

  const user = await User.findOne({ username: trimmed });
  if (!user) {
    throw new InvitationError('No user registered with this username', 404);
  }
  return user.email;
}

export async function createInvitationForGroup(params: {
  group: HydratedDocument<IGroup>;
  inviteeInput: string;
  invitedById: Types.ObjectId;
}): Promise<HydratedDocument<IInvitation>> {
  const inviteeEmail = await resolveInviteeEmail(params.inviteeInput);
  const inviteeUser = await User.findOne({ email: inviteeEmail });
  if (!inviteeUser) {
    throw new InvitationError('No user registered with this email', 404);
  }

  if (params.invitedById.equals(inviteeUser._id)) {
    throw new InvitationError('You cannot invite yourself', 400);
  }

  const isMember = params.group.members.some((memberId) => memberId.equals(inviteeUser._id));
  if (isMember) {
    throw new InvitationError('User is already a member', 409);
  }

  const duplicate = await Invitation.findDuplicatePending(params.group._id, inviteeEmail);
  if (duplicate) {
    throw new InvitationError('An invitation to this user is already pending', 409);
  }

  return Invitation.create({
    groupId: params.group._id,
    groupName: params.group.name,
    invitee: inviteeEmail,
    inviteeUsername: inviteeUser.username,
    invitedBy: params.invitedById,
    status: 'pending',
  });
}

export async function createInvitationByGroupName(params: {
  groupName: string;
  inviteeInput: string;
  invitedById: Types.ObjectId;
}): Promise<HydratedDocument<IInvitation>> {
  const group = await Group.findOne({ name: params.groupName.trim() });
  if (!group) {
    throw new InvitationError(`Group "${params.groupName}" was not found`, 404);
  }

  return createInvitationForGroup({
    group,
    inviteeInput: params.inviteeInput,
    invitedById: params.invitedById,
  });
}

export async function listPendingForUser(userId: Types.ObjectId): Promise<HydratedDocument<IInvitation>[]> {
  const user = await User.findById(userId);
  if (!user) {
    throw new InvitationError('User not found', 404);
  }

  return Invitation.findPendingForEmail(user.email);
}

export async function listForGroup(
  groupId: Types.ObjectId | string,
): Promise<HydratedDocument<IInvitation>[]> {
  const invitations = await Invitation.findForGroup(groupId);

  await Promise.all(
    invitations.map(async (invitation) => {
      if (invitation.inviteeUsername) {
        return;
      }

      const user = await User.findOne({ email: invitation.invitee });
      invitation.inviteeUsername = user?.username ?? invitation.invitee;
    }),
  );

  return invitations;
}

export async function acceptInvitation(
  invitationId: string,
  userId: Types.ObjectId,
): Promise<HydratedDocument<IInvitation>> {
  const user = await User.findById(userId);
  if (!user) {
    throw new InvitationError('User not found', 404);
  }

  const invitation = await Invitation.findById(invitationId);
  if (!invitation) {
    throw new InvitationError('Invitation not found', 404);
  }

  if (invitation.invitee !== user.email) {
    throw new InvitationError('Forbidden', 403);
  }

  if (invitation.status !== 'pending') {
    throw new InvitationError('Invitation is not pending', 400);
  }

  const group = await Group.findById(invitation.groupId);
  if (!group) {
    throw new InvitationError('Group not found', 404);
  }

  if (!group.members.some((memberId) => memberId.equals(user._id))) {
    group.members.push(user._id);
    await group.save();
  }

  invitation.status = 'accepted';
  await invitation.save();
  return invitation;
}

export async function rejectInvitation(
  invitationId: string,
  userId: Types.ObjectId,
): Promise<HydratedDocument<IInvitation>> {
  const user = await User.findById(userId);
  if (!user) {
    throw new InvitationError('User not found', 404);
  }

  const invitation = await Invitation.findById(invitationId);
  if (!invitation) {
    throw new InvitationError('Invitation not found', 404);
  }

  if (invitation.invitee !== user.email) {
    throw new InvitationError('Forbidden', 403);
  }

  if (invitation.status !== 'pending') {
    throw new InvitationError('Invitation is not pending', 400);
  }

  invitation.status = 'rejected';
  await invitation.save();
  return invitation;
}
