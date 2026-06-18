import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

import { env } from '../config/env.js';

interface AccessTokenPayload {
  userId: string;
}

export function signToken(userId: Types.ObjectId | string): string {
  if (!env.jwtSecret) {
    throw new Error('JWT_SECRET is not defined. Set it in server/.env');
  }

  return jwt.sign({ userId: userId.toString() }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

/**
 * Verifies `Authorization: Bearer <token>` and attaches `req.userId`.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : undefined;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!env.jwtSecret) {
    res.status(500).json({ error: 'Internal server error' });
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AccessTokenPayload;

    if (!payload.userId || !Types.ObjectId.isValid(payload.userId)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    req.userId = new Types.ObjectId(payload.userId);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
