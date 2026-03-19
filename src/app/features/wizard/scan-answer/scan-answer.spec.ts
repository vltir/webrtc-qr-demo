import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';

import { ScanAnswer } from './scan-answer';
import { SignalingCodec } from '../../../core/signaling-codec';
import { Webrtc } from '../../../core/webrtc';
import { WizardState } from '../../../core/wizard-state';

describe('ScanAnswer', () => {
  let component: ScanAnswer;
  let fixture: ComponentFixture<ScanAnswer>;

  const codecMock = {
    decodeFromQrPayload: vi.fn().mockReturnValue({
      version: 1,
      sessionId: 'session-123',
      type: 'answer',
      sdp: 'answer-sdp',
      createdAt: Date.now(),
    }),
  };

  const webrtcMock = {
    applyAnswer: vi.fn().mockResolvedValue(undefined),
  };

  const routerMock = {
    navigateByUrl: vi.fn().mockResolvedValue(true),
  };

  const wizardStateMock = {
    snapshot: { sessionId: 'session-123' },
    setAnswerSdp: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScanAnswer],
      providers: [
        { provide: SignalingCodec, useValue: codecMock },
        { provide: Webrtc, useValue: webrtcMock },
        { provide: Router, useValue: routerMock },
        { provide: WizardState, useValue: wizardStateMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScanAnswer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('applies answer and navigates to call', async () => {
    await component.onPayloadScanned('raw-answer');

    expect(webrtcMock.applyAnswer).toHaveBeenCalledWith('answer-sdp');
    expect(wizardStateMock.setAnswerSdp).toHaveBeenCalledWith('answer-sdp');
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/call');
    expect(component.errorMessage()).toBe('');
  });
});
