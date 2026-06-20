import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import type { GroupTimelineItem } from '../../core/models/group-timeline';
import type { GroupMember } from '../../core/models/group-member';
import { Auth } from '../../core/services/auth';
import { GroupMemberList } from '../groups/group-member-list';
import { GroupStore } from '../groups/group';
import { MessageList } from './message-list';
import { MessageForm } from './message-form';
import { MessageStore } from './message';
import { SocketService } from './socket';

@Component({
  selector: 'app-chat-room',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
    GroupMemberList,
    MessageList,
    MessageForm,
  ],
  templateUrl: './chat-room.html',
  styleUrl: './chat-room.scss',
})
export class ChatRoom implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly groupStore = inject(GroupStore);
  private readonly auth = inject(Auth);
  private readonly messageStore = inject(MessageStore);
  private readonly socketService = inject(SocketService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly groupId = signal('');
  protected readonly groupName = signal('');
  protected readonly inviteOpen = signal(false);
  protected readonly membersOpen = signal(false);
  protected readonly members = signal<GroupMember[]>([]);
  protected readonly membersLoading = signal(false);
  protected readonly isGroupAdmin = signal(false);
  protected readonly invitationActivity = signal<GroupTimelineItem[]>([]);
  protected readonly activityLoading = signal(false);
  protected readonly inviteEmail = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  private subscriptions = new Subscription();

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.groupId.set(id);

    void this.loadGroupName(id);
    void this.loadInvitationActivity(id);

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

  protected toggleInvite(): void {
    this.inviteOpen.update((open) => !open);
    if (this.inviteOpen()) {
      this.membersOpen.set(false);
    }
  }

  protected toggleMembers(): void {
    this.membersOpen.update((open) => !open);
    if (this.membersOpen()) {
      this.inviteOpen.set(false);
      void this.loadMembers(this.groupId());
    }
  }

  protected async sendInvite(): Promise<void> {
    if (this.inviteEmail.invalid) {
      this.inviteEmail.markAsTouched();
      return;
    }

    try {
      await this.groupStore.invite(this.groupId(), this.inviteEmail.value.trim());
      this.inviteEmail.reset();
      this.inviteOpen.set(false);
      this.snackBar.open('Invitation sent', 'OK', { duration: 3000 });
      await this.loadInvitationActivity(this.groupId());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send invitation';
      this.snackBar.open(message, 'OK', { duration: 4000 });
    }
  }

  protected async onRemoveMember(member: GroupMember): Promise<void> {
    if (!confirm(`Remove ${member.username} from the group?`)) return;

    try {
      await this.groupStore.removeMember(this.groupId(), member.id);
      this.members.update((list) => list.filter((m) => m.id !== member.id));
      await this.loadInvitationActivity(this.groupId());
      this.snackBar.open(`${member.username} removed`, 'OK', { duration: 3000 });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove member';
      this.snackBar.open(message, 'OK', { duration: 4000 });
    }
  }

  private async loadGroupName(id: string): Promise<void> {
    const cached = this.groupStore.getById(id);
    if (cached) {
      this.groupName.set(cached.name);
      this.syncAdminState(cached.adminId);
      return;
    }

    try {
      const group = await this.groupStore.fetchById(id);
      this.groupName.set(group.name);
      this.syncAdminState(group.adminId);
    } catch {
      // Title falls back to group id when the group cannot be loaded.
    }
  }

  private syncAdminState(adminId: string): void {
    const user = this.auth.currentUser();
    this.isGroupAdmin.set(!!user && adminId === user.id);
  }

  private async loadMembers(id: string): Promise<void> {
    this.membersLoading.set(true);
    try {
      const members = await this.groupStore.fetchMembers(id);
      this.members.set(members);
    } catch {
      this.snackBar.open('Failed to load members', 'OK', { duration: 3000 });
    } finally {
      this.membersLoading.set(false);
    }
  }

  private async loadInvitationActivity(id: string): Promise<void> {
    this.activityLoading.set(true);
    try {
      const activities = await this.groupStore.fetchGroupInvitations(id);
      this.invitationActivity.set(activities);
    } catch {
      this.invitationActivity.set([]);
    } finally {
      this.activityLoading.set(false);
    }
  }
}
