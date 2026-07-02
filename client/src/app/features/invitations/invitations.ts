import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import type { Invitation } from '../../core/models/invitation';
import { Toast } from '../../core/services/toast';
import { InvitationStore } from '../../core/services/invitation';
import { GroupStore } from '../groups/group';

@Component({
  selector: 'app-invitations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './invitations.html',
  styleUrl: './invitations.scss',
})
export class Invitations implements OnInit {
  protected readonly store = inject(InvitationStore);
  private readonly groupStore = inject(GroupStore);
  private readonly toast = inject(Toast);

  protected readonly actingId = signal<string | null>(null);

  ngOnInit(): void {
    void this.store.load();
  }

  protected pendingInvitations(): Invitation[] {
    return this.store.invitations().filter((item) => item.status === 'pending');
  }

  protected async accept(invitation: Invitation): Promise<void> {
    await this.respond(invitation.id, 'accept', 'Joined group');
  }

  protected async reject(invitation: Invitation): Promise<void> {
    await this.respond(invitation.id, 'reject', 'Invitation declined');
  }

  private async respond(id: string, action: 'accept' | 'reject', success: string): Promise<void> {
    this.actingId.set(id);
    try {
      if (action === 'accept') {
        await this.store.accept(id);
        await this.groupStore.load();
      } else {
        await this.store.reject(id);
      }
      this.toast.success(success);
    } catch {
      this.toast.error(`Failed to ${action} invitation`);
    } finally {
      this.actingId.set(null);
    }
  }
}
