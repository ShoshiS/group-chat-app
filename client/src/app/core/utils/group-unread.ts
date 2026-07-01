import type { Group } from '../models/group';

/** True when the group has messages newer than the user's last read cursor. */
export function groupHasUnread(group: Group): boolean {
  if (!group.lastMessageAt) {
    return false;
  }
  if (!group.lastReadAt) {
    return true;
  }
  return new Date(group.lastMessageAt).getTime() > new Date(group.lastReadAt).getTime();
}
