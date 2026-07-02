import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Auth } from '../../core/services/auth';
import { InvitationStore } from '../../core/services/invitation';
import { AgentChat } from '../../features/agent/agent-chat';

@Component({
  selector: 'app-nav-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UpperCasePipe,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconButton,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule,
    AgentChat,
  ],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
})
export class NavBar {
  private readonly router = inject(Router);
  protected readonly auth = inject(Auth);
  protected readonly invitations = inject(InvitationStore);
  protected readonly agentOpen = signal(false);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly chatActive = computed(() => {
    const url = this.currentUrl();
    if (url === '/groups') {
      return true;
    }
    const match = url?.match(/^\/groups\/([^/]+)$/);
    return match !== null && match[1] !== 'new';
  });

  protected readonly invitationsActive = computed(
    () => this.currentUrl()?.startsWith('/invitations') ?? false,
  );

  protected readonly invitationsLabel = computed(() => {
    const count = this.invitations.pendingCount();
    if (count === 0) {
      return 'Invitations';
    }
    return count === 1 ? 'Invitations (1 pending)' : `Invitations (${count} pending)`;
  });

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
