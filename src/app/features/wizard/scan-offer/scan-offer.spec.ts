import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';

import { ScanOffer } from './scan-offer';
import { SignalingCodec } from '../../../core/signaling-codec';
import { Webrtc } from '../../../core/webrtc';
import { WizardState } from '../../../core/wizard-state';

describe('ScanOffer', () => {
  let component: ScanOffer;
  let fixture: ComponentFixture<ScanOffer>;

  const codecMock = {
    decodeFromQrPayload: vi.fn().mockReturnValue({
      version: 1,
      sessionId: 'session-123',
      type: 'offer',
      sdp: 'offer-sdp',
      createdAt: Date.now(),
    }),
    encodeToQrPayload: vi.fn().mockReturnValue('encoded-answer'),
  };

  const webrtcMock = {
    acceptOfferAndCreateAnswer: vi.fn().mockResolvedValue('answer-sdp'),
  };

  const routerMock = {
    navigateByUrl: vi.fn().mockResolvedValue(true),
  };

  const wizardStateMock = {
    startAsCallee: vi.fn(),
    setOfferSdp: vi.fn(),
    setAnswerSdp: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScanOffer],
      providers: [
        { provide: SignalingCodec, useValue: codecMock },
        { provide: Webrtc, useValue: webrtcMock },
        { provide: Router, useValue: routerMock },
        { provide: WizardState, useValue: wizardStateMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScanOffer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('accepts offer and creates answer payload', async () => {
    await component.onPayloadScanned('raw-offer');

    expect(codecMock.decodeFromQrPayload).toHaveBeenCalledWith('raw-offer');
    expect(webrtcMock.acceptOfferAndCreateAnswer).toHaveBeenCalledWith('offer-sdp');
    expect(codecMock.encodeToQrPayload).toHaveBeenCalledTimes(1);
    expect(component.answerPayload()).toBe('encoded-answer');
  });

  it('navigates to call', async () => {
    await component.goToCall();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/call');
  });
});
