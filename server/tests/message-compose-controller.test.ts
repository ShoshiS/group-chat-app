import { jest } from '@jest/globals';
import { type Request, type Response } from 'express';
import { Types } from 'mongoose';

const composeMessageWithAiMock = jest.fn();
const userFindByIdMock = jest.fn();

await jest.unstable_mockModule('../src/services/message-compose-service.js', () => ({
  composeMessage: composeMessageWithAiMock,
  validateCompose: {},
}));

await jest.unstable_mockModule('../src/models/user-model.js', () => ({
  User: {
    findById: userFindByIdMock,
  },
}));

const { composeMessage } = await import('../src/controllers/message-controller.js');

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

describe('composeMessage controller', () => {
  const userId = new Types.ObjectId('507f1f77bcf86cd799439011');
  const groupId = '507f1f77bcf86cd799439012';

  beforeEach(() => {
    jest.clearAllMocks();
    userFindByIdMock.mockReturnValue({
      select: jest.fn().mockResolvedValue({ username: 'Bob' }),
    });
  });

  it('returns composed text on success', async () => {
    composeMessageWithAiMock.mockResolvedValue('Sure, see you then!');
    const req = {
      params: { id: groupId },
      body: {},
      userId,
      group: { name: 'Team Chat' },
    } as unknown as Request;
    const res = createMockResponse();

    await composeMessage(req, res, jest.fn());

    expect(composeMessageWithAiMock).toHaveBeenCalledWith({
      groupId,
      groupName: 'Team Chat',
      username: 'Bob',
      draft: undefined,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ text: 'Sure, see you then!' });
  });

  it('returns 503 when Gemini is not configured', async () => {
    composeMessageWithAiMock.mockRejectedValue(new Error('GEMINI_API_KEY is not configured'));
    const req = {
      params: { id: groupId },
      body: { draft: 'hello' },
      userId,
      group: { name: 'Team Chat' },
    } as unknown as Request;
    const res = createMockResponse();

    await composeMessage(req, res, jest.fn());

    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({ error: 'GEMINI_API_KEY is not configured' });
  });

  it('returns 400 when there are no messages to reply to', async () => {
    composeMessageWithAiMock.mockRejectedValue(new Error('No messages to reply to yet'));
    const req = {
      params: { id: groupId },
      body: {},
      userId,
      group: { name: 'Team Chat' },
    } as unknown as Request;
    const res = createMockResponse();

    await composeMessage(req, res, jest.fn());

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'No messages to reply to yet' });
  });

  it('returns 401 when the user record is missing', async () => {
    userFindByIdMock.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });
    const req = {
      params: { id: groupId },
      body: {},
      userId,
      group: { name: 'Team Chat' },
    } as unknown as Request;
    const res = createMockResponse();

    await composeMessage(req, res, jest.fn());

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
    expect(composeMessageWithAiMock).not.toHaveBeenCalled();
  });
});
