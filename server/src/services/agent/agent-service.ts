import { type Content, FunctionCallingConfigMode, GoogleGenAI } from '@google/genai';

import { env } from '../../config/env';
import {
  extractGroupNameForCreate,
  formatCreateReply,
  formatListReply,
  formatToolError,
  getLastUserText,
  isCreateGroupIntent,
  isHebrewConversation,
  isListGroupsIntent,
} from './agent-intent';
import type { AgentAction, AgentTurn, ChatMessage } from './agent-types';
import { executeTool, functionDeclarations } from './tools';

export type { AgentAction, AgentTurn, ChatMessage } from './agent-types';

const SYSTEM_INSTRUCTION = [
  'You are an in-app assistant for a group chat application.',
  'You help users create groups and invite members ONLY by calling the provided tools.',
  'NEVER claim you created a group, listed groups, or sent an invitation unless the matching tool ran in this turn.',
  'If required arguments are missing, ask one short clarifying question — do NOT call a tool yet.',
  'When listing groups, report ONLY names returned by list_groups — never add names from the conversation.',
  'When a tool returns an error field, explain that error honestly.',
  'Always reply in the same language the user is writing in (Hebrew or English).',
  'Keep replies concise and friendly.',
].join(' ');

const MAX_TOOL_ITERATIONS = 5;

let client: GoogleGenAI | undefined;

function getClient(): GoogleGenAI {
  if (!env.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  client ??= new GoogleGenAI({ apiKey: env.geminiApiKey });
  return client;
}

function toContents(messages: ChatMessage[]): Content[] {
  return messages.map((message) => ({
    role: message.role,
    parts: [{ text: message.text }],
  }));
}

/**
 * Deterministic handlers for create/list — bypass the LLM so groups are always
 * persisted and listed from MongoDB, not hallucinated.
 */
async function tryDeterministicTurn(messages: ChatMessage[]): Promise<AgentTurn | null> {
  const lastUser = getLastUserText(messages);
  const hebrew = isHebrewConversation(messages);
  const actions: AgentAction[] = [];

  if (isListGroupsIntent(lastUser)) {
    const result = await executeTool('list_groups', {});
    actions.push({ tool: 'list_groups', args: {}, result });

    if (typeof result.error === 'string') {
      return { reply: formatToolError(result.error, hebrew), actions };
    }

    const groups = (result.groups as { name: string }[]) ?? [];
    return { reply: formatListReply(groups, hebrew), actions };
  }

  if (isCreateGroupIntent(lastUser)) {
    const name = extractGroupNameForCreate(lastUser);
    if (!name) {
      return null;
    }

    const result = await executeTool('create_group', { name });
    actions.push({ tool: 'create_group', args: { name }, result });

    if (typeof result.error === 'string') {
      return { reply: formatToolError(result.error, hebrew), actions };
    }

    if (result.created !== true || typeof result.groupId !== 'string') {
      return {
        reply: formatToolError('create_group did not confirm creation', hebrew),
        actions,
      };
    }

    return {
      reply: formatCreateReply(String(result.name), result.groupId, hebrew),
      actions,
    };
  }

  return null;
}

/**
 * Runs a single assistant turn: uses deterministic DB-backed handlers when
 * possible; otherwise delegates to Gemini function calling for invites and
 * multi-turn clarification.
 */
export async function runAgentTurn(messages: ChatMessage[]): Promise<AgentTurn> {
  const deterministic = await tryDeterministicTurn(messages);
  if (deterministic) {
    return deterministic;
  }

  const ai = getClient();
  const contents = toContents(messages);
  const actions: AgentAction[] = [];

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration += 1) {
    const response = await ai.models.generateContent({
      model: env.geminiModel,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.AUTO,
          },
        },
      },
    });

    const calls = response.functionCalls ?? [];
    if (calls.length === 0) {
      return { reply: response.text ?? '', actions };
    }

    contents.push({
      role: 'model',
      parts: calls.map((call) => ({ functionCall: call })),
    });

    const responseParts = await Promise.all(
      calls.map(async (call) => {
        const args = (call.args ?? {}) as Record<string, unknown>;
        const result = await executeTool(call.name ?? '', args);
        actions.push({ tool: call.name ?? '', args, result });
        return {
          functionResponse: {
            name: call.name ?? '',
            response: result,
          },
        };
      }),
    );

    contents.push({ role: 'user', parts: responseParts });
  }

  const hebrew = isHebrewConversation(messages);
  return {
    reply: hebrew
      ? 'מצטער, לא הצלחתי להשלים את הבקשה. נסי לנסח אחרת.'
      : 'Sorry, I could not complete that request. Please try rephrasing it.',
    actions,
  };
}
