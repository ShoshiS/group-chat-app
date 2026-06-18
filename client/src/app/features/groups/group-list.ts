import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import type { Group } from '../../core/models/group';
import { GroupStore } from './group';
import { GroupCard } from './group-card';

@Component({
  selector: 'app-group-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GroupCard, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './group-list.html',
  styleUrl: './group-list.scss',
})
export class GroupList implements OnInit {
  protected readonly store = inject(GroupStore);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

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
      this.snackBar.open('Group deleted', 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Failed to delete group', 'OK', { duration: 3000 });
    }
  }

  protected async leaveGroup(group: Group): Promise<void> {
    if (!confirm(`Leave "${group.name}"?`)) return;
    try {
      await this.store.leave(group.id);
      this.snackBar.open('Left group', 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Failed to leave group', 'OK', { duration: 3000 });
    }
  }
}
