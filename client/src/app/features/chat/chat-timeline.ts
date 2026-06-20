import type { GroupTimelineItem } from '../../core/models/group-timeline';
import {
  groupTimelineEventStatus,
  groupTimelineLabel,
} from '../../core/models/group-timeline';
import type { ChatEventStatus } from '../../core/models/group-timeline';
import type { Message } from '../../core/models/message';

export type ChatTimelineItem =
  | { kind: 'message'; id: string; at: string; message: Message }
  | {
      kind: 'event';
      id: string;
      at: string;
      label: string;
      status: ChatEventStatus;
    };

/** Merges chat messages and group timeline events into one chronological timeline. */
export function buildChatTimeline(
  messages: Message[],
  activities: GroupTimelineItem[],
): ChatTimelineItem[] {
  const items: ChatTimelineItem[] = [];

  for (const message of messages) {
    items.push({
      kind: 'message',
      id: `message-${message.id}`,
      at: message.createdAt,
      message,
    });
  }

  for (const activity of activities) {
    items.push({
      kind: 'event',
      id: `${activity.kind}-${activity.id}`,
      at: activity.at,
      label: groupTimelineLabel(activity),
      status: groupTimelineEventStatus(activity),
    });
  }

  return items.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}
