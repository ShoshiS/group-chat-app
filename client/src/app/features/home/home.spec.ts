import { TestBed } from '@angular/core/testing';
import { provideZoneChangeDetection } from '@angular/core';

import { Home } from './home';

describe('Home', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideZoneChangeDetection({ eventCoalescing: true })],
    }).compileComponents();
  });

  it('shows the groups placeholder', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Your groups');
    expect(compiled.textContent).toContain('round AI button');
  });
});
