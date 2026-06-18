import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ConnectionService } from './core/services/connection.service';
import { Auth } from './core/services/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly connection = inject(ConnectionService);
  private readonly auth = inject(Auth);

  ngOnInit(): void {
    void this.auth.ensureSession();
    this.connection.checkApi();
    this.connection.connectSocket();
  }
}
