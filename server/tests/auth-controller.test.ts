import { jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';

const userCreateMock = jest.fn<(body: unknown) => Promise<unknown>>();
const userFindByEmailMock = jest.fn<(email: string) => Promise<unknown>>();
const userFindByGoogleIdMock = jest.fn<(googleId: string) => Promise<unknown>>();
const userFindByIdMock = jest.fn<(id: unknown) => Promise<unknown>>();
const userFindOneMock = jest.fn<(query: unknown) => { exec: () => Promise<unknown> }>();
const signTokenMock = jest.fn<(userId: unknown) => string>();
const verifyGoogleIdTokenMock = jest.fn<(credential: string) => Promise<unknown>>();
const isGoogleAuthConfiguredMock = jest.fn<() => boolean>();
const getGoogleClientIdMock = jest.fn<() => string>();

await jest.unstable_mockModule('../src/models/user-model.js', () => ({
  User: {
    create: userCreateMock,
    findByEmail: userFindByEmailMock,
    findByGoogleId: userFindByGoogleIdMock,
    findById: userFindByIdMock,
    findOne: userFindOneMock,
  },
}));

await jest.unstable_mockModule('../src/middleware/auth-middleware.js', () => ({
  signToken: signTokenMock,
}));

await jest.unstable_mockModule('../src/services/google-auth-service.js', () => ({
  verifyGoogleIdToken: verifyGoogleIdTokenMock,
  isGoogleAuthConfigured: isGoogleAuthConfiguredMock,
  getGoogleClientId: getGoogleClientIdMock,
}));

const { getAuthConfig, getMe, googleAuth, login, register, updateProfile } = await import(
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
    isGoogleAuthConfiguredMock.mockReturnValue(true);
    userFindOneMock.mockReturnValue({
      exec: jest.fn<() => Promise<unknown>>().mockResolvedValue(null),
    });
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

  describe('getAuthConfig', () => {
    it('returns the public Google client ID', async () => {
      getGoogleClientIdMock.mockReturnValue('123.apps.googleusercontent.com');

      const res = createMockResponse();
      await getAuthConfig({} as Request, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ googleClientId: '123.apps.googleusercontent.com' });
    });

    it('returns an empty client ID when Google auth is not configured', async () => {
      getGoogleClientIdMock.mockReturnValue('');

      const res = createMockResponse();
      await getAuthConfig({} as Request, res);

      expect(res.body).toEqual({ googleClientId: '' });
    });
  });

  describe('googleAuth', () => {
    it('returns token and user for an existing Google account', async () => {
      const user = {
        _id: userId,
        save: jest.fn<() => Promise<unknown>>(),
        toJSON: () => ({
          id: userId.toString(),
          username: 'tamar',
          email: 'tamar@example.com',
          role: 'user',
        }),
      };
      verifyGoogleIdTokenMock.mockResolvedValue({
        googleId: 'google-subject',
        email: 'tamar@example.com',
        name: 'Tamar',
      });
      userFindByGoogleIdMock.mockResolvedValue(user);

      const res = createMockResponse();
      await googleAuth({ body: { credential: 'valid-token' } } as Request, res, next);

      expect(verifyGoogleIdTokenMock).toHaveBeenCalledWith('valid-token');
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

    it('creates a user when the Google account is new', async () => {
      const createdUser = {
        _id: userId,
        toJSON: () => ({
          id: userId.toString(),
          username: 'tamar',
          email: 'tamar@example.com',
          role: 'user',
        }),
      };
      verifyGoogleIdTokenMock.mockResolvedValue({
        googleId: 'google-subject',
        email: 'tamar@example.com',
        name: 'Tamar Zisman',
        picture: 'https://example.com/avatar.jpg',
      });
      userFindByGoogleIdMock.mockResolvedValue(null);
      userFindByEmailMock.mockResolvedValue(null);
      userCreateMock.mockResolvedValue(createdUser);

      const res = createMockResponse();
      await googleAuth({ body: { credential: 'valid-token' } } as Request, res, next);

      expect(userCreateMock).toHaveBeenCalledWith({
        googleId: 'google-subject',
        email: 'tamar@example.com',
        username: 'tamar_zisman',
        avatar: 'https://example.com/avatar.jpg',
      });
      expect(res.statusCode).toBe(200);
    });

    it('returns 503 when Google auth is not configured', async () => {
      isGoogleAuthConfiguredMock.mockReturnValue(false);

      const res = createMockResponse();
      await googleAuth({ body: { credential: 'valid-token' } } as Request, res, next);

      expect(res.statusCode).toBe(503);
      expect(res.body).toEqual({ error: 'Google Sign-In is not configured' });
    });

    it('returns 401 for an invalid Google token', async () => {
      verifyGoogleIdTokenMock.mockRejectedValue(new Error('Invalid Google token'));

      const res = createMockResponse();
      await googleAuth({ body: { credential: 'bad-token' } } as Request, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({ error: 'Invalid Google sign-in' });
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
        avatar: undefined as string | undefined,
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

    it('updates avatar and returns the user', async () => {
      const user = {
        username: 'tamar',
        avatar: undefined as string | undefined,
        save: jest.fn<() => Promise<unknown>>().mockResolvedValue(undefined),
      };
      userFindByIdMock.mockResolvedValue(user);

      const req = {
        userId,
        body: { avatar: 'https://res.cloudinary.com/demo/image/upload/v1/user-avatars/avatar.jpg' },
      } as Request;
      const res = createMockResponse();

      await updateProfile(req, res, next);

      expect(user.avatar).toBe(
        'https://res.cloudinary.com/demo/image/upload/v1/user-avatars/avatar.jpg',
      );
      expect(user.username).toBe('tamar');
      expect(user.save).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
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
