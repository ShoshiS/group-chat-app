export interface Group {
  id: string;
  name: string;
  description?: string;
  adminId: string;
  members: string[];
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  username: string;
  avatar: string | null;
}
