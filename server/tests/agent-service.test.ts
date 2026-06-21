import { jest } from '@jest/globals';
import { Types } from 'mongoose';

const executeToolMock = jest.fn<(...args: unknown[]) => Promise<Record<string, unknown>>>();
const generateContentMock = jest.fn();

await jest.unstable_mockModule('../src/services/agent/tools.js', () => ({
  executeTool: executeToolMock,
  functionDeclarations: [],
}));

await jest.unstable_mockModule('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: generateContentMock },
  })),
  FunctionCallingConfigMode: { AUTO: 'AUTO' },
}));

await jest.unstable_mockModule('../src/config/env.js', () => ({
  env: {
    geminiApiKey: 'test-key',
    geminiModel: 'gemini-test',
  },
  isProduction: false,
}));

const { runAgentTurn } = await import('../src/services/agent/agent-service.js');

const testUserId = new Types.ObjectId('507f1f77bcf86cd799439011');

describe('runAgentTurn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists groups deterministically without calling Gemini', async () => {
    executeToolMock.mockResolvedValue({
      groups: [{ name: 'Alpha' }, { name: 'Beta' }],
    });

    const turn = await runAgentTurn([{ role: 'user', text: 'מה הקבוצות שלי?' }], testUserId);

    expect(executeToolMock).toHaveBeenCalledWith('list_groups', {}, { userId: testUserId });
    expect(generateContentMock).not.toHaveBeenCalled();
    expect(turn.reply).toBe("יש לך 2 קבוצות: 'Alpha', 'Beta'.");
    expect(turn.actions).toEqual([
      {
        tool: 'list_groups',
        args: {},
        result: { groups: [{ name: 'Alpha' }, { name: 'Beta' }] },
      },
    ]);
  });

  it('creates a group deterministically when the name is present', async () => {
    executeToolMock.mockResolvedValue({
      created: true,
      groupId: 'group-1',
      name: 'Study Buddies',
    });

    const turn = await runAgentTurn(
      [{ role: 'user', text: 'create a group named Study Buddies' }],
      testUserId,
    );

    expect(executeToolMock).toHaveBeenCalledWith(
      'create_group',
      { name: 'Study Buddies' },
      { userId: testUserId },
    );
    expect(generateContentMock).not.toHaveBeenCalled();
    expect(turn.reply).toBe("Created a new group named 'Study Buddies' (id: group-1).");
  });

  it('returns a localized tool error for deterministic actions', async () => {
    executeToolMock.mockResolvedValue({ error: 'Database is not connected' });

    const turn = await runAgentTurn([{ role: 'user', text: 'list my groups' }], testUserId);

    expect(turn.reply).toBe('Could not complete the action: Database is not connected');
  });

  it('delegates to Gemini when create intent lacks a group name', async () => {
    generateContentMock.mockResolvedValue({
      functionCalls: [],
      text: 'What should the group be called?',
    });

    const turn = await runAgentTurn([{ role: 'user', text: 'create a group please' }], testUserId);

    expect(generateContentMock).toHaveBeenCalled();
    expect(executeToolMock).not.toHaveBeenCalled();
    expect(turn.reply).toBe('What should the group be called?');
    expect(turn.actions).toEqual([]);
  });

  it('executes Gemini function calls and returns the final text reply', async () => {
    generateContentMock
      .mockResolvedValueOnce({
        functionCalls: [{ name: 'invite_member', args: { groupName: 'Alpha', invitee: 'dana' } }],
      })
      .mockResolvedValueOnce({
        functionCalls: [],
        text: 'Invitation sent to dana.',
      });

    executeToolMock.mockResolvedValue({
      invited: true,
      invitee: 'dana',
      groupName: 'Alpha',
    });

    const turn = await runAgentTurn(
      [{ role: 'user', text: 'invite dana to Alpha group' }],
      testUserId,
    );

    expect(generateContentMock).toHaveBeenCalledTimes(2);
    expect(executeToolMock).toHaveBeenCalledWith(
      'invite_member',
      {
        groupName: 'Alpha',
        invitee: 'dana',
      },
      { userId: testUserId },
    );
    expect(turn.reply).toBe('Invitation sent to dana.');
    expect(turn.actions).toHaveLength(1);
  });
});
