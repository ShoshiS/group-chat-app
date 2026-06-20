export interface Attachment {
  type: 'image' | 'audio' | 'pdf';
  url: string;
  originalName: string;
}

export interface MessageSender {
  id: string;
  username: string;
  avatar?: string;
}

export interface Message {
  id: string;
  groupId: string;
  senderId: MessageSender | string;
  text?: string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}
