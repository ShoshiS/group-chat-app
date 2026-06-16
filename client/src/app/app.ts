import { Component, OnInit, inject } from '@angular/core';

import { ConnectionService } from './core/services/connection.service';
import { AgentChat } from './features/agent/agent-chat';

@Component({
  selector: 'app-root',
  imports: [AgentChat],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly connection = inject(ConnectionService);

  ngOnInit(): void {
    this.connection.checkApi();
    this.connection.connectSocket();
  }
}
