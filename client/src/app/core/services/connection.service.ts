import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { io, type Socket } from 'socket.io-client';

import { environment } from '../../../environments/environment';

type Status = 'idle' | 'connecting' | 'connected' | 'error';

interface HealthResponse {
  status: string;
  uptime: number;
  db: 'connected' | 'disconnected';
  timestamp: string;
}

/**
 * Verifies and exposes the live state of both transports to the server:
 * the REST API (via `/api/health`) and the Socket.io real-time channel.
 * Used as the smoke test that the client ↔ server wiring works end to end.
 */
@Injectable({ providedIn: 'root' })
export class ConnectionService {
  readonly apiStatus = signal<Status>('idle');
  readonly socketStatus = signal<Status>('idle');
  readonly health = signal<HealthResponse | null>(null);
  readonly lastError = signal<string | null>(null);

  private socket?: Socket;

  constructor(private readonly http: HttpClient) {}

  checkApi(): void {
    this.apiStatus.set('connecting');
    this.lastError.set(null);

    this.http.get<HealthResponse>(`${environment.apiUrl}/health`).subscribe({
      next: (response) => {
        this.health.set(response);
        this.apiStatus.set('connected');
      },
      error: (error) => {
        this.apiStatus.set('error');
        this.lastError.set(error?.message ?? 'Unknown API error');
      },
    });
  }

  connectSocket(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socketStatus.set('connecting');
    this.socket = io(environment.socketUrl, { transports: ['websocket', 'polling'] });

    this.socket.on('connect', () => this.socketStatus.set('connected'));
    this.socket.on('disconnect', () => this.socketStatus.set('idle'));
    this.socket.on('connect_error', (error) => {
      this.socketStatus.set('error');
      this.lastError.set(error.message);
    });
  }
}
