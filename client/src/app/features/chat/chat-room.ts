import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { GroupStore } from '../groups/group';
import { MessageList } from './message-list';
import { MessageForm } from './message-form';
import { MessageStore } from './message';
import { SocketService } from './socket';

@Component({
  selector: 'app-chat-room',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatIconModule, MessageList, MessageForm],
  templateUrl: './chat-room.html',
  styleUrl: './chat-room.scss',
})
export class ChatRoom implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly groupStore = inject(GroupStore);
  private readonly messageStore = inject(MessageStore);
  private readonly socketService = inject(SocketService);

  protected readonly groupId = signal('');
  protected readonly groupName = signal('');

  private subscriptions = new Subscription();

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.groupId.set(id);

    const group = this.groupStore.getById(id);
    if (group) this.groupName.set(group.name);

    this.messageStore.reset();
    void this.messageStore.load(id);

    this.socketService.joinGroup(id);

    this.subscriptions.add(
      this.socketService.newMessage$.subscribe((msg) => this.messageStore.addRealtime(msg)),
    );
    this.subscriptions.add(
      this.socketService.messageUpdated$.subscribe((msg) => this.messageStore.updateRealtime(msg)),
    );
    this.subscriptions.add(
      this.socketService.messageDeleted$.subscribe((msgId) =>
        this.messageStore.deleteRealtime(msgId),
      ),
    );
  }

  ngOnDestroy(): void {
    this.socketService.leaveGroup(this.groupId());
    this.subscriptions.unsubscribe();
  }
}
