import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { Auth } from './auth';

describe('Auth', () => {
  let auth: Auth;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [Auth, provideHttpClient(), provideHttpClientTesting()],
    });

    auth = TestBed.inject(Auth);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('registers, stores token, and sets current user', async () => {
    const promise = auth.register({
      username: 'tamar',
      email: 'tamar@example.com',
      password: 'secret1',
    });

    const request = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
    expect(request.request.method).toBe('POST');
    request.flush({
      token: 'jwt-token',
      user: { id: '1', username: 'tamar', email: 'tamar@example.com', role: 'user' },
    });

    await promise;

    expect(localStorage.getItem('auth_token')).toBe('jwt-token');
    expect(auth.currentUser()?.username).toBe('tamar');
  });

  it('restores session from stored token', async () => {
    localStorage.setItem('auth_token', 'jwt-token');

    const promise = auth.ensureSession();
    const request = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
    request.flush({ id: '1', username: 'tamar', email: 'tamar@example.com', role: 'user' });
    await promise;

    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.sessionReady()).toBe(true);
  });

  it('clears invalid token on failed restore', async () => {
    localStorage.setItem('auth_token', 'expired');

    const promise = auth.ensureSession();
    httpMock.expectOne(`${environment.apiUrl}/auth/me`).flush(
      { error: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' },
    );
    await promise;

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(auth.isLoggedIn()).toBe(false);
  });
});
