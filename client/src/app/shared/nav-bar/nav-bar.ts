import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';

import { Auth } from '../../core/services/auth';
import { InvitationStore } from '../../core/services/invitation';
import { AgentChat } from '../../features/agent/agent-chat';

@Component({
  selector: 'app-nav-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatBadgeModule,
    AgentChat,
  ],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
})
export class NavBar {
  protected readonly auth = inject(Auth);
  protected readonly invitations = inject(InvitationStore);
  protected readonly agentOpen = signal(false);

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        void this.invitations.load();
      }
    });
  }

  protected toggleAgent(): void {
    this.agentOpen.update((open) => !open);
  }

  protected closeAgent(): void {
    this.agentOpen.set(false);
  }

  protected logout(): void {
    this.auth.logout();
  }
}
