const LAST_GROUP_KEY = 'lastGroupId';

export function readLastGroupId(): string | null {
  return localStorage.getItem(LAST_GROUP_KEY);
}

export function writeLastGroupId(id: string): void {
  localStorage.setItem(LAST_GROUP_KEY, id);
}

export function clearLastGroupId(): void {
  localStorage.removeItem(LAST_GROUP_KEY);
}
