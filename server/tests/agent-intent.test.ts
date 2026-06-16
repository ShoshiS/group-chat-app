import {
  extractGroupNameForCreate,
  formatCreateReply,
  formatListReply,
  formatToolError,
  getLastUserText,
  isCreateGroupIntent,
  isHebrewConversation,
  isListGroupsIntent,
} from '../src/services/agent/agent-intent';
import type { ChatMessage } from '../src/services/agent/agent-types';

describe('agent-intent', () => {
  describe('getLastUserText', () => {
    it('returns the most recent user message', () => {
      const messages: ChatMessage[] = [
        { role: 'user', text: 'first' },
        { role: 'model', text: 'reply' },
        { role: 'user', text: 'second' },
      ];
      expect(getLastUserText(messages)).toBe('second');
    });

    it('returns empty string when there are no user messages', () => {
      const messages: ChatMessage[] = [{ role: 'model', text: 'hello' }];
      expect(getLastUserText(messages)).toBe('');
    });
  });

  describe('isHebrewConversation', () => {
    it('detects Hebrew in the last user message', () => {
      const messages: ChatMessage[] = [{ role: 'user', text: 'מה הקבוצות שלי?' }];
      expect(isHebrewConversation(messages)).toBe(true);
    });

    it('returns false for English-only messages', () => {
      const messages: ChatMessage[] = [{ role: 'user', text: 'list my groups' }];
      expect(isHebrewConversation(messages)).toBe(false);
    });
  });

  describe('isListGroupsIntent', () => {
    it.each([
      'מה הקבוצות שלי',
      'אילו קבוצות יש לי',
      'list my groups',
      'show groups',
      'what groups do I have',
    ])('matches list intent: %s', (text) => {
      expect(isListGroupsIntent(text)).toBe(true);
    });

    it('does not match unrelated messages', () => {
      expect(isListGroupsIntent('invite Dana to study group')).toBe(false);
    });
  });

  describe('isCreateGroupIntent', () => {
    it.each([
      'צור קבוצה חדשה',
      'פתח קבוצה',
      'create a group',
      'open new group',
    ])('matches create intent: %s', (text) => {
      expect(isCreateGroupIntent(text)).toBe(true);
    });

    it('does not match list intent', () => {
      expect(isCreateGroupIntent('list my groups')).toBe(false);
    });
  });

  describe('extractGroupNameForCreate', () => {
    it.each([
      ['צור קבוצה בשם "Study Buddies"', 'Study Buddies'],
      ['create group named Project Alpha', 'Project Alpha'],
      ['קבוצה חדשה בשם DevOps', 'DevOps'],
      ['create group called "Weekend Plans"', 'Weekend Plans'],
    ])('extracts name from: %s', (text, expected) => {
      expect(extractGroupNameForCreate(text)).toBe(expected);
    });

    it('returns null when no name is present', () => {
      expect(extractGroupNameForCreate('צור קבוצה חדשה')).toBeNull();
      expect(extractGroupNameForCreate('create a group please')).toBeNull();
    });
  });

  describe('formatListReply', () => {
    it('formats an empty list in Hebrew', () => {
      expect(formatListReply([], true)).toBe('אין לך קבוצות עדיין.');
    });

    it('formats groups in English', () => {
      expect(formatListReply([{ name: 'Alpha' }, { name: 'Beta' }], false)).toBe(
        "You have 2 groups: 'Alpha', 'Beta'.",
      );
    });
  });

  describe('formatCreateReply', () => {
    it('includes the group name and id', () => {
      expect(formatCreateReply('Alpha', 'abc123', false)).toBe(
        "Created a new group named 'Alpha' (id: abc123).",
      );
    });
  });

  describe('formatToolError', () => {
    it('localizes errors', () => {
      expect(formatToolError('db down', true)).toBe('לא הצלחתי לבצע את הפעולה: db down');
      expect(formatToolError('db down', false)).toBe('Could not complete the action: db down');
    });
  });
});
