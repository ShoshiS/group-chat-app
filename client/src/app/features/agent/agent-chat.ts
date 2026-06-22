import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { Agent } from './agent';

/**
 * Chat window for the natural-language assistant. The user describes what they
 * want ("open a group", "invite Dana") and the agent gathers details and runs
 * the matching action via the server.
 */
@Component({
  selector: 'app-agent-chat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './agent-chat.html',
  styleUrl: './agent-chat.scss',
})
export class AgentChat {
  private readonly cdr = inject(ChangeDetectorRef);

  /** Hides the in-component header when embedded in the floating panel. */
  readonly compact = input(false);

  protected readonly agent = inject(Agent);
  protected readonly draftText = signal('');

  protected updateDraft(event: Event): void {
    this.draftText.set((event.target as HTMLTextAreaElement).value);
  }

  protected submit(): void {
    const text = this.draftText().trim();
    if (!text || this.agent.pending()) {
      return;
    }

    this.draftText.set('');
    void this.agent.send(text).finally(() => this.cdr.markForCheck());
  }
}
