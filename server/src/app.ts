import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import mongoose from 'mongoose';

import { corsOptions } from './config/cors';
import agentRouter from './routes/agent';
import groupsRouter from './routes/groups';

/**
 * Builds the Express application. Kept separate from the HTTP/Socket.io
 * bootstrap so it can be imported in tests without opening a port.
 */
export function createApp(): Express {
  const app = express();

  app.use(cors(corsOptions));
  app.use(express.json());

  app.use('/api/agent', agentRouter);
  app.use('/api/groups', groupsRouter);

  // Lightweight endpoint the client uses to confirm the API is reachable.
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
