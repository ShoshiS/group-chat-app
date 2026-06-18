import { jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';

const userCreateMock = jest.fn<(body: unknown) => Promise<unknown>>();
const userFindByEmailMock = jest.fn<(email: string) => Promise<unknown>>();
const userFindByIdMock = jest.fn<(id: unknown) => Promise<unknown>>();
const signTokenMock = jest.fn<(userId: unknown) => string>();

await jest.unstable_mockModule('../src/models/user-model.js', () => ({
  User: {
    create: userCreateMock,
    findByEmail: userFindByEmailMock,
    findById: userFindByIdMock,
  },
}));

await jest.unstable_mockModule('../src/middleware/auth-middleware.js', () => ({
  signToken: signTokenMock,
}));

const { getMe, login, register, updateProfile } = await import(
  '../src/controllers/auth-controller.js'
);

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

describe('auth-controller', () => {
  const next = jest.fn() as NextFunction & jest.Mock;
  const userId = new Types.ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();
    signTokenMock.mockReturnValue('signed-token');
  });

  describe('register', () => {
    it('creates a user and returns token + user', async () => {
      const createdUser = {
        _id: userId,
        toJSON: () => ({
          id: userId.toString(),
          username: 'tamar',
          email: 'tamar@example.com',
          role: 'user',
        }),
      };
      userCreateMock.mockResolvedValue(createdUser);

      const req = {
        body: {
          username: 'tamar',
          email: 'tamar@example.com',
          password: 'secret1',
        },
      } as Request;
      const res = createMockResponse();

      await register(req, res, next);

      expect(userCreateMock).toHaveBeenCalledWith(req.body);
      expect(signTokenMock).toHaveBeenCalledWith(userId);
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({
        token: 'signed-token',
        user: {
          id: userId.toString(),
          username: 'tamar',
          email: 'tamar@example.com',
          role: 'user',
        },
      });
    });

    it('returns 409 when email already exists', async () => {
      userCreateMock.mockRejectedValue({
        code: 11000,
        keyPattern: { email: 1 },
      });

      const res = createMockResponse();
      await register({ body: {} } as Request, res, next);

      expect(res.statusCode).toBe(409);
      expect(res.body).toEqual({ error: 'Email already in use' });
    });

    it('returns 409 when username already exists', async () => {
      userCreateMock.mockRejectedValue({
        code: 11000,
        keyPattern: { username: 1 },
      });

      const res = createMockResponse();
      await register({ body: {} } as Request, res, next);

      expect(res.statusCode).toBe(409);
      expect(res.body).toEqual({ error: 'Username already in use' });
    });

    it('forwards unexpected errors to next', async () => {
      const dbError = new Error('Database unavailable');
      userCreateMock.mockRejectedValue(dbError);

      const res = createMockResponse();
      await register({ body: {} } as Request, res, next);

      expect(next).toHaveBeenCalledWith(dbError);
    });
  });

  describe('login', () => {
    it('returns token and user for valid credentials', async () => {
      const user = {
        _id: userId,
        comparePassword: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
        toJSON: () => ({
          id: userId.toString(),
          username: 'tamar',
          email: 'tamar@example.com',
          role: 'user',
        }),
      };
      userFindByEmailMock.mockResolvedValue(user);

      const req = {
        body: { email: 'tamar@example.com', password: 'secret1' },
      } as Request;
      const res = createMockResponse();

      await login(req, res, next);

      expect(userFindByEmailMock).toHaveBeenCalledWith('tamar@example.com');
      expect(user.comparePassword).toHaveBeenCalledWith('secret1');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        token: 'signed-token',
        user: {
          id: userId.toString(),
          username: 'tamar',
          email: 'tamar@example.com',
          role: 'user',
        },
      });
    });

    it('returns 401 when user is not found', async () => {
      userFindByEmailMock.mockResolvedValue(null);

      const res = createMockResponse();
      await login(
        { body: { email: 'missing@example.com', password: 'secret1' } } as Request,
        res,
        next,
      );

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({ error: 'Invalid email or password' });
    });

    it('returns 401 when password is wrong', async () => {
      userFindByEmailMock.mockResolvedValue({
        comparePassword: jest.fn<() => Promise<boolean>>().mockResolvedValue(false),
      });

      const res = createMockResponse();
      await login(
        { body: { email: 'tamar@example.com', password: 'wrong' } } as Request,
        res,
        next,
      );

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({ error: 'Invalid email or password' });
    });
  });

  describe('getMe', () => {
    it('returns the authenticated user', async () => {
      const user = { id: userId.toString(), username: 'tamar' };
      userFindByIdMock.mockResolvedValue(user);

      const req = { userId } as Request;
      const res = createMockResponse();

      await getMe(req, res, next);

      expect(userFindByIdMock).toHaveBeenCalledWith(userId);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(user);
    });

    it('returns 404 when user is not found', async () => {
      userFindByIdMock.mockResolvedValue(null);

      const res = createMockResponse();
      await getMe({ userId } as Request, res, next);

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ error: 'User not found' });
    });
  });

  describe('updateProfile', () => {
    it('updates username and returns the user', async () => {
      const user = {
        username: 'oldname',
        save: jest.fn<() => Promise<unknown>>().mockResolvedValue(undefined),
      };
      userFindByIdMock.mockResolvedValue(user);

      const req = {
        userId,
        body: { username: 'newname' },
      } as Request;
      const res = createMockResponse();

      await updateProfile(req, res, next);

      expect(user.username).toBe('newname');
      expect(user.save).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(user);
    });

    it('returns 404 when user is not found', async () => {
      userFindByIdMock.mockResolvedValue(null);

      const res = createMockResponse();
      await updateProfile({ userId, body: { username: 'newname' } } as Request, res, next);

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ error: 'User not found' });
    });

    it('returns 409 when username already exists', async () => {
      const user = {
        username: 'oldname',
        save: jest.fn<() => Promise<never>>().mockRejectedValue({
          code: 11000,
          keyPattern: { username: 1 },
        }),
      };
      userFindByIdMock.mockResolvedValue(user);

      const res = createMockResponse();
      await updateProfile({ userId, body: { username: 'taken' } } as Request, res, next);

      expect(res.statusCode).toBe(409);
      expect(res.body).toEqual({ error: 'Username already in use' });
    });
  });
});
