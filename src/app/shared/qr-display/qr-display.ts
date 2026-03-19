import { Component, Input, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-qr-display',
  imports: [NgIf],
  templateUrl: './qr-display.html',
  styleUrl: './qr-display.css',
})
export class QrDisplay {
  readonly qrDataUrl = signal<string | null>(null);
  readonly errorMessage = signal('');

  @Input()
  set payload(value: string) {
    void this.renderQr(value ?? '');
  }

  private async renderQr(payload: string): Promise<void> {
    const value = payload.trim();

    if (!value) {
      this.qrDataUrl.set(null);
      this.errorMessage.set('');
      return;
    }

    try {
      const dataUrl = await QRCode.toDataURL(value, {
        errorCorrectionLevel: 'M',
        margin: 1,
        scale: 6,
      });
      this.qrDataUrl.set(dataUrl);
      this.errorMessage.set('');
    } catch (error) {
      this.qrDataUrl.set(null);
      this.errorMessage.set(`Failed to render QR code: ${String(error)}`);
    }
  }
}
