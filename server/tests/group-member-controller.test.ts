import { jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';

const userFindByIdMock = jest.fn();
const createMemberRemovedEventMock = jest.fn();

await jest.unstable_mockModule('../src/models/user-model.js', () => ({
  User: {
    findById: userFindByIdMock,
  },
}));

await jest.unstable_mockModule('../src/services/group-timeline-service.js', () => ({
  createMemberRemovedEvent: createMemberRemovedEventMock,
}));

const { removeMember } = await import('../src/controllers/group-controller.js');

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

describe('removeMember', () => {
  const next = jest.fn() as NextFunction & jest.Mock;
  const adminId = new Types.ObjectId();
  const memberId = new Types.ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();
    userFindByIdMock.mockReturnValue({
      select: jest.fn().mockResolvedValue({ username: 'dana' }),
    });
    createMemberRemovedEventMock.mockResolvedValue({});
  });

  it('removes a member from the group', async () => {
    const saveMock = jest.fn(async function (this: { members: Types.ObjectId[] }) {
      return this;
    });
    const group = {
      _id: new Types.ObjectId(),
      adminId,
      members: [adminId, memberId],
      save: saveMock,
    };

    const req = {
      params: { userId: memberId.toString() },
      group,
    } as unknown as Request;
    const res = createMockResponse();

    await removeMember(req, res, next);

    expect(group.members).toHaveLength(1);
    expect(group.members[0]?.equals(adminId)).toBe(true);
    expect(createMemberRemovedEventMock).toHaveBeenCalledWith({
      groupId: group._id,
      memberUsername: 'dana',
    });
    expect(saveMock).toHaveBeenCalled();
    expect(res.body).toBe(group);
  });

  it('returns 403 when removing the group admin', async () => {
    const group = {
      adminId,
      members: [adminId, memberId],
      save: jest.fn(),
    };

    const req = {
      params: { userId: adminId.toString() },
      group,
    } as unknown as Request;
    const res = createMockResponse();

    await removeMember(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'Cannot remove the group admin' });
    expect(createMemberRemovedEventMock).not.toHaveBeenCalled();
  });

  it('returns 404 when the user is not a member', async () => {
    const outsiderId = new Types.ObjectId();
    const group = {
      adminId,
      members: [adminId, memberId],
      save: jest.fn(),
    };

    const req = {
      params: { userId: outsiderId.toString() },
      group,
    } as unknown as Request;
    const res = createMockResponse();

    await removeMember(req, res, next);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'User is not a member of this group' });
    expect(createMemberRemovedEventMock).not.toHaveBeenCalled();
  });
});
