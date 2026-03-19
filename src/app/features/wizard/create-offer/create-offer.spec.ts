import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';

import { CreateOffer } from './create-offer';
import { SignalingCodec } from '../../../core/signaling-codec';
import { Webrtc } from '../../../core/webrtc';
import { WizardState } from '../../../core/wizard-state';

describe('CreateOffer', () => {
  let component: CreateOffer;
  let fixture: ComponentFixture<CreateOffer>;

  const webrtcMock = {
    createOffer: vi.fn().mockResolvedValue('offer-sdp'),
  };

  const codecMock = {
    encodeToQrPayload: vi.fn().mockReturnValue('encoded-offer'),
  };

  const routerMock = {
    navigateByUrl: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateOffer],
      providers: [
        WizardState,
        { provide: Webrtc, useValue: webrtcMock },
        { provide: SignalingCodec, useValue: codecMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateOffer);
    component = fixture.componentInstance;
    component.ngOnInit();
    await fixture.whenStable();
  });

  it('creates offer payload', async () => {
    await component.createOfferQr();

    expect(webrtcMock.createOffer).toHaveBeenCalledTimes(1);
    expect(codecMock.encodeToQrPayload).toHaveBeenCalledTimes(1);
    expect(component.offerPayload).toBe('encoded-offer');
    expect(component.errorMessage).toBe('');
  });

  it('navigates to scan-answer', async () => {
    await component.goToScanAnswer();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/scan-answer');
  });
});
