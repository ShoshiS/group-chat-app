import type { NextFunction, Request, RequestHandler, Response } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Factory that returns a rate-limiting middleware.
 * Tracks request counts per authenticated user (req.userId) with a fallback
 * to IP address. Responds with 429 when `max` requests are exceeded within
 * the rolling `windowMs` window.
 */
export function createRateLimiter(max: number, windowMs: number): RequestHandler {
  const store = new Map<string, RateLimitEntry>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.userId ? req.userId.toString() : (req.ip ?? 'unknown');
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (entry.count >= max) {
      res.status(429).json({ error: 'Too many requests, please try again later.' });
      return;
    }

    entry.count += 1;
    next();
  };
}
