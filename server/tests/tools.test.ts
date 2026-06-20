import { jest } from '@jest/globals';
import { Types } from 'mongoose';

const createGroupMock = jest.fn();
const inviteMemberMock = jest.fn();
const listGroupsMock = jest.fn();

await jest.unstable_mockModule('../src/services/group-service.js', () => ({
  createGroup: createGroupMock,
  inviteMember: inviteMemberMock,
  listGroups: listGroupsMock,
}));

const { executeTool } = await import('../src/services/agent/tools.js');

const context = { userId: new Types.ObjectId('507f1f77bcf86cd799439011') };

describe('executeTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an error for unknown tools', async () => {
    const result = await executeTool('unknown_tool', {}, context);
    expect(result).toEqual({ error: 'Unknown tool: unknown_tool' });
  });

  it('delegates to create_group', async () => {
    createGroupMock.mockResolvedValue({ created: true, groupId: '1', name: 'Alpha' });

    const result = await executeTool('create_group', { name: 'Alpha' }, context);

    expect(createGroupMock).toHaveBeenCalledWith({ name: 'Alpha', adminId: context.userId });
    expect(result).toEqual({ created: true, groupId: '1', name: 'Alpha' });
  });

  it('delegates to list_groups', async () => {
    listGroupsMock.mockResolvedValue({ groups: [{ name: 'Alpha' }] });

    const result = await executeTool('list_groups', {}, context);

    expect(listGroupsMock).toHaveBeenCalledWith(context.userId);
    expect(result).toEqual({ groups: [{ name: 'Alpha' }] });
  });

  it('delegates to invite_member', async () => {
    inviteMemberMock.mockResolvedValue({ invited: true, invitee: 'dana@example.com' });

    const result = await executeTool(
      'invite_member',
      {
        groupName: 'Alpha',
        invitee: 'dana@example.com',
      },
      context,
    );

    expect(inviteMemberMock).toHaveBeenCalledWith(
      {
        groupName: 'Alpha',
        invitee: 'dana@example.com',
      },
      context.userId,
    );
    expect(result).toEqual({ invited: true, invitee: 'dana@example.com' });
  });

  it('returns tool errors instead of throwing', async () => {
    createGroupMock.mockRejectedValue(new Error('Database is not connected'));

    const result = await executeTool('create_group', { name: 'Alpha' }, context);

    expect(result).toEqual({ error: 'Database is not connected' });
  });
});
