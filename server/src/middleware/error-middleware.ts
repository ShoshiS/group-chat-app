import type { ErrorRequestHandler } from 'express';

/**
 * Central error handler — catches any error forwarded via next(err) and returns a
 * generic 500 response. Stack traces are logged server-side only, never sent to clients.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};
