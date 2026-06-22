export type InvitationStatus = 'pending' | 'accepted' | 'rejected';

export interface Invitation {
  id: string;
  groupId: string;
  groupName: string;
  invitee: string;
  inviteeUsername?: string;
  invitedBy?: string;
  invitedByUsername?: string | null;
  status: InvitationStatus;
  createdAt: string;
  updatedAt: string;
}
