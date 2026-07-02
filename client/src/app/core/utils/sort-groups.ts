import type { Group } from '../models/group';

function groupActivityTime(group: Group): number {
  return new Date(group.lastMessageAt ?? group.createdAt).getTime();
}

/** Most recently active groups first. */
export function sortGroupsByActivity(groups: Group[]): Group[] {
  return [...groups].sort((a, b) => groupActivityTime(b) - groupActivityTime(a));
}
