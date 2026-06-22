import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';

import { Group } from '../models/group-model.js';
import { Invitation } from '../models/invitation-model.js';
import { User } from '../models/user-model.js';

/** Lists pending invitations addressed to the authenticated user. */
export async function getMyInvitations(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const invitations = await Invitation.find({
      status: 'pending',
      $or: [
        { inviteeUserId: req.userId },
        { invitee: user.username },
        { invitee: user.email },
      ],
    })
      .sort({ createdAt: -1 })
      .populate('invitedBy', 'username')
      .exec();

    res.json(
      invitations.map((invitation) => {
        const json = invitation.toJSON() as Record<string, unknown>;
        const invitedBy = invitation.invitedBy as { username?: string } | Types.ObjectId | null;
        json['invitedByUsername'] =
          invitedBy && typeof invitedBy === 'object' && 'username' in invitedBy
            ? invitedBy.username
            : null;
        json['inviteeUsername'] = invitation.invitee;
        return json;
      }),
    );
  } catch (err) {
    next(err);
  }
}

/** Accepts a pending invitation and adds the user to the group. */
export async function acceptInvitation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const invitation = await Invitation.findById(req.params['id']);
    if (!invitation || invitation.status !== 'pending') {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isRecipient =
      (invitation.inviteeUserId && invitation.inviteeUserId.equals(req.userId!)) ||
      invitation.invitee === user.username ||
      invitation.invitee === user.email;

    if (!isRecipient) {
      res.status(403).json({ error: 'Not your invitation' });
      return;
    }

    const group = await Group.findById(invitation.groupId);
    if (!group) {
      res.status(404).json({ error: 'Group no longer exists' });
      return;
    }

    if (!group.members.some((memberId) => memberId.equals(req.userId!))) {
      group.members.push(req.userId!);
      await group.save();
    }

    invitation.status = 'accepted';
    invitation.inviteeUserId = req.userId!;
    await invitation.save();

    res.json(invitation);
  } catch (err) {
    next(err);
  }
}

/** Rejects a pending invitation. */
export async function rejectInvitation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const invitation = await Invitation.findById(req.params['id']);
    if (!invitation || invitation.status !== 'pending') {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isRecipient =
      (invitation.inviteeUserId && invitation.inviteeUserId.equals(req.userId!)) ||
      invitation.invitee === user.username ||
      invitation.invitee === user.email;

    if (!isRecipient) {
      res.status(403).json({ error: 'Not your invitation' });
      return;
    }

    invitation.status = 'rejected';
    await invitation.save();

    res.json(invitation);
  } catch (err) {
    next(err);
  }
}
