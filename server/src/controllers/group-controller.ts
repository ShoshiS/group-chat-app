import type { Request, Response } from 'express';

import validateGroup, { Group } from '../models/group-model.js';

export async function getMyGroups(req: Request, res: Response): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const groups = await Group.findForUser(req.userId);
  res.json(groups);
}

export async function createGroup(req: Request, res: Response): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { error, value } = validateGroup.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.details.map((d) => d.message).join(', ') });
    return;
  }

  const group = await Group.create({
    ...value,
    adminId: req.userId,
  });

  res.status(201).json(group);
}

/** Returns a single group. Requires isGroupMember middleware on the route. */
export async function getGroupById(req: Request, res: Response): Promise<void> {
  if (!req.group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  res.json(req.group);
}
