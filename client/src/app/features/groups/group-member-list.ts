import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

import type { GroupMember } from '../../core/models/group-member';

@Component({
  selector: 'app-group-member-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, MatButtonModule, MatIconModule],
  templateUrl: './group-member-list.html',
  styleUrl: './group-member-list.scss',
})
export class GroupMemberList {
  readonly members = input.required<GroupMember[]>();
  readonly loading = input(false);
  readonly canRemove = input(false);
  readonly removeMember = output<GroupMember>();

  protected canRemoveMember(member: GroupMember): boolean {
    return this.canRemove() && !member.isAdmin;
  }

  protected onRemove(member: GroupMember): void {
    this.removeMember.emit(member);
  }
}
