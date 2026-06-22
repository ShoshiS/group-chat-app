import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe, UpperCasePipe } from '@angular/common';

import type { Group, GroupMember } from '../../core/models/group';
import { Toast } from '../../core/services/toast';
import { writeLastGroupId, clearLastGroupId, readLastGroupId } from '../../core/utils/last-group';
import {
  SHARED_FILE_FILTER_LABELS,
  collectSharedFiles,
  filterSharedFiles,
  type SharedFileFilter,
  type SharedFileItem,
} from '../../core/utils/shared-files';
import { ImagePreview } from '../../shared/image-preview/image-preview';
import { parseGroupAvatar } from '../../core/utils/group-avatar';
import { Auth } from '../../core/services/auth';
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
    DatePipe,
    UpperCasePipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MessageList,
    MessageForm,
    ImagePreview,
  ],
  templateUrl: './chat-room.html',
  styleUrl: './chat-room.scss',
})
export class ChatRoom implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly auth = inject(Auth);
  protected readonly groupStore = inject(GroupStore);
  protected readonly messageStore = inject(MessageStore);
  private readonly socketService = inject(SocketService);
  private readonly toast = inject(Toast);

  protected readonly groupId = signal('');
  protected readonly groupName = signal('');
  protected readonly memberIds = signal<string[]>([]);
  protected readonly members = signal<GroupMember[]>([]);
  protected readonly chatSearch = signal('');
  protected readonly memberSearch = signal('');
  protected readonly messageSearch = signal('');
  protected readonly showMessageSearch = signal(false);
  protected readonly membersLoading = signal(false);
  protected readonly showMembersPanel = signal(false);
  protected readonly showInviteForm = signal(false);
  protected readonly showFilesPanel = signal(true);
  protected readonly fileFilter = signal<SharedFileFilter | null>(null);
  protected readonly previewImage = signal<{ url: string; name: string } | null>(null);
  protected readonly showChatList = signal(false);
  protected readonly inviteSending = signal(false);

  protected readonly inviteControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(2)],
  });

  protected readonly activeGroup = computed(() => this.groupStore.getById(this.groupId()));

  protected readonly filteredGroups = computed(() => {
    const query = this.chatSearch().trim().toLowerCase();
    const groups = this.groupStore.groups();
    if (!query) {
      return groups;
    }
    return groups.filter(
      (group) =>
        group.name.toLowerCase().includes(query) ||
        (group.description?.toLowerCase().includes(query) ?? false),
    );
  });

  protected readonly filteredMembers = computed(() => {
    const query = this.memberSearch().trim().toLowerCase();
    const list = this.members();
    if (!query) {
      return list;
    }
    return list.filter((member) => member.username.toLowerCase().includes(query));
  });

  protected readonly isAdmin = computed(
    () => this.activeGroup()?.adminId === this.auth.currentUser()?.id,
  );

  protected readonly sharedFiles = computed(() =>
    collectSharedFiles(this.messageStore.messages()),
  );

  protected readonly filteredSharedFiles = computed(() => {
    const filter = this.fileFilter();
    if (!filter) {
      return [];
    }
    return filterSharedFiles(this.sharedFiles(), filter);
  });

  protected readonly fileFilterLabel = computed(() => {
    const filter = this.fileFilter();
    return filter ? SHARED_FILE_FILTER_LABELS[filter] : '';
  });

  protected readonly filesSidebarMembers = computed(() => this.members().slice(0, 3));

  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.paramMap.subscribe((params) => {
        const id = params.get('id') ?? '';
        if (id) {
          this.activateGroup(id);
        }
      }),
    );

    this.subscriptions.add(
      this.socketService.newMessage$.subscribe((msg) => {
        if (msg.groupId === this.groupId()) {
          this.messageStore.addRealtime(msg);
        }
      }),
    );
    this.subscriptions.add(
      this.socketService.messageUpdated$.subscribe((msg) => {
        if (msg.groupId === this.groupId()) {
          this.messageStore.updateRealtime(msg);
        }
      }),
    );
    this.subscriptions.add(
      this.socketService.messageDeleted$.subscribe((msgId) => {
        if (this.messageStore.messages().some((message) => message.id === msgId)) {
          this.messageStore.deleteRealtime(msgId);
        }
      }),
    );
  }

  ngOnDestroy(): void {
    const id = this.groupId();
    if (id) {
      this.socketService.leaveGroup(id);
    }
    this.subscriptions.unsubscribe();
  }

  protected switchGroup(id: string): void {
    if (id === this.groupId()) {
      this.showChatList.set(false);
      return;
    }
    writeLastGroupId(id);
    this.showChatList.set(false);
    void this.router.navigate(['/groups', id]);
  }

  protected onChatSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.chatSearch.set(value);
  }

  protected onMemberSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.memberSearch.set(value);
  }

  protected onMessageSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.messageSearch.set(value);
  }

  protected toggleMessageSearch(): void {
    this.showMessageSearch.update((open) => {
      if (open) {
        this.messageSearch.set('');
      }
      return !open;
    });
  }

  protected groupAvatar(avatar?: string) {
    return parseGroupAvatar(avatar);
  }

  protected selectGroup(group: Group): void {
    this.switchGroup(group.id);
  }

  protected backToChatList(): void {
    this.showChatList.set(true);
  }

  protected toggleMembersPanel(): void {
    this.showMembersPanel.update((open) => !open);
    if (this.showMembersPanel()) {
      this.fileFilter.set(null);
      void this.loadMembers();
    } else {
      this.showInviteForm.set(false);
      this.memberSearch.set('');
    }
  }

  protected toggleInviteForm(): void {
    this.showInviteForm.update((open) => !open);
    if (!this.showInviteForm()) {
      this.inviteControl.reset();
    }
  }

  protected openInviteFromMenu(): void {
    this.showMembersPanel.set(true);
    this.showInviteForm.set(true);
    void this.loadMembers();
  }

  protected toggleFilesPanel(): void {
    this.showFilesPanel.update((open) => !open);
  }

  protected selectFileFilter(filter: SharedFileFilter): void {
    this.showMembersPanel.set(false);
    this.showInviteForm.set(false);
    this.showMessageSearch.set(false);
    this.messageSearch.set('');

    this.fileFilter.update((current) => (current === filter ? null : filter));
  }

  protected clearFileFilter(): void {
    this.fileFilter.set(null);
  }

  protected openSharedFile(item: SharedFileItem): void {
    if (item.filter === 'image') {
      this.previewImage.set({ url: item.url, name: item.name });
      return;
    }

    window.open(item.url, '_blank', 'noopener');
  }

  protected closeImagePreview(): void {
    this.previewImage.set(null);
  }

  protected async sendInvite(): Promise<void> {
    if (this.inviteControl.invalid || this.inviteSending()) {
      return;
    }

    this.inviteSending.set(true);
    try {
      await this.groupStore.invite(this.groupId(), this.inviteControl.value.trim());
      this.toast.success('Invitation sent');
      this.showInviteForm.set(false);
      this.inviteControl.reset();
    } catch (err) {
      const message =
        err instanceof HttpErrorResponse
          ? ((err.error as { error?: string })?.error ?? 'Failed to send invitation')
          : 'Failed to send invitation';
      this.toast.error(message);
    } finally {
      this.inviteSending.set(false);
    }
  }

  protected async removeMember(member: GroupMember): Promise<void> {
    if (!this.isAdmin() || !confirm(`Remove ${member.username} from this group?`)) {
      return;
    }

    try {
      await this.groupStore.removeMember(this.groupId(), member.id);
      this.members.update((list) => list.filter((item) => item.id !== member.id));
      this.memberIds.update((ids) => ids.filter((id) => id !== member.id));
      this.toast.success(`${member.username} removed`);
    } catch {
      this.toast.error('Failed to remove member');
    }
  }

  protected memberLabel(member: GroupMember): string {
    return this.auth.currentUser()?.id === member.id ? 'You' : member.username;
  }

  protected editGroup(): void {
    void this.router.navigate(['/groups', this.groupId(), 'edit']);
  }

  protected async deleteGroup(): Promise<void> {
    const group = this.activeGroup();
    if (!group || !confirm(`Delete "${group.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await this.groupStore.remove(group.id);
      if (readLastGroupId() === group.id) {
        clearLastGroupId();
      }
      this.toast.success('Group deleted');
      void this.router.navigate(['/groups']);
    } catch {
      this.toast.error('Failed to delete group');
    }
  }

  protected async leaveGroup(): Promise<void> {
    const group = this.activeGroup();
    if (!group || !confirm(`Leave "${group.name}"?`)) {
      return;
    }

    try {
      await this.groupStore.leave(group.id);
      if (readLastGroupId() === group.id) {
        clearLastGroupId();
      }
      this.toast.success('Left group');
      void this.router.navigate(['/groups']);
    } catch {
      this.toast.error('Failed to leave group');
    }
  }

  protected isMemberAdmin(memberId: string): boolean {
    return this.activeGroup()?.adminId === memberId;
  }

  private activateGroup(id: string): void {
    const previousId = this.groupId();
    if (previousId === id) {
      return;
    }

    if (previousId) {
      this.socketService.leaveGroup(previousId);
    }

    this.groupId.set(id);
    writeLastGroupId(id);
    this.groupName.set('');
    this.memberIds.set([]);
    this.members.set([]);
    this.showMembersPanel.set(false);
    this.showInviteForm.set(false);
    this.showMessageSearch.set(false);
    this.messageSearch.set('');
    this.memberSearch.set('');
    this.fileFilter.set(null);
    this.previewImage.set(null);

    void this.groupStore.load().then(() => this.syncGroup(id));

    this.messageStore.reset();
    void this.messageStore.load(id);

    this.socketService.joinGroup(id);
    void this.loadMembers();
  }

  private syncGroup(id: string): void {
    const cached = this.groupStore.getById(id);
    if (cached) {
      this.applyGroup(cached);
    }

    void this.groupStore.fetchById(id).then((group) => this.applyGroup(group)).catch(() => {
      if (!cached) {
        this.groupName.set(id);
      }
    });
  }

  private applyGroup(group: Group): void {
    this.groupName.set(group.name);
    this.memberIds.set(group.members);
  }

  private async loadMembers(): Promise<void> {
    const id = this.groupId();
    if (!id) {
      return;
    }

    this.membersLoading.set(true);
    try {
      const list = await this.groupStore.fetchMembers(id);
      this.members.set(list);
    } catch {
      this.toast.error('Failed to load members');
    } finally {
      this.membersLoading.set(false);
    }
  }
}
