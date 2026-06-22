import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideZoneChangeDetection } from '@angular/core';

import { environment } from '../../../environments/environment';
import { AgentChat } from './agent-chat';

describe('AgentChat', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentChat],
      providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('shows the user message immediately after send', async () => {
    const fixture = TestBed.createComponent(AgentChat);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component['draftText'].set('Hello');
    component['submit']();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Hello');

    const request = httpMock.expectOne(`${environment.apiUrl}/agent/chat`);
    request.flush({ reply: 'Hi!', actions: [] });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Hi!');
  });

  it('does not send empty drafts', () => {
    const fixture = TestBed.createComponent(AgentChat);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component['draftText'].set('   ');
    component['submit']();
    fixture.detectChanges();

    expect(httpMock.match(`${environment.apiUrl}/agent/chat`).length).toBe(0);
    expect(component['draftText']()).toBe('   ');
  });
});
