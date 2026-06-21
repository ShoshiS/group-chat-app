import type { ChatMessage } from './agent-types';

export type { ChatMessage } from './agent-types';

export function getLastUserText(messages: ChatMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === 'user') {
      return message.text;
    }
  }
  return '';
}

export function isListGroupsIntent(text: string): boolean {
  return /list\s+(?:my\s+)?groups|what\s+groups|show\s+(?:my\s+)?groups/i.test(text);
}

export function isCreateGroupIntent(text: string): boolean {
  return /(?:create|open|new)\s+(?:a\s+)?group/i.test(text);
}

/** Pulls a group name from common English phrasing. Returns null if missing. */
export function extractGroupNameForCreate(text: string): string | null {
  const patterns = [
    /(?:named|called)\s+["'«]([^"'»\n.?!]+)["'»]/i,
    /(?:named|called)\s+(.+?)(?:\s*[.?!]|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const name = match?.[1]?.trim();
    if (name) {
      return name;
    }
  }

  return null;
}

export function formatListReply(groups: { name: string }[]): string {
  if (groups.length === 0) {
    return 'You have no groups yet.';
  }

  const names = groups.map((group) => `'${group.name}'`).join(', ');
  return `You have ${groups.length} groups: ${names}.`;
}

export function formatCreateReply(name: string, groupId: string): string {
  return `Created a new group named '${name}' (id: ${groupId}).`;
}

export function formatToolError(error: string): string {
  return `Could not complete the action: ${error}`;
}
