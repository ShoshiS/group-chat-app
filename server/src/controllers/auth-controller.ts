import type { NextFunction, Request, Response } from 'express';

import { signToken } from '../middleware/auth-middleware.js';
import { User } from '../models/user-model.js';
import {
  getGoogleClientId,
  isGoogleAuthConfigured,
  verifyGoogleIdToken,
} from '../services/google-auth-service.js';

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

function sanitizeUsername(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (normalized.length >= 3) {
    return normalized.slice(0, 20);
  }

  const fallback = (normalized || 'google').padEnd(3, '0');
  return `user_${fallback}`.slice(0, 20);
}

async function generateUniqueUsername(name: string | undefined, email: string): Promise<string> {
  const base = sanitizeUsername(name ?? email.split('@')[0] ?? 'user');
  let candidate = base;
  let suffix = 0;

  while (await User.findOne({ username: candidate }).exec()) {
    suffix += 1;
    candidate = `${base.slice(0, Math.max(3, 20 - String(suffix).length))}${suffix}`;
  }

  return candidate;
}

export async function getAuthConfig(_req: Request, res: Response): Promise<void> {
  res.json({
    googleClientId: getGoogleClientId(),
  });
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

export async function googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!isGoogleAuthConfigured()) {
      res.status(503).json({ error: 'Google Sign-In is not configured' });
      return;
    }

    const { credential } = req.body as { credential: string };
    const profile = await verifyGoogleIdToken(credential);

    let user = await User.findByGoogleId(profile.googleId);

    if (!user) {
      user = await User.findByEmail(profile.email);

      if (user) {
        if (user.googleId && user.googleId !== profile.googleId) {
          res.status(409).json({ error: 'Email already linked to another Google account' });
          return;
        }

        user.googleId = profile.googleId;
        if (!user.avatar && profile.picture) {
          user.avatar = profile.picture;
        }
        await user.save();
      } else {
        const username = await generateUniqueUsername(profile.name, profile.email);
        user = await User.create({
          googleId: profile.googleId,
          email: profile.email,
          username,
          avatar: profile.picture,
        });
      }
    }

    const token = signToken(user._id);

    res.json({
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'Invalid Google token') {
      res.status(401).json({ error: 'Invalid Google sign-in' });
      return;
    }

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

    const { username, avatar } = req.body as { username?: string; avatar?: string };

    if (username !== undefined) {
      user.username = username;
    }
    if (avatar !== undefined) {
      user.avatar = avatar;
    }

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

