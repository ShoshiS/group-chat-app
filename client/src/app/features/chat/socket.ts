import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { io, type Socket } from 'socket.io-client';

import type { Message } from '../../core/models/message';
import { environment } from '../../../environments/environment';

export interface SocketMessageEvent {
  message: Message;
}

export interface SocketDeleteEvent {
  messageId: string;
}

/**
 * Thin wrapper around the Socket.io client.
 * Components call joinGroup/leaveGroup and subscribe to the event streams.
 * Connects lazily on first joinGroup call and stays connected for the session.
 */
@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;

  readonly newMessage$ = new Subject<Message>();
  readonly messageUpdated$ = new Subject<Message>();
  readonly messageDeleted$ = new Subject<string>();

  private connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.socketUrl, { transports: ['websocket', 'polling'] });

    this.socket.on('newMessage', (message: Message) => this.newMessage$.next(message));
    this.socket.on('messageUpdated', (message: Message) => this.messageUpdated$.next(message));
    this.socket.on('messageDeleted', ({ messageId }: { messageId: string }) =>
      this.messageDeleted$.next(messageId),
    );
  }

  joinGroup(groupId: string): void {
    this.connect();
    this.socket?.emit('joinGroup', groupId);
  }

  leaveGroup(groupId: string): void {
    this.socket?.emit('leaveGroup', groupId);
  }

  ngOnDestroy(): void {
    this.socket?.disconnect();
  }
}
