import { JsonPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ConnectionService } from './core/services/connection.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, JsonPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('Group Chat');
  protected readonly connection = inject(ConnectionService);

  ngOnInit(): void {
    this.connection.checkApi();
    this.connection.connectSocket();
  }
}
