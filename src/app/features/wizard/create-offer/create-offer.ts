import { Component, OnInit, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';

import { SignalingCodec } from '../../../core/signaling-codec';
import { Webrtc } from '../../../core/webrtc';
import { WizardState } from '../../../core/wizard-state';
import { QrDisplay } from '../../../shared/qr-display/qr-display';

@Component({
  selector: 'app-create-offer',
  imports: [NgIf, QrDisplay],
  templateUrl: './create-offer.html',
  styleUrl: './create-offer.css',
})
export class CreateOffer {
  private readonly codec = inject(SignalingCodec);
  private readonly webrtc = inject(Webrtc);
  private readonly wizardState = inject(WizardState);
  private readonly router = inject(Router);

  offerPayload = '';
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    if (this.wizardState.snapshot.role !== 'caller') {
      this.wizardState.startAsCaller();
    }
  }

  async createOfferQr(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const sessionId = this.wizardState.ensureSessionId();
      const offerSdp = await this.webrtc.createOffer();
      this.wizardState.setOfferSdp(offerSdp);

      this.offerPayload = this.codec.encodeToQrPayload({
        version: 1,
        sessionId,
        type: 'offer',
        sdp: offerSdp,
        createdAt: Date.now(),
      });
    } catch (error) {
      this.errorMessage = `Could not create offer: ${String(error)}`;
    } finally {
      this.loading = false;
    }
  }

  async goToScanAnswer(): Promise<void> {
    await this.router.navigateByUrl('/scan-answer');
  }
}
