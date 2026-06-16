import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ConnectionService } from './connection.service';

describe('ConnectionService', () => {
  let service: ConnectionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConnectionService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ConnectionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('marks the API as connected when health succeeds', () => {
    service.checkApi();

    expect(service.apiStatus()).toBe('connecting');

    const request = httpMock.expectOne(`${environment.apiUrl}/health`);
    request.flush({
      status: 'ok',
      uptime: 10,
      db: 'connected',
      timestamp: '2026-06-16T00:00:00.000Z',
    });

    expect(service.apiStatus()).toBe('connected');
    expect(service.health()?.db).toBe('connected');
    expect(service.lastError()).toBeNull();
  });

  it('stores API errors when health fails', () => {
    service.checkApi();

    const request = httpMock.expectOne(`${environment.apiUrl}/health`);
    request.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(service.apiStatus()).toBe('error');
    expect(service.lastError()).toBeTruthy();
  });

  it('starts in idle state before any checks', () => {
    expect(service.apiStatus()).toBe('idle');
    expect(service.socketStatus()).toBe('idle');
    expect(service.health()).toBeNull();
    expect(service.lastError()).toBeNull();
  });
});
