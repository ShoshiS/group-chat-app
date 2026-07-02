import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { ConnectionService } from '../../core/services/connection.service';

@Component({
  selector: 'app-connection-debug',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [JsonPipe],
  templateUrl: './connection-debug.html',
  styleUrl: './connection-debug.scss',
})
export class ConnectionDebug {
  protected readonly title = signal('Group Chat');
  protected readonly connection = inject(ConnectionService);
}
