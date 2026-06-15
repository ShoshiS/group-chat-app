import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import mongoose from 'mongoose';

import { env } from './config/env';
import { errorHandler } from './middleware/error-middleware.js';
import groupRoutes from './routes/group-routes.js';

/**
 * Builds the Express application. Kept separate from the HTTP/Socket.io
 * bootstrap so it can be imported in tests without opening a port.
 */
export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json());

  // Lightweight endpoint the client uses to confirm the API is reachable.
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  });

  // TODO: swap stubAuthMiddleware for authMiddleware once Tamar's auth slice merges.
  app.use('/api/groups', groupRoutes);

  app.use(errorHandler);

  return app;
}
