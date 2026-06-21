import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';

import { Auth } from '../../core/services/auth';
import { InvitationStore } from '../../core/services/invitation';

@Component({
  selector: 'app-nav-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UpperCasePipe,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatBadgeModule,
  ],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
})
export class NavBar {
  protected readonly auth = inject(Auth);
  protected readonly invitations = inject(InvitationStore);

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        void this.invitations.load();
      }
    });
  }

  protected logout(): void {
    this.auth.logout();
  }
}
