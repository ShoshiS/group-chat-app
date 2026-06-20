import type { NextFunction, Request, Response } from 'express';

import {
  InvitationError,
  acceptInvitation,
  createInvitationForGroup,
  listPendingForUser,
  rejectInvitation,
} from '../services/invitation-service.js';
import { listGroupTimeline } from '../services/group-timeline-service.js';

function handleInvitationError(
  err: unknown,
  res: Response,
  next: NextFunction,
): boolean {
  if (err instanceof InvitationError) {
    res.status(err.statusCode).json({ error: err.message });
    return true;
  }
  next(err);
  return false;
}

export async function listInvitations(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const invitations = await listPendingForUser(req.userId!);
    res.json(invitations);
  } catch (err) {
    if (!handleInvitationError(err, res, next)) {
      return;
    }
  }
}

export async function acceptInvitationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const invitation = await acceptInvitation(req.params['id']!, req.userId!);
    res.json(invitation);
  } catch (err) {
    if (!handleInvitationError(err, res, next)) {
      return;
    }
  }
}

export async function rejectInvitationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const invitation = await rejectInvitation(req.params['id']!, req.userId!);
    res.json(invitation);
  } catch (err) {
    if (!handleInvitationError(err, res, next)) {
      return;
    }
  }
}

export async function inviteToGroup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const invitation = await createInvitationForGroup({
      group: req.group!,
      inviteeInput: (req.body as { email: string }).email,
      invitedById: req.userId!,
    });
    res.status(201).json(invitation);
  } catch (err) {
    if (!handleInvitationError(err, res, next)) {
      return;
    }
  }
}

export async function listGroupInvitations(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const timeline = await listGroupTimeline(req.group!._id);
    res.json(timeline);
  } catch (err) {
    if (!handleInvitationError(err, res, next)) {
      return;
    }
  }
}
