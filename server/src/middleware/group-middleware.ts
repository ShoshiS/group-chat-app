import type { NextFunction, Request, Response } from 'express';
import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

import { Group, type IGroup } from '../models/group-model.js';

/**
 * Loads the group from `req.params.id` and attaches it to `req.group`.
 * Expects `req.userId` to be set by authMiddleware.
 */
async function loadGroup(
  req: Request,
  res: Response,
): Promise<HydratedDocument<IGroup> | null> {
  const id = req.params['id'];

  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: 'Invalid group id' });
    return null;
  }

  const group = req.group ?? (await Group.findById(id));
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return null;
  }

  req.group = group;
  return group;
}

/** Ensures the authenticated user is listed in the group's members array. */
export async function isGroupMember(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const group = await loadGroup(req, res);
  if (!group) {
    return;
  }

  const isMember = group.members.some((memberId) => memberId.equals(req.userId!));
  if (!isMember) {
    res.status(403).json({ error: 'Not a group member' });
    return;
  }

  next();
}

/** Ensures the authenticated user is the group's admin (creator). */
export async function isGroupAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const group = await loadGroup(req, res);
  if (!group) {
    return;
  }

  if (!group.adminId.equals(req.userId!)) {
    res.status(403).json({ error: 'Group admin only' });
    return;
  }

  next();
}
