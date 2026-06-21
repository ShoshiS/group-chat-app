import { jest } from '@jest/globals';
import { Types } from 'mongoose';

const groupCreateMock = jest.fn<(body: unknown) => Promise<unknown>>();
const groupFindOneMock = jest.fn<(query: unknown) => Promise<unknown>>();
const groupFindForUserMock = jest.fn<(userId: unknown) => Promise<unknown>>();
const invitationCreateMock = jest.fn<(body: unknown) => Promise<unknown>>();

await jest.unstable_mockModule('mongoose', () => ({
  default: {
    connection: { readyState: 1 },
  },
  Types,
}));

await jest.unstable_mockModule('../src/models/group-model.js', () => ({
  Group: {
    create: groupCreateMock,
    find: jest.fn(),
    findOne: groupFindOneMock,
    findForUser: groupFindForUserMock,
  },
}));

await jest.unstable_mockModule('../src/models/invitation-model.js', () => ({
  Invitation: {
    create: invitationCreateMock,
  },
}));

const { createGroup, inviteMember, listGroups } = await import('../src/services/group-service.js');

const testUserId = new Types.ObjectId('507f1f77bcf86cd799439011');

describe('group-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a group with trimmed fields and adminId', async () => {
    groupCreateMock.mockResolvedValue({
      _id: { toString: () => 'group-1' },
      name: 'Alpha',
      description: 'notes',
    });

    const result = await createGroup({
      name: '  Alpha  ',
      description: 'notes',
      adminId: testUserId,
    });

    expect(groupCreateMock).toHaveBeenCalledWith({
      name: 'Alpha',
      description: 'notes',
      adminId: testUserId,
    });
    expect(result).toEqual({
      groupId: 'group-1',
      name: 'Alpha',
      description: 'notes',
      created: true,
    });
  });

  it('lists groups for a user via findForUser', async () => {
    groupFindForUserMock.mockResolvedValue([
      {
        _id: { toString: () => 'group-1' },
        name: 'Alpha',
        description: '',
        createdAt: new Date('2026-01-01'),
      },
    ]);

    const result = await listGroups(testUserId);

    expect(groupFindForUserMock).toHaveBeenCalledWith(testUserId);
    expect(result).toEqual({
      groups: [
        {
          groupId: 'group-1',
          name: 'Alpha',
          description: null,
          createdAt: new Date('2026-01-01'),
        },
      ],
    });
  });

  it('creates an invitation when the group exists', async () => {
    groupFindOneMock.mockResolvedValue({
      _id: { toString: () => 'group-1' },
      name: 'Alpha',
    });
    invitationCreateMock.mockResolvedValue({
      _id: { toString: () => 'invite-1' },
      status: 'pending',
    });

    const result = await inviteMember({ groupName: 'Alpha', invitee: 'dana@example.com' });

    expect(groupFindOneMock).toHaveBeenCalledWith({ name: 'Alpha' });
    expect(invitationCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        groupName: 'Alpha',
        invitee: 'dana@example.com',
        status: 'pending',
      }),
    );
    expect(result).toEqual({
      invitationId: 'invite-1',
      groupId: 'group-1',
      groupName: 'Alpha',
      invitee: 'dana@example.com',
      status: 'pending',
      invited: true,
    });
  });

  it('returns a not-found payload when inviting to a missing group', async () => {
    groupFindOneMock.mockResolvedValue(null);

    const result = await inviteMember({ groupName: 'Missing', invitee: 'dana@example.com' });

    expect(result).toEqual({
      error: 'Group "Missing" was not found',
      invited: false,
    });
    expect(invitationCreateMock).not.toHaveBeenCalled();
  });

  it('requires a non-empty group name', async () => {
    await expect(createGroup({ name: '   ', adminId: testUserId })).rejects.toThrow(
      'name is required',
    );
  });

  it('requires adminId when creating a group', async () => {
    await expect(createGroup({ name: 'Alpha' })).rejects.toThrow('adminId is required');
  });
});
