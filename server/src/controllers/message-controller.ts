import type { NextFunction, Request, Response } from 'express';

import { Message, type IMessage } from '../models/message-model.js';
import { MESSAGE_EVENTS, getIO } from '../sockets/index.js';

/**
 * Broadcasts a real-time event to the members of a group's room. Best-effort:
 * a Socket.io failure (or a missing io, e.g. in tests) must never break the
 * already-completed HTTP response, so it is logged and swallowed.
 */
function broadcast(req: Request, groupId: string, event: string, payload: unknown): void {
  try {
    getIO(req.app)?.to(groupId).emit(event, payload);
  } catch (err) {
    console.error(`Socket broadcast failed (${event}):`, (err as Error).message);
  }
}

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
    const groupId = req.params['id'] as string;
    const message = await Message.create({
      ...req.body,
      groupId,
      senderId: req.userId,
    });
    res.status(201).json(message);
    broadcast(req, groupId, MESSAGE_EVENTS.created, message.toJSON());
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
    broadcast(req, updated.groupId.toString(), MESSAGE_EVENTS.updated, updated.toJSON());
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
    const { id } = req.message!;
    const groupId = req.message!.groupId.toString();
    await req.message!.deleteOne();
    res.status(204).send();
    broadcast(req, groupId, MESSAGE_EVENTS.deleted, { id, groupId });
  } catch (err) {
    next(err);
  }
}
