import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZoneChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import type { Message } from '../../core/models/message';
import { MessageForm } from './message-form';
import { MessageStore } from './message';

describe('MessageForm', () => {
  const composeSpy = jasmine.createSpy('compose');

  async function setup(messages: Message[] = []) {
    composeSpy.calls.reset();

    await TestBed.configureTestingModule({
      imports: [MessageForm, NoopAnimationsModule],
      providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: MessageStore,
          useValue: {
            messages: signal(messages),
            compose: composeSpy,
            send: jasmine.createSpy('send'),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(MessageForm);
    fixture.componentRef.setInput('groupId', 'group-1');
    fixture.detectChanges();

    const snackBarOpenSpy = spyOn(
      fixture.componentInstance['snackBar'] as MatSnackBar,
      'open',
    ).and.stub();

    return { fixture, snackBarOpenSpy };
  }

  it('renders the AI compose button', async () => {
    const { fixture } = await setup();
    const button = fixture.nativeElement.querySelector('[aria-label="AI compose"]') as HTMLElement;
    expect(button).toBeTruthy();
  });

  it('calls compose without draft in generate mode', async () => {
    composeSpy.and.resolveTo('Sure, see you then!');
    const { fixture } = await setup([
      {
        id: '1',
        groupId: 'group-1',
        senderId: 'user-1',
        text: 'Are we meeting tomorrow?',
        createdAt: '2026-06-21T10:00:00.000Z',
        updatedAt: '2026-06-21T10:00:00.000Z',
      },
    ]);

    await fixture.componentInstance['onAiCompose']();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(composeSpy).toHaveBeenCalledWith('group-1', undefined);
    expect(fixture.componentInstance['textControl'].value).toBe('Sure, see you then!');
  });

  it('calls compose with draft in polish mode', async () => {
    composeSpy.and.resolveTo('I can do it tomorrow.');
    const { fixture } = await setup([
      {
        id: '1',
        groupId: 'group-1',
        senderId: 'user-1',
        text: 'Can you review this?',
        createdAt: '2026-06-21T10:00:00.000Z',
        updatedAt: '2026-06-21T10:00:00.000Z',
      },
    ]);

    fixture.componentInstance['textControl'].setValue('i can do it tomorow');
    await fixture.componentInstance['onAiCompose']();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(composeSpy).toHaveBeenCalledWith('group-1', 'i can do it tomorow');
    expect(fixture.componentInstance['textControl'].value).toBe('I can do it tomorrow.');
  });

  it('shows a snackbar when generate mode has no text messages', async () => {
    const { fixture, snackBarOpenSpy } = await setup();
    await fixture.componentInstance['onAiCompose']();

    expect(composeSpy).not.toHaveBeenCalled();
    expect(snackBarOpenSpy).toHaveBeenCalledWith('No messages to reply to yet', 'OK', {
      duration: 3000,
    });
  });

  it('shows a snackbar when compose fails', async () => {
    composeSpy.and.rejectWith({ status: 500 });
    const { fixture, snackBarOpenSpy } = await setup([
      {
        id: '1',
        groupId: 'group-1',
        senderId: 'user-1',
        text: 'Hello',
        createdAt: '2026-06-21T10:00:00.000Z',
        updatedAt: '2026-06-21T10:00:00.000Z',
      },
    ]);

    await fixture.componentInstance['onAiCompose']();

    expect(snackBarOpenSpy).toHaveBeenCalledWith('Could not generate message', 'OK', {
      duration: 4000,
    });
  });
});
