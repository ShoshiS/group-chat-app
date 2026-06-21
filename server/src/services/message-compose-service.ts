import { GoogleGenAI } from '@google/genai';
import Joi from 'joi';
import { Types } from 'mongoose';

import { env } from '../config/env.js';
import { Message } from '../models/message-model.js';

const CONTEXT_LIMIT = 30;
const MAX_TEXT_LENGTH = 2000;

export const validateCompose = Joi.object({
  draft: Joi.string().max(MAX_TEXT_LENGTH).allow('').optional(),
});

export interface ComposeMessageInput {
  groupId: Types.ObjectId | string;
  groupName: string;
  username: string;
  draft?: string;
}

interface ContextMessage {
  username: string;
  text: string;
}

let client: GoogleGenAI | undefined;

function getClient(): GoogleGenAI {
  if (!env.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  client ??= new GoogleGenAI({ apiKey: env.geminiApiKey });
  return client;
}

function resolveSenderUsername(senderId: unknown): string {
  if (typeof senderId === 'object' && senderId !== null && 'username' in senderId) {
    return String((senderId as { username: string }).username);
  }
  return 'Unknown';
}

function toContextText(text?: string, attachments?: unknown[]): string {
  const trimmed = text?.trim();
  if (trimmed) {
    return trimmed;
  }
  if (attachments?.length) {
    return '[attachment]';
  }
  return '';
}

function formatConversation(messages: ContextMessage[]): string {
  return messages.map((message) => `${message.username}: ${message.text}`).join('\n');
}

function isCurrentUserLastSpeaker(messages: ContextMessage[], username: string): boolean {
  const lastMessage = messages.at(-1);
  if (!lastMessage) {
    return false;
  }
  return lastMessage.username.trim().toLowerCase() === username.trim().toLowerCase();
}

function buildGeneratePrompt(groupName: string, username: string, messages: ContextMessage[]): string {
  const currentUserSpokeLast = isCurrentUserLastSpeaker(messages, username);
  const lastMessage = messages.at(-1);

  const roleInstructions = currentUserSpokeLast
    ? [
        `The last message was sent by ${username} (the current user).`,
        'Do NOT write a reply to yourself or repeat what you already said.',
        'Continue the conversation instead: add a follow-up thought, ask a related question,',
        'share the next useful detail, or gently move the thread forward.',
      ]
    : [
        `The last message was sent by ${lastMessage?.username ?? 'someone else'}, not by ${username}.`,
        `Write a natural reply from ${username} to that last message.`,
        'If it is a question directed at you or the group, answer it clearly.',
        'If it is a statement, respond appropriately (acknowledge, agree, disagree politely, etc.).',
      ];

  return [
    `Group: ${groupName}`,
    `You are helping ${username} write a group chat message.`,
    '',
    'Recent conversation:',
    formatConversation(messages),
    '',
    ...roleInstructions,
    'Match the conversation language. Be concise and friendly.',
    'Return ONLY the message text — no quotes, no explanation.',
  ].join('\n');
}

function buildPolishPrompt(
  groupName: string,
  username: string,
  messages: ContextMessage[],
  draft: string,
): string {
  const conversationSection =
    messages.length > 0
      ? ['Recent conversation (for context):', formatConversation(messages), '']
      : [];

  return [
    `Group: ${groupName}`,
    `You are helping ${username} rewrite a group chat message.`,
    '',
    ...conversationSection,
    'Draft to improve:',
    draft,
    '',
    'Rewrite the draft into a clearer, more natural, and well-phrased message.',
    'Improve structure, word choice, and tone so it fits the ongoing conversation.',
    'You may rephrase substantially — do not limit yourself to fixing typos.',
    'Keep the same core intent, facts, and level of formality; do not invent new information.',
    'Match the language of the draft and conversation.',
    'Return ONLY the rewritten message — no quotes, no explanation.',
  ].join('\n');
}

function normalizeOutput(text: string): string {
  return text.trim().slice(0, MAX_TEXT_LENGTH);
}

/**
 * Uses Gemini to suggest a reply or substantially rewrite a draft, with chat
 * context loaded from MongoDB on the server.
 */
export async function composeMessage(input: ComposeMessageInput): Promise<string> {
  const draft = input.draft?.trim();
  const isPolishMode = !!draft;

  const rawMessages = await Message.findByGroup(input.groupId, { limit: CONTEXT_LIMIT });
  const contextMessages: ContextMessage[] = rawMessages
    .map((message) => ({
      username: resolveSenderUsername(message.senderId),
      text: toContextText(message.text, message.attachments),
    }))
    .filter((message) => message.text.length > 0);

  if (!isPolishMode && contextMessages.length === 0) {
    throw new Error('No messages to reply to yet');
  }

  const prompt = isPolishMode
    ? buildPolishPrompt(input.groupName, input.username, contextMessages, draft)
    : buildGeneratePrompt(input.groupName, input.username, contextMessages);

  const ai = getClient();
  const response = await ai.models.generateContent({
    model: env.geminiModel,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  const text = normalizeOutput(response.text ?? '');
  if (!text) {
    throw new Error('AI returned an empty response');
  }

  return text;
}
