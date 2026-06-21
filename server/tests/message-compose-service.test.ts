import { jest } from '@jest/globals';
import { Types } from 'mongoose';

const findByGroupMock = jest.fn<(...args: unknown[]) => Promise<unknown[]>>();
const generateContentMock = jest.fn<(...args: unknown[]) => Promise<{ text?: string }>>();

await jest.unstable_mockModule('../src/models/message-model.js', () => ({
  Message: {
    findByGroup: findByGroupMock,
  },
}));

await jest.unstable_mockModule('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: generateContentMock },
  })),
}));

await jest.unstable_mockModule('../src/config/env.js', () => ({
  env: {
    geminiApiKey: 'test-key',
    geminiModel: 'gemini-test',
  },
  isProduction: false,
}));

const { composeMessage } = await import('../src/services/message-compose-service.js');

const groupId = new Types.ObjectId('507f1f77bcf86cd799439011');

describe('composeMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    generateContentMock.mockResolvedValue({ text: 'Sounds good!' });
  });

  it('generates a reply when someone else sent the last message', async () => {
    findByGroupMock.mockResolvedValue([
      {
        senderId: { username: 'Alice' },
        text: 'Are we meeting tomorrow?',
        attachments: [],
      },
    ]);

    const text = await composeMessage({
      groupId,
      groupName: 'Team Chat',
      username: 'Bob',
    });

    expect(text).toBe('Sounds good!');
    expect(findByGroupMock).toHaveBeenCalledWith(groupId, { limit: 30 });
    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-test',
        contents: [
          expect.objectContaining({
            parts: [
              expect.objectContaining({
                text: expect.stringMatching(
                  /last message was sent by Alice, not by Bob[\s\S]*If it is a question directed at you or the group, answer it clearly/,
                ),
              }),
            ],
          }),
        ],
      }),
    );
  });

  it('continues the thread when the current user sent the last message', async () => {
    findByGroupMock.mockResolvedValue([
      {
        senderId: { username: 'Alice' },
        text: 'Can you send the file today?',
        attachments: [],
      },
      {
        senderId: { username: 'Bob' },
        text: 'Yes, I will send it this evening.',
        attachments: [],
      },
    ]);

    await composeMessage({
      groupId,
      groupName: 'Team Chat',
      username: 'Bob',
    });

    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: [
          expect.objectContaining({
            parts: [
              expect.objectContaining({
                text: expect.stringMatching(
                  /last message was sent by Bob \(the current user\)[\s\S]*Do NOT write a reply to yourself[\s\S]*Continue the conversation instead/,
                ),
              }),
            ],
          }),
        ],
      }),
    );
  });

  it('rewrites a draft while including conversation context', async () => {
    findByGroupMock.mockResolvedValue([
      {
        senderId: { username: 'Alice' },
        text: 'Can you review this?',
        attachments: [],
      },
    ]);

    const text = await composeMessage({
      groupId,
      groupName: 'Team Chat',
      username: 'Bob',
      draft: 'i can do it tomorow',
    });

    expect(text).toBe('Sounds good!');
    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: [
          expect.objectContaining({
            parts: [
              expect.objectContaining({
                text: expect.stringMatching(
                  /Draft to improve:\ni can do it tomorow[\s\S]*Rewrite the draft into a clearer/,
                ),
              }),
            ],
          }),
        ],
      }),
    );
  });

  it('rejects generate mode when there is no conversation context', async () => {
    findByGroupMock.mockResolvedValue([]);

    await expect(
      composeMessage({
        groupId,
        groupName: 'Team Chat',
        username: 'Bob',
      }),
    ).rejects.toThrow('No messages to reply to yet');

    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it('uses [attachment] for messages without text', async () => {
    findByGroupMock.mockResolvedValue([
      {
        senderId: { username: 'Alice' },
        attachments: [{ type: 'image' }],
      },
      {
        senderId: { username: 'Bob' },
        text: 'Nice photo!',
        attachments: [],
      },
    ]);

    await composeMessage({
      groupId,
      groupName: 'Team Chat',
      username: 'Bob',
    });

    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: [
          expect.objectContaining({
            parts: [
              expect.objectContaining({
                text: expect.stringMatching(
                  /Alice: \[attachment\][\s\S]*last message was sent by Bob \(the current user\)[\s\S]*Continue the conversation instead/,
                ),
              }),
            ],
          }),
        ],
      }),
    );
  });
});
