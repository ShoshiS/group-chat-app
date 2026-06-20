import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';

import { Auth } from '../../core/services/auth';
import { AgentChat } from '../../features/agent/agent-chat';

@Component({
  selector: 'app-nav-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, AgentChat],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
})
export class NavBar {
  protected readonly auth = inject(Auth);
  protected readonly agentOpen = signal(false);

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
