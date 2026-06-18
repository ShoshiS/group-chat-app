import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { Auth } from '../../core/services/auth';
import { AgentChat } from '../agent/agent-chat';

/**
 * Main authenticated shell. Group chat UI will land here in later slices;
 * the AI agent is exposed only through an explicit temporary dev button.
 */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgentChat],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly auth = inject(Auth);
  protected readonly agentOpen = signal(false);

  protected openAgent(): void {
    this.agentOpen.set(true);
  }

  protected closeAgent(): void {
    this.agentOpen.set(false);
  }

  protected logout(): void {
    this.auth.logout();
  }
}
