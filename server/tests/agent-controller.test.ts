import { jest } from '@jest/globals';
import { type Request, type Response } from 'express';
import { Types } from 'mongoose';

const runAgentTurnMock = jest.fn();

await jest.unstable_mockModule('../src/services/agent/agent-service.js', () => ({
  runAgentTurn: runAgentTurnMock,
}));

const { handleAgentChat } = await import('../src/controllers/agent-controller.js');

const testUserId = new Types.ObjectId('507f1f77bcf86cd799439011');

function createMockResponse(): Response & {
  statusCode: number;
  body: unknown;
} {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as Response & { statusCode: number; body: unknown };
}

describe('handleAgentChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects invalid message payloads', async () => {
    const req = { body: { messages: [{ role: 'user', text: 123 }] } } as Request;
    const res = createMockResponse();

    await handleAgentChat(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Body must be { messages: { role, text }[] }' });
    expect(runAgentTurnMock).not.toHaveBeenCalled();
  });

  it('rejects empty histories', async () => {
    const req = { body: { messages: [] } } as Request;
    const res = createMockResponse();

    await handleAgentChat(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'messages must not be empty' });
  });

  it('returns the agent turn on success', async () => {
    runAgentTurnMock.mockResolvedValue({ reply: 'Done', actions: [] });
    const req = {
      body: { messages: [{ role: 'user', text: 'list my groups' }] },
      userId: testUserId,
    } as Request;
    const res = createMockResponse();

    await handleAgentChat(req, res);

    expect(runAgentTurnMock).toHaveBeenCalledWith(
      [{ role: 'user', text: 'list my groups' }],
      testUserId,
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ reply: 'Done', actions: [] });
  });

  it('maps missing Gemini configuration to 503', async () => {
    runAgentTurnMock.mockRejectedValue(new Error('GEMINI_API_KEY is not configured'));
    const req = {
      body: { messages: [{ role: 'user', text: 'hello' }] },
    } as Request;
    const res = createMockResponse();

    await handleAgentChat(req, res);

    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({ error: 'GEMINI_API_KEY is not configured' });
  });
});
