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

const COMPOSE_SYSTEM_INSTRUCTION = [
  'You draft messages for a real group chat. The text you return is sent exactly as written.',
  'Your message must be immediately useful — never a placeholder or promise about future work.',
  'FORBIDDEN unless the same message also contains the full deliverable: offering to help, saying you will try,',
  '"I\'m on it", "no problem", "sure", asking what direction they want, or any meta reply without substance.',
  'If the conversation requests content (a poem, explanation, answer, list, suggestion, code, summary), include that content directly.',
  'If someone says "write", "go ahead", or "did something come out?", read the full thread and deliver what was asked for.',
  'Use reasonable assumptions instead of asking clarifying questions.',
  'Match the conversation language.',
  'Return ONLY the message text — no quotes, labels, or explanation.',
].join(' ');

function buildSubstanceRules(): string[] {
  return [
    'Critical: deliver real content, not conversation about helping.',
    'Do NOT reply with only acknowledgments, enthusiasm, or promises.',
    'If a task was requested earlier in the thread, fulfill it now in this message.',
  ];
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
        'Look at the FULL conversation for any request or commitment directed at the current user.',
        'If the user previously said they would do something (write, explain, send) but only sent a placeholder,',
        'deliver the actual content now — the poem, answer, list, or explanation that was requested.',
        'If someone is waiting for output ("write", "go ahead", "anything yet?", "did something come out?"),',
        'provide the complete requested content in this message.',
        'Otherwise continue naturally with a substantive follow-up — not another empty promise.',
      ]
    : [
        `The last message was sent by ${lastMessage?.username ?? 'someone else'}, not by ${username}.`,
        `Write a natural reply from ${username} to the conversation.`,
        'Read the full thread — the last message may be a short prompt ("write", "go ahead", "well?")',
        'referring to an earlier request. Fulfill that underlying request, not just the last word.',
        'If they ask a question, answer it directly with specifics.',
        'If they ask you to create something (poem, text, idea, explanation), create it fully in this message.',
        'Do not offer to help later — do the work now.',
      ];

  return [
    `Group: ${groupName}`,
    `You are writing the next message for ${username}.`,
    '',
    'Recent conversation:',
    formatConversation(messages),
    '',
    ...buildSubstanceRules(),
    '',
    ...roleInstructions,
    'Be concise when a short answer suffices; use more lines when delivering requested content (e.g. a poem).',
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
    ...buildSubstanceRules(),
    '',
    'Rewrite the draft into a clearer, more natural, and well-phrased message.',
    'If the draft is very short (e.g. "write", "go ahead") read the conversation and expand it into',
    'the full substantive content that was requested — not a promise to do it.',
    'Improve structure, word choice, and tone so it fits the ongoing conversation.',
    'You may rephrase substantially and add missing content the draft implies.',
    'Keep the same core intent; do not invent unrelated facts.',
    'Match the language of the draft and conversation.',
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
    config: {
      systemInstruction: COMPOSE_SYSTEM_INSTRUCTION,
    },
  });

  const text = normalizeOutput(response.text ?? '');
  if (!text) {
    throw new Error('AI returned an empty response');
  }

  return text;
}
