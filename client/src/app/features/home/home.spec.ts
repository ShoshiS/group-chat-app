import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZoneChangeDetection } from '@angular/core';

import { Auth } from '../../core/services/auth';
import { Home } from './home';

describe('Home', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: Auth,
          useValue: {
            currentUser: signal({ id: '1', username: 'tamar', email: 't@t.com', role: 'user' }),
            logout: jasmine.createSpy('logout'),
          },
        },
      ],
    }).compileComponents();
  });

  it('shows the main placeholder by default', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Your groups');
    expect(compiled.querySelector('app-agent-chat')).toBeNull();
  });

  it('opens the agent panel only after clicking the temporary button', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('.home__agent-btn') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(compiled.querySelector('app-agent-chat')).not.toBeNull();
    expect(compiled.textContent).toContain('AI Assistant — temporary access');
  });
});
