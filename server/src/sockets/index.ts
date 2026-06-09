import type { Server as HttpServer } from 'node:http';

import { Server as SocketServer } from 'socket.io';

import { env } from '../config/env';

/**
 * Attaches a Socket.io server to the given HTTP server. For now this only
 * wires up the connection lifecycle so the client can verify the real-time
 * channel; feature-specific room/event handlers are added per slice.
 */
export function createSocketServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: { origin: env.clientOrigin, credentials: true },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.emit('connected', { socketId: socket.id });

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}
