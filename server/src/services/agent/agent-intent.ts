import { HEBREW_CHAR } from './agent-types';
import type { ChatMessage } from './agent-types';

export type { ChatMessage } from './agent-types';

export function isHebrewConversation(messages: ChatMessage[]): boolean {
  const lastUser = getLastUserText(messages);
  return HEBREW_CHAR.test(lastUser);
}

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
  return /(?:מה|אילו|הציג|רשימ).{0,20}קבוצ|קבוצות\s+ש(?:יש|לי)|list\s+(?:my\s+)?groups|what\s+groups|show\s+(?:my\s+)?groups/i.test(
    text,
  );
}

export function isCreateGroupIntent(text: string): boolean {
  return /(?:פתח|צור|יציר|הוסיפ|create|open|new).{0,30}קבוצ|(?:create|open|new)\s+(?:a\s+)?group/i.test(
    text,
  );
}

/** Pulls a group name from common Hebrew/English phrasing. Returns null if missing. */
export function extractGroupNameForCreate(text: string): string | null {
  const patterns = [
    /(?:בשם|שם)\s+["'«]([^"'»\n.?!]+)["'»]/i,
    /(?:בשם|שם)\s+([^\s"'«»\n.?!]+)/i,
    /(?:named|called)\s+["']?([^"'\n.?!]+)/i,
    /קבוצה\s+(?:חדשה\s+)?(?:בשם|שם)\s+["']?([^"'\n.?!]+)/i,
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

export function formatListReply(
  groups: { name: string }[],
  hebrew: boolean,
): string {
  if (groups.length === 0) {
    return hebrew ? 'אין לך קבוצות עדיין.' : 'You have no groups yet.';
  }

  const names = groups.map((group) => `'${group.name}'`).join(', ');
  return hebrew
    ? `יש לך ${groups.length} קבוצות: ${names}.`
    : `You have ${groups.length} groups: ${names}.`;
}

export function formatCreateReply(
  name: string,
  groupId: string,
  hebrew: boolean,
): string {
  return hebrew
    ? `יצרתי קבוצה חדשה בשם '${name}' (מזהה: ${groupId}).`
    : `Created a new group named '${name}' (id: ${groupId}).`;
}

export function formatToolError(error: string, hebrew: boolean): string {
  return hebrew ? `לא הצלחתי לבצע את הפעולה: ${error}` : `Could not complete the action: ${error}`;
}
