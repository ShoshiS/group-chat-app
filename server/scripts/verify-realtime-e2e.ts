import { createServer } from 'node:http';

import { io, type Socket } from 'socket.io-client';
import { Types } from 'mongoose';

import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/database.js';
import { attachIO, createSocketServer } from '../src/sockets/index.js';

const USER_ID = new Types.ObjectId().toString();
const OTHER_ROOM_ID = new Types.ObjectId().toString();

type ApiResult = { status: number; body: unknown };

let baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
let ownServer: ReturnType<typeof createServer> | null = null;

async function api(path: string, init: RequestInit = {}): Promise<ApiResult> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('X-Test-User-Id', USER_ID);

  const res = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  return { status: res.status, body };
}

function waitForEvent(socket: Socket, event: string, timeoutMs = 5_000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out waiting for "${event}"`)),
      timeoutMs,
    );
    socket.once(event, (payload: unknown) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

function assertNoEvent(socket: Socket, event: string, windowMs = 1_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const handler = () => {
      clearTimeout(timer);
      reject(new Error(`Unexpected "${event}" received on isolated client`));
    };
    const timer = setTimeout(() => {
      socket.off(event, handler);
      resolve();
    }, windowMs);
    socket.on(event, handler);
  });
}

function connectClient(): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = io(baseUrl, { transports: ['websocket'] });
    const onError = (err: Error) => {
      socket.off('connect', onConnect);
      reject(err);
    };
    const onConnect = () => {
      socket.off('connect_error', onError);
      resolve(socket);
    };
    socket.once('connect', onConnect);
    socket.once('connect_error', onError);
  });
}

async function ensureServer(): Promise<void> {
  try {
    const health = await fetch(`${baseUrl}/api/health`);
    if (health.ok) return;
  } catch {
    // fall through — start an in-process server for the test run
  }

  await connectDB();
  const app = createApp();
  ownServer = createServer(app);
  const ioServer = createSocketServer(ownServer);
  attachIO(app, ioServer);

  await new Promise<void>((resolve) => {
    ownServer!.listen(0, () => {
      const address = ownServer!.address();
      if (address && typeof address === 'object') {
        baseUrl = `http://localhost:${address.port}`;
      }
      resolve();
    });
  });
}

async function shutdown(): Promise<void> {
  if (!ownServer) return;
  await new Promise<void>((resolve, reject) => {
    ownServer!.close((err) => (err ? reject(err) : resolve()));
  });
}

function pass(label: string): void {
  console.log(`PASS  ${label}`);
}

function fail(label: string, detail: string): never {
  console.error(`FAIL  ${label} — ${detail}`);
  process.exitCode = 1;
  throw new Error(detail);
}

async function main(): Promise<void> {
  const results: string[] = [];

  try {
    await ensureServer();

    const health = await fetch(`${baseUrl}/api/health`);
    if (!health.ok) fail('health', `status ${health.status}`);
    pass('health');
    results.push('health');

    const groupRes = await api('/api/groups', {
      method: 'POST',
      body: JSON.stringify({ name: 'Realtime E2E' }),
    });
    if (groupRes.status !== 201) {
      fail('create group', `status ${groupRes.status} — ${JSON.stringify(groupRes.body)}`);
    }
    const groupId = (groupRes.body as { id: string }).id;
    pass(`create group — ${groupId}`);
    results.push('create group');

    const [clientA, clientB, outsider] = await Promise.all([
      connectClient(),
      connectClient(),
      connectClient(),
    ]);

    clientA.emit('joinGroup', groupId);
    clientB.emit('joinGroup', groupId);
    outsider.emit('joinGroup', OTHER_ROOM_ID);

    const newMessageWaits = Promise.all([
      waitForEvent(clientA, 'newMessage'),
      waitForEvent(clientB, 'newMessage'),
      assertNoEvent(outsider, 'newMessage'),
    ]);

    const createRes = await api(`/api/groups/${groupId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text: 'hello realtime' }),
    });
    if (createRes.status !== 201) {
      fail('create message', `status ${createRes.status} — ${JSON.stringify(createRes.body)}`);
    }
    const messageId = (createRes.body as { id: string }).id;

    const [payloadA, payloadB] = await newMessageWaits;

    const textA = (payloadA as { text?: string }).text;
    const textB = (payloadB as { text?: string }).text;
    if (textA !== 'hello realtime' || textB !== 'hello realtime') {
      fail('newMessage payload', `expected "hello realtime", got A="${textA}" B="${textB}"`);
    }
    pass('newMessage — both room members');
    results.push('newMessage');

    const updateWaits = Promise.all([
      waitForEvent(clientA, 'messageUpdated'),
      waitForEvent(clientB, 'messageUpdated'),
      assertNoEvent(outsider, 'messageUpdated'),
    ]);

    const updateRes = await api(`/api/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ text: 'edited realtime' }),
    });
    if (updateRes.status !== 200) {
      fail('update message', `status ${updateRes.status} — ${JSON.stringify(updateRes.body)}`);
    }

    const [updatedA, updatedB] = await updateWaits;
    if (
      (updatedA as { text?: string }).text !== 'edited realtime' ||
      (updatedB as { text?: string }).text !== 'edited realtime'
    ) {
      fail('messageUpdated payload', 'text mismatch');
    }
    pass('messageUpdated — both room members');
    results.push('messageUpdated');

    const deleteWaits = Promise.all([
      waitForEvent(clientA, 'messageDeleted'),
      waitForEvent(clientB, 'messageDeleted'),
      assertNoEvent(outsider, 'messageDeleted'),
    ]);

    const deleteRes = await api(`/api/messages/${messageId}`, { method: 'DELETE' });
    if (deleteRes.status !== 204) {
      fail('delete message', `status ${deleteRes.status}`);
    }

    const [deletedA, deletedB] = await deleteWaits;
    const deletedPayloadA = deletedA as { id?: string; groupId?: string };
    const deletedPayloadB = deletedB as { id?: string; groupId?: string };
    if (deletedPayloadA.id !== messageId || deletedPayloadB.groupId !== groupId) {
      fail('messageDeleted payload', JSON.stringify({ deletedPayloadA, deletedPayloadB }));
    }
    pass('messageDeleted — both room members');
    results.push('messageDeleted');

    pass('room isolation — outsider received nothing');
    results.push('room isolation');

    await api(`/api/groups/${groupId}`, { method: 'DELETE' });

    clientA.disconnect();
    clientB.disconnect();
    outsider.disconnect();

    console.log(`\n${results.length}/${results.length} passed`);
  } finally {
    await shutdown();
  }
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
