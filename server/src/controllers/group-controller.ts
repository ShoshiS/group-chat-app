import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';

import { Group } from '../models/group-model.js';
import { User } from '../models/user-model.js';
import { getAllGroupsForApi } from '../services/group-service.js';
import { createMemberRemovedEvent } from '../services/group-timeline-service.js';

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
    const groups = await Group.findForUser(req.userId!);
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
export function getGroupById(req: Request, res: Response): void {
  res.json(req.group);
}

/** Returns member profiles for a group. Requires isGroupMember middleware. */
export async function getGroupMembers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const group = req.group!;
    const users = await User.find({ _id: { $in: group.members } })
      .select('username email')
      .sort({ username: 1 });

    res.json(
      users.map((user) => ({
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        isAdmin: group.adminId.equals(user._id),
      })),
    );
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
    if (avatar !== undefined) req.group!.avatar = avatar;

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

/** Removes a member from the group. Requires isGroupAdmin middleware. */
export async function removeMember(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.params['userId'];
    if (typeof userId !== 'string' || !Types.ObjectId.isValid(userId)) {
      res.status(400).json({ error: 'Invalid user id' });
      return;
    }

    const targetId = new Types.ObjectId(userId);
    const group = req.group!;

    if (group.adminId.equals(targetId)) {
      res.status(403).json({ error: 'Cannot remove the group admin' });
      return;
    }

    const isMember = group.members.some((memberId) => memberId.equals(targetId));
    if (!isMember) {
      res.status(404).json({ error: 'User is not a member of this group' });
      return;
    }

    const removedUser = await User.findById(targetId).select('username');
    group.members = group.members.filter((memberId) => !memberId.equals(targetId));
    const updated = await group.save();

    await createMemberRemovedEvent({
      groupId: group._id,
      memberUsername: removedUser?.username ?? 'Member',
    });

    res.json(updated);
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
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
