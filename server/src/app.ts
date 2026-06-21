import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import mongoose from 'mongoose';

import { corsOptions } from './config/cors.js';
import { errorHandler } from './middleware/error-middleware.js';
import agentRouter from './routes/agent.js';
import authRoutes from './routes/auth-routes.js';
import groupRoutes from './routes/group-routes.js';
import { groupMessageRouter, messageRouter } from './routes/message-routes.js';

/**
 * Builds the Express application. Kept separate from the HTTP/Socket.io
 * bootstrap so it can be imported in tests without opening a port.
 */
export function createApp(): Express {
  const app = express();

  app.use(cors(corsOptions));
  app.use(express.json());

  app.use('/api/agent', agentRouter);
  app.use('/api/auth', authRoutes);

  // Lightweight endpoint the client uses to confirm the API is reachable.
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/groups', groupRoutes);
  app.use('/api/groups/:id/messages', groupMessageRouter);
  app.use('/api/messages', messageRouter);

  app.use(errorHandler);

  return app;
}
