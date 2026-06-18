import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideZoneChangeDetection } from '@angular/core';

import { Home } from './home';

describe('Home', () => {
  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    navigateSpy = jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        { provide: Router, useValue: { navigate: navigateSpy } },
      ],
    }).compileComponents();
  });

  it('redirects to /groups on init', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    expect(navigateSpy).toHaveBeenCalledWith(['/groups'], { replaceUrl: true });
  });
});
