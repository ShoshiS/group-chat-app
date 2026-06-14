import type { Request, Response } from 'express';

import validateGroup, { Group } from '../models/group-model.js';

export async function getMyGroups(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const groups = await Group.findForUser(req.userId);
    res.json(groups);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createGroup(req: Request, res: Response): Promise<void> {
  try {
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
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
}

/** Returns a single group. Requires isGroupMember middleware on the route. */
export async function getGroupById(req: Request, res: Response): Promise<void> {
  try {
    if (!req.group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    res.json(req.group);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
}

/** Updates group fields. Requires isGroupAdmin middleware on the route. */
export async function updateGroup(req: Request, res: Response): Promise<void> {
  try {
    if (!req.group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    const { error, value } = validateGroup.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details.map((d) => d.message).join(', ') });
      return;
    }

    req.group.name = value.name;
    if (value.description !== undefined) {
      req.group.description = value.description;
    }
    if (value.avatar !== undefined) {
      req.group.avatar = value.avatar;
    }

    const updated = await req.group.save();
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
}

/** Deletes the group. Requires isGroupAdmin middleware on the route. */
export async function deleteGroup(req: Request, res: Response): Promise<void> {
  try {
    if (!req.group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    await req.group.deleteOne();
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
}

/** Removes the authenticated user from members. Requires isGroupMember middleware. */
export async function leaveGroup(req: Request, res: Response): Promise<void> {
  try {
    if (!req.group || !req.userId) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    if (req.group.adminId.equals(req.userId)) {
      res.status(403).json({ error: 'admin must delete or transfer the group' });
      return;
    }

    req.group.members = req.group.members.filter((memberId) => !memberId.equals(req.userId));
    const updated = await req.group.save();
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
}
