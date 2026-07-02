import { jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

const TEST_SECRET = 'test-jwt-secret';

await jest.unstable_mockModule('../src/config/env.js', () => ({
  env: {
    jwtSecret: TEST_SECRET,
    jwtExpiresIn: '1h',
  },
}));

const { authMiddleware, signToken } = await import('../src/middleware/auth-middleware.js');

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

describe('signToken', () => {
  it('returns a JWT containing the userId', () => {
    const userId = new Types.ObjectId();
    const token = signToken(userId);

    const payload = jwt.verify(token, TEST_SECRET) as { userId: string };
    expect(payload.userId).toBe(userId.toString());
  });
});

describe('authMiddleware', () => {
  const next = jest.fn() as NextFunction & jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when Authorization header is missing', () => {
    const req = { header: () => undefined } as unknown as Request;
    const res = createMockResponse();

    authMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', () => {
    const req = {
      header: () => 'Bearer not-a-valid-token',
    } as unknown as Request;
    const res = createMockResponse();

    authMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when payload userId is not a valid ObjectId', () => {
    const token = jwt.sign({ userId: 'not-an-object-id' }, TEST_SECRET);
    const req = {
      header: () => `Bearer ${token}`,
    } as unknown as Request;
    const res = createMockResponse();

    authMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches userId and calls next for a valid Bearer token', () => {
    const userId = new Types.ObjectId();
    const token = signToken(userId);
    const req = {
      header: (name: string) => (name === 'Authorization' ? `Bearer ${token}` : undefined),
    } as unknown as Request;
    const res = createMockResponse();

    authMiddleware(req, res, next);

    expect(req.userId?.toString()).toBe(userId.toString());
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('signToken without JWT_SECRET', () => {
  it('throws a clear error', async () => {
    jest.resetModules();
    await jest.unstable_mockModule('../src/config/env.js', () => ({
      env: {
        jwtSecret: '',
        jwtExpiresIn: '1h',
      },
    }));

    const { signToken: signTokenWithoutSecret } = await import('../src/middleware/auth-middleware.js');

    expect(() => signTokenWithoutSecret(new Types.ObjectId())).toThrow('JWT_SECRET is not defined');
  });
});

describe('authMiddleware without JWT_SECRET', () => {
  it('returns 500 when secret is missing', async () => {
    jest.resetModules();
    await jest.unstable_mockModule('../src/config/env.js', () => ({
      env: {
        jwtSecret: '',
        jwtExpiresIn: '1h',
      },
    }));

    const { authMiddleware: middlewareWithoutSecret } = await import(
      '../src/middleware/auth-middleware.js'
    );

    const req = {
      header: () => 'Bearer some-token',
    } as unknown as Request;
    const res = createMockResponse();
    const next = jest.fn() as NextFunction & jest.Mock;

    middlewareWithoutSecret(req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
    expect(next).not.toHaveBeenCalled();
  });
});
