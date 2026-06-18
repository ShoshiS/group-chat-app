import type { NextFunction, Request, Response } from 'express';

import { signToken } from '../middleware/auth-middleware.js';
import { User } from '../models/user-model.js';

function duplicateKeyMessage(err: unknown): string | null {
  if ((err as { code?: number }).code !== 11000) {
    return null;
  }

  const keyPattern = (err as { keyPattern?: Record<string, unknown> }).keyPattern;
  if (keyPattern?.email) {
    return 'Email already in use';
  }
  if (keyPattern?.username) {
    return 'Username already in use';
  }

  return 'Email or username already in use';
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.create(req.body);
    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    const duplicateMessage = duplicateKeyMessage(err);
    if (duplicateMessage) {
      res.status(409).json({ error: duplicateMessage });
      return;
    }

    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const user = await User.findByEmail(email);

    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = signToken(user._id);

    res.json({
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.username = (req.body as { username: string }).username;
    await user.save();

    res.json(user);
  } catch (err) {
    const duplicateMessage = duplicateKeyMessage(err);
    if (duplicateMessage) {
      res.status(409).json({ error: duplicateMessage });
      return;
    }

    next(err);
  }
}

