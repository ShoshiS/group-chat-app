import { buildChatTimeline } from './chat-timeline';

describe('buildChatTimeline', () => {
  it('merges messages and invitation events in chronological order', () => {
    const timeline = buildChatTimeline(
      [
        {
          id: 'm1',
          groupId: 'g1',
          senderId: 'u1',
          text: 'Hello',
          createdAt: '2026-06-20T10:00:00.000Z',
          updatedAt: '2026-06-20T10:00:00.000Z',
        },
        {
          id: 'm2',
          groupId: 'g1',
          senderId: 'u1',
          text: 'Later',
          createdAt: '2026-06-20T12:00:00.000Z',
          updatedAt: '2026-06-20T12:00:00.000Z',
        },
      ],
      [
        {
          id: 'i1',
          kind: 'invitation',
          at: '2026-06-20T11:00:00.000Z',
          invitee: 'dana@example.com',
          inviteeUsername: 'dana',
          status: 'accepted',
        },
      ],
    );

    expect(timeline.map((item) => item.id)).toEqual([
      'message-m1',
      'invitation-i1',
      'message-m2',
    ]);
  });

  it('shows member removed events in the timeline', () => {
    const timeline = buildChatTimeline(
      [
        {
          id: 'm1',
          groupId: 'g1',
          senderId: 'u1',
          text: 'Hello',
          createdAt: '2026-06-20T10:00:00.000Z',
          updatedAt: '2026-06-20T10:00:00.000Z',
        },
      ],
      [
        {
          id: 'e1',
          kind: 'member_removed',
          at: '2026-06-20T10:30:00.000Z',
          memberUsername: 'bob',
        },
      ],
    );

    expect(timeline.length).toBe(2);
    expect(timeline[1]?.kind).toBe('event');
    if (timeline[1]?.kind === 'event') {
      expect(timeline[1].label).toBe('bob was removed from the group');
      expect(timeline[1].status).toBe('member_removed');
    }
  });

  it('labels pending invitations', () => {
    const timeline = buildChatTimeline([], [
      {
        id: 'i2',
        kind: 'invitation',
        at: '2026-06-20T08:00:00.000Z',
        invitee: 'bob@example.com',
        inviteeUsername: 'bob',
        status: 'pending',
      },
    ]);

    expect(timeline[0]?.kind).toBe('event');
    if (timeline[0]?.kind === 'event') {
      expect(timeline[0].label).toBe('Invitation sent to bob');
    }
  });
});
