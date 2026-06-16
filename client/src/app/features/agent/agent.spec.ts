import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { Agent } from './agent';

describe('Agent', () => {
  let service: Agent;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Agent, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(Agent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    service.reset();
  });

  it('appends the user message and posts the conversation history', async () => {
    const sendPromise = service.send('list my groups');

    expect(service.pending()).toBe(true);
    expect(service.messages()).toEqual([{ id: jasmine.any(String), role: 'user', text: 'list my groups' }]);

    const request = httpMock.expectOne(`${environment.apiUrl}/agent/chat`);
    expect(request.request.body).toEqual({
      messages: [{ role: 'user', text: 'list my groups' }],
    });
    request.flush({
      reply: 'You have 1 groups: Alpha.',
      actions: [
        {
          tool: 'list_groups',
          args: {},
          result: { groups: [{ name: 'Alpha' }] },
        },
      ],
    });

    await sendPromise;

    expect(service.pending()).toBe(false);
    expect(service.messages()[1]).toEqual(
      jasmine.objectContaining({
        role: 'model',
        text: 'You have 1 groups: Alpha.',
        actionSummary: '✓ list_groups → 1 groups',
      }),
    );
  });

  it('ignores empty or duplicate sends while pending', async () => {
    const firstSend = service.send('hello');
    service.send('   ');
    service.send('second');

    const request = httpMock.expectOne(`${environment.apiUrl}/agent/chat`);
    request.flush({ reply: 'Hi', actions: [] });
    await firstSend;

    expect(service.messages()).toHaveSize(2);
  });

  it('stores API errors on failure', async () => {
    const sendPromise = service.send('hello');

    const request = httpMock.expectOne(`${environment.apiUrl}/agent/chat`);
    request.flush({ error: 'Server unavailable' }, { status: 503, statusText: 'Service Unavailable' });

    await sendPromise;

    expect(service.error()).toBe('Server unavailable');
    expect(service.messages()).toHaveSize(1);
  });

  it('reset clears conversation state', async () => {
    const sendPromise = service.send('hello');
    const request = httpMock.expectOne(`${environment.apiUrl}/agent/chat`);
    request.flush({ reply: 'Hi', actions: [] });
    await sendPromise;

    service.reset();

    expect(service.messages()).toEqual([]);
    expect(service.error()).toBeNull();
  });
});
