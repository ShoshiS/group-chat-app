import type { NextFunction, Request, Response } from 'express';

import { Message, type IMessage } from '../models/message-model.js';

/**
 * Lists a group's messages, oldest-first, paginated via the `before` cursor.
 * Requires isGroupMember middleware on the route (group id read from req.params.id).
 */
export async function getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const before = req.query['before'];
    const limit = req.query['limit'];

    const messages = await Message.findByGroup(req.params['id'] as string, {
      before: typeof before === 'string' ? before : undefined,
      limit: typeof limit === 'string' ? Number(limit) : undefined,
    });

    res.json(messages);
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a message in a group. Requires isGroupMember middleware on the route.
 * senderId is taken from the token and groupId from the route — never from the body.
 */
export async function createMessage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const message = await Message.create({
      ...req.body,
      groupId: req.params['id'],
      senderId: req.userId,
    });
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
}

/** Updates a message's content. Requires isMessageOwner middleware on the route. */
export async function updateMessage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { text, attachments } = req.body as {
      text?: string;
      attachments?: IMessage['attachments'];
    };

    if (text !== undefined) req.message!.text = text;
    if (attachments !== undefined) req.message!.attachments = attachments;

    const updated = await req.message!.save();
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/** Deletes a message. Requires isMessageOwnerOrAdmin middleware on the route. */
export async function deleteMessage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await req.message!.deleteOne();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
