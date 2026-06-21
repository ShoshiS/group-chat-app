import { jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';

const listPendingForUserMock = jest.fn();
const listGroupTimelineMock = jest.fn();
const acceptInvitationMock = jest.fn();
const rejectInvitationMock = jest.fn();
const createInvitationForGroupMock = jest.fn();

class InvitationError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
  }
}

await jest.unstable_mockModule('../src/services/invitation-service.js', () => ({
  InvitationError,
  listPendingForUser: listPendingForUserMock,
  acceptInvitation: acceptInvitationMock,
  rejectInvitation: rejectInvitationMock,
  createInvitationForGroup: createInvitationForGroupMock,
}));

await jest.unstable_mockModule('../src/services/group-timeline-service.js', () => ({
  listGroupTimeline: listGroupTimelineMock,
}));

const {
  acceptInvitationHandler,
  inviteToGroup,
  listInvitations,
  rejectInvitationHandler,
} = await import('../src/controllers/invitation-controller.js');

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

describe('invitation-controller', () => {
  const next = jest.fn() as NextFunction & jest.Mock;
  const userId = new Types.ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listInvitations', () => {
    it('returns pending invitations for the user', async () => {
      const invitations = [{ id: 'inv-1', groupName: 'Alpha' }];
      listPendingForUserMock.mockResolvedValue(invitations);

      const req = { userId } as Request;
      const res = createMockResponse();

      await listInvitations(req, res, next);

      expect(listPendingForUserMock).toHaveBeenCalledWith(userId);
      expect(res.body).toEqual(invitations);
    });

    it('maps InvitationError to status code', async () => {
      listPendingForUserMock.mockRejectedValue(new InvitationError('User not found', 404));

      const req = { userId } as Request;
      const res = createMockResponse();

      await listInvitations(req, res, next);

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ error: 'User not found' });
    });
  });

  describe('acceptInvitationHandler', () => {
    it('accepts an invitation', async () => {
      const invitation = { id: 'inv-1', status: 'accepted' };
      acceptInvitationMock.mockResolvedValue(invitation);

      const req = { userId, params: { id: 'inv-1' } } as unknown as Request;
      const res = createMockResponse();

      await acceptInvitationHandler(req, res, next);

      expect(acceptInvitationMock).toHaveBeenCalledWith('inv-1', userId);
      expect(res.body).toEqual(invitation);
    });
  });

  describe('rejectInvitationHandler', () => {
    it('rejects an invitation', async () => {
      const invitation = { id: 'inv-1', status: 'rejected' };
      rejectInvitationMock.mockResolvedValue(invitation);

      const req = { userId, params: { id: 'inv-1' } } as unknown as Request;
      const res = createMockResponse();

      await rejectInvitationHandler(req, res, next);

      expect(rejectInvitationMock).toHaveBeenCalledWith('inv-1', userId);
      expect(res.body).toEqual(invitation);
    });
  });

  describe('inviteToGroup', () => {
    it('creates an invitation for the group', async () => {
      const group = { _id: new Types.ObjectId(), name: 'Alpha', members: [] };
      const invitation = { id: 'inv-1', groupName: 'Alpha' };
      createInvitationForGroupMock.mockResolvedValue(invitation);

      const req = {
        userId,
        group,
        body: { email: 'friend@example.com' },
      } as unknown as Request;
      const res = createMockResponse();

      await inviteToGroup(req, res, next);

      expect(createInvitationForGroupMock).toHaveBeenCalledWith({
        group,
        inviteeInput: 'friend@example.com',
        invitedById: userId,
      });
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(invitation);
    });

    it('returns 409 when user is already a member', async () => {
      createInvitationForGroupMock.mockRejectedValue(
        new InvitationError('User is already a member', 409),
      );

      const req = {
        userId,
        group: { _id: new Types.ObjectId(), name: 'Alpha' },
        body: { email: 'friend@example.com' },
      } as unknown as Request;
      const res = createMockResponse();

      await inviteToGroup(req, res, next);

      expect(res.statusCode).toBe(409);
      expect(res.body).toEqual({ error: 'User is already a member' });
    });
  });
});
