import multer from 'multer';
import type { ErrorRequestHandler } from 'express';

/**
 * Central error handler — catches any error forwarded via next(err).
 * Multer errors (wrong type, size limit) map to 400. Errors with a
 * numeric `status` or `statusCode` property use that code. Everything
 * else falls back to 500. Stack traces are logged server-side only.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);

  if ((err as { type?: string }).type === 'entity.parse.failed') {
    res.status(400).json({
      error:
        'Invalid JSON body. Send one JSON object (e.g. {"text":"hello"}). Do not wrap the body in quotes or paste multiple JSON objects together.',
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the 10 MB limit' : err.message;
    res.status(400).json({ error: message });
    return;
  }

  const cloudinaryCode = (err as { http_code?: number }).http_code;
  if (cloudinaryCode) {
    const status = cloudinaryCode >= 400 && cloudinaryCode < 600 ? cloudinaryCode : 502;
    res.status(status).json({ error: (err as Error).message });
    return;
  }

  const status =
    (err as { status?: number }).status ?? (err as { statusCode?: number }).statusCode ?? 500;

  const message = status < 500 ? (err as Error).message : 'Internal server error';
  res.status(status).json({ error: message });
};
