import { Component, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';

import { SignalingCodec } from '../../../core/signaling-codec';
import { Webrtc } from '../../../core/webrtc';
import { WizardState } from '../../../core/wizard-state';
import { QrScanner } from '../../../shared/qr-scanner/qr-scanner';


@Component({
  selector: 'app-scan-answer',
  imports: [NgIf, QrScanner],
  templateUrl: './scan-answer.html',
  styleUrl: './scan-answer.css',
})
export class ScanAnswer {
  private readonly codec = inject(SignalingCodec);
  private readonly webrtc = inject(Webrtc);
  private readonly wizardState = inject(WizardState);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');

  async onPayloadScanned(payload: string): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const message = this.codec.decodeFromQrPayload(payload);

      if (message.type !== 'answer') {
        throw new Error('Expected an answer payload.');
      }

      const currentSessionId = this.wizardState.snapshot.sessionId;
      if (currentSessionId && message.sessionId !== currentSessionId) {
        throw new Error('Answer payload belongs to a different session.');
      }

      await this.webrtc.applyAnswer(message.sdp);
      this.wizardState.setAnswerSdp(message.sdp);

      await this.router.navigateByUrl('/call');
    } catch (error) {
      this.errorMessage.set(`Could not apply answer: ${String(error)}`);
    } finally {
      this.loading.set(false);
    }
  }
}
