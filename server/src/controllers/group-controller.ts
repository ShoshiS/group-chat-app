import type { NextFunction, Request, Response } from 'express';

import { Group } from '../models/group-model.js';

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
