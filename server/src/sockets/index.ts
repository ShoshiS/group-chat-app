import type { Application } from 'express';
import type { Server as HttpServer } from 'node:http';

import { Server as SocketServer } from 'socket.io';

import { corsOptions } from '../config/cors';

/**
 * Outgoing broadcast events. The REST layer stays the source of truth (it
 * persists to MongoDB); these events only notify the members of a group room
 * about a change that already succeeded.
 */
export const MESSAGE_EVENTS = {
  created: 'newMessage',
  updated: 'messageUpdated',
  deleted: 'messageDeleted',
} as const;

/** Key under which the Socket.io server is stored on the Express app. */
const IO_KEY = 'io';

/**
 * Attaches a Socket.io server to the given HTTP server and wires up the
 * connection lifecycle plus group-room membership. Messages are delivered only
 * to members of the relevant group: each socket joins a room named after the
 * `groupId`, and controllers broadcast with `io.to(groupId).emit(...)`.
 */
export function createSocketServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: corsOptions,
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.emit('connected', { socketId: socket.id });

    socket.on('joinGroup', (groupId: string) => {
      if (typeof groupId !== 'string' || !groupId) return;
      socket.join(groupId);
    });

    socket.on('leaveGroup', (groupId: string) => {
      if (typeof groupId !== 'string' || !groupId) return;
      socket.leave(groupId);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

/** Stores the Socket.io server on the Express app so controllers can reach it. */
export function attachIO(app: Application, io: SocketServer): void {
  app.set(IO_KEY, io);
}

/** Typed accessor for the Socket.io server attached via {@link attachIO}. */
export function getIO(app: Application): SocketServer | undefined {
  return app.get(IO_KEY) as SocketServer | undefined;
}
