import { provideHttpClient } from '@angular/common/http';

import { provideHttpClientTesting } from '@angular/common/http/testing';

import { signal } from '@angular/core';

import { provideZoneChangeDetection } from '@angular/core';

import { TestBed } from '@angular/core/testing';

import { provideRouter } from '@angular/router';



import { Auth } from '../../core/services/auth';

import { InvitationStore } from '../../core/services/invitation';

import { NavBar } from './nav-bar';



describe('NavBar', () => {

  async function setup(authValue: {

    isLoggedIn: ReturnType<typeof signal<boolean>>;

    currentUser: ReturnType<typeof signal<{ id: string; username: string; email: string; role: string; avatar?: string } | null>>;

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

        {

          provide: InvitationStore,

          useValue: { pendingCount: signal(0), load: jasmine.createSpy('load') },

        },

      ],

    }).compileComponents();



    return TestBed.createComponent(NavBar);

  }



  it('shows guest nav strip with logo when logged out', async () => {
    const fixture = await setup({
      isLoggedIn: signal(false),
      currentUser: signal(null),
      logout: jasmine.createSpy('logout'),
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const strip = compiled.querySelector('.nav-strip--guest');

    expect(strip).toBeTruthy();
    expect(strip?.querySelector('.nav-strip__logo')).toBeTruthy();
    expect(compiled.querySelector('[aria-label="Chat"]')).toBeNull();
  });



  it('shows icon nav strip and avatar when logged in', async () => {

    const fixture = await setup({

      isLoggedIn: signal(true),

      currentUser: signal({

        id: '1',

        username: 'tamar',

        email: 't@t.com',

        role: 'user',

        avatar: 'https://example.com/avatar.jpg',

      }),

      logout: jasmine.createSpy('logout'),

    });

    fixture.detectChanges();



    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.nav-strip')).toBeTruthy();

    expect(compiled.querySelector('[aria-label="Chat"]')).toBeTruthy();

    expect(compiled.querySelector('[aria-label="Invitations"]')).toBeTruthy();

    expect(compiled.querySelector('[aria-label="AI Assistant"]')).toBeTruthy();
    expect(compiled.querySelector('.nav-agent-panel')).toBeNull();

    expect(compiled.querySelector('[aria-label="tamar profile"]')).toBeTruthy();

    expect(compiled.querySelector('[aria-label="Logout"]')).toBeTruthy();

    expect(compiled.querySelector('.nav-strip__avatar')).toBeTruthy();

  });



  it('opens AI assistant floating panel when toggled', async () => {
    const fixture = await setup({
      isLoggedIn: signal(true),
      currentUser: signal({ id: '1', username: 'tamar', email: 't@t.com', role: 'user' }),
      logout: jasmine.createSpy('logout'),
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const toggle = compiled.querySelector('[aria-label="AI Assistant"]') as HTMLButtonElement;

    toggle.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.nav-agent-panel')).toBeTruthy();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    const close = compiled.querySelector('[aria-label="Close AI assistant"]') as HTMLButtonElement;
    close.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.nav-agent-panel')).toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('shows avatar fallback initial when user has no avatar', async () => {

    const fixture = await setup({

      isLoggedIn: signal(true),

      currentUser: signal({ id: '1', username: 'tamar', email: 't@t.com', role: 'user' }),

      logout: jasmine.createSpy('logout'),

    });

    fixture.detectChanges();



    const compiled = fixture.nativeElement as HTMLElement;

    const fallback = compiled.querySelector('.nav-strip__avatar-fallback');

    expect(fallback?.textContent?.trim()).toBe('T');

  });

});


