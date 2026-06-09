import { createServer } from 'node:http';

import { createApp } from './app';
import { connectDB } from './config/database';
import { env } from './config/env';
import { createSocketServer } from './sockets/index';

/**
 * Process entry point: connects the database, then starts the HTTP + Socket.io
 * server. A failed DB connection is logged but does not stop the server, so the
 * client ↔ server transport can still be exercised during early development.
 */
async function bootstrap(): Promise<void> {
  try {
    const connection = await connectDB();
    console.log(`MongoDB connected (${connection.host} / ${connection.name})`);
  } catch (error) {
    console.warn('MongoDB connection failed, starting server without DB:', (error as Error).message);
  }

  const app = createApp();
  const httpServer = createServer(app);
  createSocketServer(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`Server listening on http://localhost:${env.port} (${env.nodeEnv})`);
    console.log(`Health check: http://localhost:${env.port}/api/health`);
  });
}

bootstrap().catch((error) => {
  console.error('Fatal startup error:', (error as Error).message);
  process.exit(1);
});
