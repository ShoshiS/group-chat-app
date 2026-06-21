import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import type { Group } from '../../core/models/group';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-group-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './group-card.html',
  styleUrl: './group-card.scss',
})
export class GroupCard {
  readonly group = input.required<Group>();
  readonly edit = output<Group>();
  readonly delete = output<Group>();
  readonly leave = output<Group>();

  private readonly auth = inject(Auth);

  protected isAdmin(): boolean {
    return this.group().adminId === this.auth.currentUser()?.id;
  }
}
