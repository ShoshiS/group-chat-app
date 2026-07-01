import { jest } from '@jest/globals';
import { Types } from 'mongoose';

const upsertReadStateMock = jest.fn();
const findForUserMock = jest.fn();
const deleteForUserInGroupMock = jest.fn();
const messageFindOneMock = jest.fn();

await jest.unstable_mockModule('mongoose', () => ({
  default: {
    connection: { readyState: 1 },
  },
  Types,
}));

await jest.unstable_mockModule('../src/models/group-read-model.js', () => ({
  GroupReadState: {
    upsertReadState: upsertReadStateMock,
    findForUser: findForUserMock,
    deleteForUserInGroup: deleteForUserInGroupMock,
    findOne: jest.fn(),
  },
}));

await jest.unstable_mockModule('../src/models/message-model.js', () => ({
  Message: {
    findOne: messageFindOneMock,
  },
}));

const { markGroupRead, getLastReadAtMapForUser, deleteGroupReadState, GroupReadError } =
  await import('../src/services/group-read-service.js');

const userId = new Types.ObjectId('507f1f77bcf86cd799439011');
const groupId = new Types.ObjectId('507f1f77bcf86cd799439012');
const messageId = '507f1f77bcf86cd799439013';

describe('group-read-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('marks read using a specific message timestamp', async () => {
    const createdAt = new Date('2026-06-20T10:00:00.000Z');
    messageFindOneMock.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ createdAt }),
    });
    upsertReadStateMock.mockResolvedValue({ lastReadAt: createdAt });

    const result = await markGroupRead(userId, groupId, messageId);

    expect(messageFindOneMock).toHaveBeenCalledWith({ _id: messageId, groupId });
    expect(upsertReadStateMock).toHaveBeenCalledWith(userId, groupId, createdAt);
    expect(result).toEqual(createdAt);
  });

  it('throws 404 when messageId does not belong to the group', async () => {
    messageFindOneMock.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(markGroupRead(userId, groupId, messageId)).rejects.toMatchObject({
      message: 'Message not found in this group',
      statusCode: 404,
    });
    expect(upsertReadStateMock).not.toHaveBeenCalled();
  });

  it('marks read to latest message when messageId is omitted', async () => {
    const createdAt = new Date('2026-06-21T12:00:00.000Z');
    messageFindOneMock.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ createdAt }),
      }),
    });
    upsertReadStateMock.mockResolvedValue({ lastReadAt: createdAt });

    const result = await markGroupRead(userId, groupId);

    expect(result).toEqual(createdAt);
  });

  it('returns a map of lastReadAt values for groups', async () => {
    const readAt = new Date('2026-06-19T08:00:00.000Z');
    findForUserMock.mockResolvedValue([
      {
        groupId,
        lastReadAt: readAt,
      },
    ]);

    const result = await getLastReadAtMapForUser(userId, [groupId]);

    expect(findForUserMock).toHaveBeenCalledWith(userId, [groupId]);
    expect(result.get(groupId.toString())).toEqual(readAt);
  });

  it('deletes read state for a user in a group', async () => {
    deleteForUserInGroupMock.mockResolvedValue(undefined);

    await deleteGroupReadState(userId, groupId);

    expect(deleteForUserInGroupMock).toHaveBeenCalledWith(userId, groupId);
  });

  it('exposes GroupReadError with statusCode', () => {
    const error = new GroupReadError('Message not found in this group', 404);
    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(404);
  });
});
