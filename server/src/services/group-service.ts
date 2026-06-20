import mongoose, { Types } from 'mongoose';

import { Group } from '../models/group-model';
import {
  InvitationError,
  createInvitationByGroupName,
} from './invitation-service';

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

export async function inviteMember(
  args: Record<string, unknown>,
  invitedById: Types.ObjectId,
): Promise<ToolResult> {
  assertDbConnected();

  const groupName = asString(args.groupName, 'groupName');
  const invitee = asString(args.invitee, 'invitee');

  try {
    const invitation = await createInvitationByGroupName({
      groupName,
      inviteeInput: invitee,
      invitedById,
    });

    return {
      invitationId: invitation._id.toString(),
      groupId: invitation.groupId.toString(),
      groupName: invitation.groupName,
      invitee: invitation.invitee,
      status: invitation.status,
      invited: true,
    };
  } catch (err) {
    if (err instanceof InvitationError) {
      return { error: err.message, invited: false };
    }
    throw err;
  }
}

export async function getAllGroupsForApi(): Promise<ToolResult[]> {
  assertDbConnected();
  const groups = await Group.find().sort({ createdAt: -1 });
  return groups.map((group) => group.toJSON() as ToolResult);
}
