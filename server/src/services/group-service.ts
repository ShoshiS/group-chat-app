import mongoose, { Types } from 'mongoose';

import { Group } from '../models/group-model';
import { Invitation } from '../models/invitation-model';
import { Message } from '../models/message-model';
import { User } from '../models/user-model';
import { getLastReadAtMapForUser } from './group-read-service.js';

export interface ToolResult {
  [key: string]: unknown;
}

function assertDbConnected(): void {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database is not connected. Check MONGO_URI and restart the server.');
  }
}

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

function asObjectId(value: unknown, field: string): Types.ObjectId {
  if (value instanceof Types.ObjectId) {
    return value;
  }
  if (typeof value === 'string' && Types.ObjectId.isValid(value)) {
    return new Types.ObjectId(value);
  }
  throw new Error(`${field} is required`);
}

export async function createGroup(args: Record<string, unknown>): Promise<ToolResult> {
  assertDbConnected();

  const name = asString(args.name, 'name');
  const description =
    typeof args.description === 'string' ? args.description.trim() : '';
  const adminId = asObjectId(args.adminId, 'adminId');

  const group = await Group.create({ name, description, adminId });

  return {
    groupId: group._id.toString(),
    name: group.name,
    description: group.description || null,
    created: true,
  };
}

export async function listGroups(userId: Types.ObjectId): Promise<ToolResult> {
  assertDbConnected();

  const groups = await Group.findForUser(userId);

  return {
    groups: groups.map((group) => ({
      groupId: group._id.toString(),
      name: group.name,
      description: group.description || null,
      createdAt: group.createdAt,
    })),
  };
}

export async function inviteMember(args: Record<string, unknown>): Promise<ToolResult> {
  assertDbConnected();

  const groupName = asString(args.groupName, 'groupName');
  const invitee = asString(args.invitee, 'invitee');

  const group = await Group.findOne({ name: groupName });
  if (!group) {
    return { error: `Group "${groupName}" was not found`, invited: false };
  }

  const targetUser =
    (await User.findByUsername(invitee)) ??
    (invitee.includes('@') ? await User.findByEmail(invitee) : null);

  const invitation = await Invitation.create({
    groupId: group._id,
    groupName: group.name,
    invitee: targetUser?.username ?? invitee,
    inviteeUserId: targetUser?._id,
    status: 'pending',
  });

  return {
    invitationId: invitation._id.toString(),
    groupId: group._id.toString(),
    groupName: group.name,
    invitee,
    status: invitation.status,
    invited: true,
  };
}

export async function getAllGroupsForApi(): Promise<ToolResult[]> {
  assertDbConnected();
  const groups = await Group.find().sort({ createdAt: -1 });
  return groups.map((group) => group.toJSON() as ToolResult);
}

/** Groups for the authenticated user, sorted by most recent message (newest first). */
export async function getMyGroupsForApi(
  userId: Types.ObjectId | string,
): Promise<ToolResult[]> {
  assertDbConnected();

  const groups = await Group.findForUser(userId);
  if (groups.length === 0) {
    return [];
  }

  const groupIds = groups.map((group) => group._id);
  const latest = await Message.aggregate<{ _id: Types.ObjectId; lastMessageAt: Date }>([
    { $match: { groupId: { $in: groupIds } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: '$groupId', lastMessageAt: { $first: '$createdAt' } } },
  ]);

  const lastByGroupId = new Map(
    latest.map((entry) => [entry._id.toString(), entry.lastMessageAt]),
  );
  const readByGroupId = await getLastReadAtMapForUser(userId, groupIds);

  return groups
    .map((group) => {
      const json = group.toJSON() as ToolResult;
      const groupId = group._id.toString();
      const lastMessageAt = lastByGroupId.get(groupId) ?? group.createdAt;
      const lastReadAt = readByGroupId.get(groupId) ?? null;
      return {
        ...json,
        lastMessageAt:
          lastMessageAt instanceof Date
            ? lastMessageAt.toISOString()
            : new Date(lastMessageAt).toISOString(),
        lastReadAt: lastReadAt ? lastReadAt.toISOString() : null,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt as string).getTime() -
        new Date(a.lastMessageAt as string).getTime(),
    );
}
