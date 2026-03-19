import { Component, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';

import { SignalingCodec } from '../../../core/signaling-codec';
import { Webrtc } from '../../../core/webrtc';
import { WizardState } from '../../../core/wizard-state';
import { QrDisplay } from '../../../shared/qr-display/qr-display';
import { QrScanner } from '../../../shared/qr-scanner/qr-scanner';


@Component({
  selector: 'app-scan-offer',
  imports: [NgIf, QrDisplay, QrScanner],
  templateUrl: './scan-offer.html',
  styleUrl: './scan-offer.css',
})
export class ScanOffer {
  private readonly codec = inject(SignalingCodec);
  private readonly webrtc = inject(Webrtc);
  private readonly wizardState = inject(WizardState);
  private readonly router = inject(Router);

  readonly answerPayload = signal('');
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  async onPayloadScanned(payload: string): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const message = this.codec.decodeFromQrPayload(payload);

      if (message.type !== 'offer') {
        throw new Error('Expected an offer payload.');
      }

      this.wizardState.startAsCallee(message.sessionId);
      this.wizardState.setOfferSdp(message.sdp);

      const answerSdp = await this.webrtc.acceptOfferAndCreateAnswer(message.sdp);
      this.wizardState.setAnswerSdp(answerSdp);

      const encoded = this.codec.encodeToQrPayload({
        version: 1,
        sessionId: message.sessionId,
        type: 'answer',
        sdp: answerSdp,
        createdAt: Date.now(),
      });

      this.answerPayload.set(encoded);
    } catch (error) {
      this.errorMessage.set(`Could not process offer: ${String(error)}`);
    } finally {
      this.loading.set(false);
    }
  }

  async goToCall(): Promise<void> {
    await this.router.navigateByUrl('/call');
  }
}
