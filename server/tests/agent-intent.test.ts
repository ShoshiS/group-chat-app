import {
  extractGroupNameForCreate,
  formatCreateReply,
  formatListReply,
  formatToolError,
  getLastUserText,
  isCreateGroupIntent,
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

  describe('isListGroupsIntent', () => {
    it.each([
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
      ['create group named "Study Buddies"', 'Study Buddies'],
      ['create group named Project Alpha', 'Project Alpha'],
      ['create group called "Weekend Plans"', 'Weekend Plans'],
    ])('extracts name from: %s', (text, expected) => {
      expect(extractGroupNameForCreate(text)).toBe(expected);
    });

    it('returns null when no name is present', () => {
      expect(extractGroupNameForCreate('create a group please')).toBeNull();
    });
  });

  describe('formatListReply', () => {
    it('formats an empty list', () => {
      expect(formatListReply([])).toBe('You have no groups yet.');
    });

    it('formats groups', () => {
      expect(formatListReply([{ name: 'Alpha' }, { name: 'Beta' }])).toBe(
        "You have 2 groups: 'Alpha', 'Beta'.",
      );
    });
  });

  describe('formatCreateReply', () => {
    it('includes the group name and id', () => {
      expect(formatCreateReply('Alpha', 'abc123')).toBe(
        "Created a new group named 'Alpha' (id: abc123).",
      );
    });
  });

  describe('formatToolError', () => {
    it('formats errors', () => {
      expect(formatToolError('db down')).toBe('Could not complete the action: db down');
    });
  });
});
