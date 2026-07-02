export interface Group {
  id: string;
  name: string;
  description?: string;
  adminId: string;
  members: string[];
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  /** ISO timestamp of the latest message; falls back to createdAt when empty. */
  lastMessageAt?: string;
  /** ISO timestamp of the last message the user read in this group; null if never opened. */
  lastReadAt?: string | null;
}

export interface GroupMember {
  id: string;
  username: string;
  avatar: string | null;
}
