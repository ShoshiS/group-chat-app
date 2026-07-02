import type { NextFunction, Request, Response } from 'express';
import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

import { Group } from '../models/group-model.js';
import { Message, type IMessage } from '../models/message-model.js';

/**
 * Loads the message from `req.params.id` and attaches it to `req.message`.
 * Expects `req.userId` to be set by auth middleware.
 */
async function loadMessage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<HydratedDocument<IMessage> | null> {
  try {
    const id = req.params['id'];

    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return null;
    }

    if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid message id' });
      return null;
    }

    const message = req.message ?? (await Message.findById(id));
    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return null;
    }

    req.message = message;
    return message;
  } catch (err) {
    next(err);
    return null;
  }
}

/** Ensures the authenticated user is the message sender. */
export async function isMessageOwner(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const message = await loadMessage(req, res, next);
  if (!message) {
    return;
  }

  if (!message.senderId.equals(req.userId!)) {
    res.status(403).json({ error: 'Message owner only' });
    return;
  }

  next();
}

/** Ensures the authenticated user is the message sender or the admin of its group. */
export async function isMessageOwnerOrAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const message = await loadMessage(req, res, next);
  if (!message) {
    return;
  }

  if (message.senderId.equals(req.userId!)) {
    next();
    return;
  }

  try {
    const group = await Group.findById(message.groupId);
    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    if (!group.adminId.equals(req.userId!)) {
      res.status(403).json({ error: 'Message owner or group admin only' });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}
