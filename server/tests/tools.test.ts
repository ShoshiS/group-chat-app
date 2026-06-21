import { jest } from '@jest/globals';

const createGroupMock = jest.fn();
const inviteMemberMock = jest.fn();
const listGroupsMock = jest.fn();

await jest.unstable_mockModule('../src/services/group-service.js', () => ({
  createGroup: createGroupMock,
  inviteMember: inviteMemberMock,
  listGroups: listGroupsMock,
}));

const { executeTool } = await import('../src/services/agent/tools.js');

describe('executeTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an error for unknown tools', async () => {
    const result = await executeTool('unknown_tool', {});
    expect(result).toEqual({ error: 'Unknown tool: unknown_tool' });
  });

  it('delegates to create_group', async () => {
    createGroupMock.mockResolvedValue({ created: true, groupId: '1', name: 'Alpha' });

    const result = await executeTool('create_group', { name: 'Alpha' });

    expect(createGroupMock).toHaveBeenCalledWith({ name: 'Alpha' });
    expect(result).toEqual({ created: true, groupId: '1', name: 'Alpha' });
  });

  it('delegates to list_groups', async () => {
    listGroupsMock.mockResolvedValue({ groups: [{ name: 'Alpha' }] });

    const result = await executeTool('list_groups', {});

    expect(listGroupsMock).toHaveBeenCalled();
    expect(result).toEqual({ groups: [{ name: 'Alpha' }] });
  });

  it('delegates to invite_member', async () => {
    inviteMemberMock.mockResolvedValue({ invited: true, invitee: 'dana@example.com' });

    const result = await executeTool('invite_member', {
      groupName: 'Alpha',
      invitee: 'dana@example.com',
    });

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

    const result = await executeTool('create_group', { name: 'Alpha' });

    expect(result).toEqual({ error: 'Database is not connected' });
  });
});
