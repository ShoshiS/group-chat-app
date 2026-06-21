import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { provideZoneChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Auth } from '../../core/services/auth';
import { NavBar } from './nav-bar';

describe('NavBar', () => {
  async function setup(authValue: {
    isLoggedIn: ReturnType<typeof signal<boolean>>;
    currentUser: ReturnType<typeof signal<{ id: string; username: string; email: string; role: string } | null>>;
    logout: jasmine.Spy;
  }) {
    await TestBed.configureTestingModule({
      imports: [NavBar],
      providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Auth, useValue: authValue },
      ],
    }).compileComponents();

    return TestBed.createComponent(NavBar);
  }

  it('shows guest links when logged out', async () => {
    const fixture = await setup({
      isLoggedIn: signal(false),
      currentUser: signal(null),
      logout: jasmine.createSpy('logout'),
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Login');
    expect(compiled.textContent).toContain('Register');
    expect(compiled.textContent).not.toContain('Logout');
  });

  it('shows authenticated links and username when logged in', async () => {
    const fixture = await setup({
      isLoggedIn: signal(true),
      currentUser: signal({ id: '1', username: 'tamar', email: 't@t.com', role: 'user' }),
      logout: jasmine.createSpy('logout'),
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('tamar');
    expect(compiled.textContent).toContain('Groups');
    expect(compiled.textContent).toContain('Invitations');
    expect(compiled.textContent).toContain('Profile');
    expect(compiled.textContent).toContain('Logout');
    expect(compiled.textContent).not.toContain('AI Assistant');
  });
});
