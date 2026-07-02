import { Types } from 'mongoose';

import { GroupReadState } from '../models/group-read-model.js';
import { Message } from '../models/message-model.js';

export async function getLastReadAtForUser(
  userId: Types.ObjectId | string,
  groupId: Types.ObjectId | string,
): Promise<Date | null> {
  const state = await GroupReadState.findOne({ userId, groupId }).exec();
  return state?.lastReadAt ?? null;
}

export async function getLastReadAtMapForUser(
  userId: Types.ObjectId | string,
  groupIds: Types.ObjectId[],
): Promise<Map<string, Date>> {
  const states = await GroupReadState.findForUser(userId, groupIds);
  return new Map(states.map((state) => [state.groupId.toString(), state.lastReadAt]));
}

export async function markGroupRead(
  userId: Types.ObjectId | string,
  groupId: Types.ObjectId | string,
  messageId?: string,
): Promise<Date> {
  let lastReadAt: Date;

  if (messageId) {
    const message = await Message.findOne({ _id: messageId, groupId }).exec();
    if (!message) {
      throw new GroupReadError('Message not found in this group', 404);
    }
    lastReadAt = message.createdAt;
  } else {
    const latest = await Message.findOne({ groupId }).sort({ _id: -1 }).exec();
    lastReadAt = latest?.createdAt ?? new Date();
  }

  const state = await GroupReadState.upsertReadState(userId, groupId, lastReadAt);
  return state.lastReadAt;
}

export async function deleteGroupReadState(
  userId: Types.ObjectId | string,
  groupId: Types.ObjectId | string,
): Promise<void> {
  await GroupReadState.deleteForUserInGroup(userId, groupId);
}

export class GroupReadError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = 'GroupReadError';
  }
}
