import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';

/**
 * Dev-only stand-in for authMiddleware until Tamar's JWT auth lands.
 * Reads the user id from the `X-Test-User-Id` header (a valid MongoDB ObjectId).
 */
export function stubAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const rawId = req.header('X-Test-User-Id');

  if (!rawId || !Types.ObjectId.isValid(rawId)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  req.userId = new Types.ObjectId(rawId);
  next();
}
