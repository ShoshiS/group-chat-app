import mongoose from 'mongoose';

import { Group } from '../models/group-model';
import { Invitation } from '../models/invitation-model';

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

export async function createGroup(args: Record<string, unknown>): Promise<ToolResult> {
  assertDbConnected();

  const name = asString(args.name, 'name');
  const description =
    typeof args.description === 'string' ? args.description.trim() : '';

  const group = await Group.create({ name, description });

  return {
    groupId: group._id.toString(),
    name: group.name,
    description: group.description || null,
    created: true,
  };
}

export async function listGroups(): Promise<ToolResult> {
  assertDbConnected();

  const groups = await Group.find().sort({ createdAt: -1 }).lean();

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

  const group = await Group.findByName(groupName);
  if (!group) {
    return { error: `Group "${groupName}" was not found`, invited: false };
  }

  const invitation = await Invitation.create({
    groupId: group._id,
    groupName: group.name,
    invitee,
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
