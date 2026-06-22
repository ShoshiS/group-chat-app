import type { Message } from '../models/message';

export type SharedFileFilter = 'doc' | 'image' | 'audio' | 'link';

export interface SharedFileItem {
  id: string;
  messageId: string;
  filter: SharedFileFilter;
  url: string;
  name: string;
  senderName: string;
  createdAt: string;
}

export const SHARED_FILE_FILTER_LABELS: Record<SharedFileFilter, string> = {
  doc: 'Documents',
  image: 'Images',
  audio: 'Audio',
  link: 'Links',
};

const URL_PATTERN = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

function senderName(msg: Message): string {
  const sender = msg.senderId;
  return typeof sender === 'object' ? sender.username : 'Unknown';
}

function attachmentFilter(type: string): SharedFileFilter | null {
  switch (type) {
    case 'pdf':
      return 'doc';
    case 'image':
      return 'image';
    case 'audio':
      return 'audio';
    default:
      return null;
  }
}

function trimTrailingPunctuation(url: string): string {
  return url.replace(/[.,;:!?)]+$/, '');
}

/** Collect attachments and URLs from loaded group messages, newest first. */
export function collectSharedFiles(messages: Message[]): SharedFileItem[] {
  const items: SharedFileItem[] = [];

  for (const message of messages) {
    if (message.attachments?.length) {
      for (const attachment of message.attachments) {
        const filter = attachmentFilter(attachment.type);
        if (!filter) {
          continue;
        }

        items.push({
          id: `${message.id}-${attachment.url}`,
          messageId: message.id,
          filter,
          url: attachment.url,
          name: attachment.originalName,
          senderName: senderName(message),
          createdAt: message.createdAt,
        });
      }
    }

    if (message.text) {
      const matches = message.text.match(URL_PATTERN) ?? [];
      const uniqueUrls = [...new Set(matches.map(trimTrailingPunctuation))];

      uniqueUrls.forEach((url, index) => {
        items.push({
          id: `${message.id}-link-${index}`,
          messageId: message.id,
          filter: 'link',
          url,
          name: url,
          senderName: senderName(message),
          createdAt: message.createdAt,
        });
      });
    }
  }

  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function filterSharedFiles(
  items: SharedFileItem[],
  filter: SharedFileFilter,
): SharedFileItem[] {
  return items.filter((item) => item.filter === filter);
}
