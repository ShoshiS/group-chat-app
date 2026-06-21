import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AgentChat } from './agent-chat';

/** Full-page route for the AI assistant at `/agent`. */
@Component({
  selector: 'app-agent-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgentChat],
  templateUrl: './agent-page.html',
  styleUrl: './agent-page.scss',
})
export class AgentPage {}
