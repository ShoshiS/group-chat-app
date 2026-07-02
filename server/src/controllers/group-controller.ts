import type { NextFunction, Request, Response } from 'express';

import { Group } from '../models/group-model.js';
import { Invitation } from '../models/invitation-model.js';
import { User } from '../models/user-model.js';
import {
  GroupReadError,
  deleteGroupReadState,
  getLastReadAtForUser,
  markGroupRead,
} from '../services/group-read-service.js';
import { getAllGroupsForApi, getMyGroupsForApi } from '../services/group-service.js';

/** Lists all groups — used by the agent to verify group records in MongoDB. */
export async function listGroups(_req: Request, res: Response): Promise<void> {
  try {
    const groups = await getAllGroupsForApi();
    res.json({ groups });
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes('not connected') ? 503 : 500;
    res.status(status).json({ error: message });
  }
}

export async function getMyGroups(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const groups = await getMyGroupsForApi(req.userId!);
    res.json(groups);
  } catch (err) {
    next(err);
  }
}

export async function createGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const group = await Group.create({ ...req.body, adminId: req.userId });
    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
}

/** Returns a single group. Requires isGroupMember middleware on the route. */
export async function getGroupById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const lastReadAt = await getLastReadAtForUser(req.userId!, req.group!._id);
    const json = req.group!.toJSON() as Record<string, unknown>;
    res.json({
      ...json,
      lastReadAt: lastReadAt ? lastReadAt.toISOString() : null,
    });
  } catch (err) {
    next(err);
  }
}

/** Updates group fields. Requires isGroupAdmin middleware on the route. */
export async function updateGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, description, avatar } = req.body as {
      name: string;
      description?: string;
      avatar?: string;
    };

    req.group!.name = name;
    if (description !== undefined) req.group!.description = description;
    if (avatar !== undefined) {
      if (avatar === '') {
        req.group!.set('avatar', undefined);
      } else {
        req.group!.avatar = avatar;
      }
    }

    const updated = await req.group!.save();
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/** Deletes the group. Requires isGroupAdmin middleware on the route. */
export async function deleteGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await req.group!.deleteOne();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/** Removes the authenticated user from members. Requires isGroupMember middleware. */
export async function leaveGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.group!.adminId.equals(req.userId!)) {
      res.status(403).json({ error: 'admin must delete or transfer the group' });
      return;
    }

    req.group!.members = req.group!.members.filter((memberId) => !memberId.equals(req.userId));
    const updated = await req.group!.save();
    await deleteGroupReadState(req.userId!, req.group!._id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/** Returns member profiles for a group. Requires isGroupMember middleware. */
export async function getGroupMembers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const users = await User.find({ _id: { $in: req.group!.members } })
      .select('username avatar')
      .exec();

    res.json(
      users.map((user) => ({
        id: user._id.toString(),
        username: user.username,
        avatar: user.avatar ?? null,
      })),
    );
  } catch (err) {
    next(err);
  }
}

/** Sends a group invitation to an existing user by username or email. */
export async function inviteToGroup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const inviteeInput = (req.body as { invitee?: string }).invitee?.trim();
    if (!inviteeInput) {
      res.status(400).json({ error: 'invitee is required' });
      return;
    }

    const targetUser =
      (await User.findByUsername(inviteeInput)) ??
      (inviteeInput.includes('@') ? await User.findByEmail(inviteeInput) : null);

    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (req.group!.members.some((memberId) => memberId.equals(targetUser._id))) {
      res.status(400).json({ error: 'User is already a member' });
      return;
    }

    const duplicate = await Invitation.findOne({
      groupId: req.group!._id,
      inviteeUserId: targetUser._id,
      status: 'pending',
    });

    if (duplicate) {
      res.status(400).json({ error: 'Invitation already pending' });
      return;
    }

    const invitation = await Invitation.create({
      groupId: req.group!._id,
      groupName: req.group!.name,
      invitee: targetUser.username,
      inviteeUserId: targetUser._id,
      invitedBy: req.userId,
      status: 'pending',
    });

    res.status(201).json(invitation);
  } catch (err) {
    next(err);
  }
}

/** Marks messages in a group as read up to the latest or a specific message. */
export async function markGroupAsRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const messageId = (req.body as { messageId?: string }).messageId;
    const lastReadAt = await markGroupRead(req.userId!, req.params['id'] as string, messageId);
    res.json({ lastReadAt: lastReadAt.toISOString() });
  } catch (err) {
    if (err instanceof GroupReadError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}

/** Removes a member from the group. Requires isGroupAdmin middleware. */
export async function removeMember(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const memberId = req.params['userId'];
    if (!memberId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    if (req.group!.adminId.toString() === memberId) {
      res.status(403).json({ error: 'Cannot remove the group admin' });
      return;
    }

    if (req.userId!.toString() === memberId) {
      res.status(403).json({ error: 'Use leave group to remove yourself' });
      return;
    }

    const wasMember = req.group!.members.some((id) => id.toString() === memberId);
    if (!wasMember) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    req.group!.members = req.group!.members.filter((id) => id.toString() !== memberId);
    const updated = await req.group!.save();
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
