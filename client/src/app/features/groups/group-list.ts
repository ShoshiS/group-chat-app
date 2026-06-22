import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import type { Group } from '../../core/models/group';
import { Toast } from '../../core/services/toast';
import { GroupStore } from './group';
import { GroupCard } from './group-card';

@Component({
  selector: 'app-group-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GroupCard, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './group-list.html',
  styleUrl: './group-list.scss',
})
export class GroupList implements OnInit {
  protected readonly store = inject(GroupStore);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);

  protected readonly confirmTarget = signal<Group | null>(null);

  ngOnInit(): void {
    void this.store.load();
  }

  protected createGroup(): void {
    void this.router.navigate(['/groups', 'new']);
  }

  protected editGroup(group: Group): void {
    void this.router.navigate(['/groups', group.id, 'edit']);
  }

  protected async deleteGroup(group: Group): Promise<void> {
    if (!confirm(`Delete "${group.name}"? This cannot be undone.`)) return;
    try {
      await this.store.remove(group.id);
      this.toast.success('Group deleted');
    } catch {
      this.toast.error('Failed to delete group');
    }
  }

  protected async leaveGroup(group: Group): Promise<void> {
    if (!confirm(`Leave "${group.name}"?`)) return;
    try {
      await this.store.leave(group.id);
      this.toast.success('Left group');
    } catch {
      this.toast.error('Failed to leave group');
    }
  }
}
