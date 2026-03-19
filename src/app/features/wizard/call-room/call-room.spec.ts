import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { CallRoom } from './call-room';
import { Webrtc } from '../../../core/webrtc';
import { WizardState } from '../../../core/wizard-state';

describe('CallRoom', () => {
  let component: CallRoom;
  let fixture: ComponentFixture<CallRoom>;

  const webrtcMock = {
    connectionState$: new BehaviorSubject<'new' | 'connected' | 'closed'>('new').asObservable(),
    bindLocalVideo: vi.fn(),
    bindRemoteVideo: vi.fn(),
    ensureLocalMedia: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(),
  };

  const routerMock = {
    navigateByUrl: vi.fn().mockResolvedValue(true),
  };

  const wizardStateMock = {
    reset: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CallRoom],
      providers: [
        { provide: Webrtc, useValue: webrtcMock },
        { provide: Router, useValue: routerMock },
        { provide: WizardState, useValue: wizardStateMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CallRoom);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('ends call and navigates to start', async () => {
    await component.endCall();

    expect(webrtcMock.close).toHaveBeenCalledTimes(1);
    expect(wizardStateMock.reset).toHaveBeenCalledTimes(1);
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/start');
  });
});
