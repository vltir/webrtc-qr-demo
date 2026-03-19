import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgIf } from '@angular/common';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-qr-display',
  imports: [NgIf],
  templateUrl: './qr-display.html',
  styleUrl: './qr-display.css',
})
export class QrDisplay implements OnChanges {
  @Input() payload = '';

  qrDataUrl: string | null = null;
  errorMessage = '';

  ngOnChanges(changes: SimpleChanges): void {
    if ('payload' in changes) {
      void this.renderQr();
    }
  }

  private async renderQr(): Promise<void> {
    const value = this.payload.trim();

    if (!value) {
      this.qrDataUrl = null;
      this.errorMessage = '';
      return;
    }

    try {
      this.qrDataUrl = await QRCode.toDataURL(value, {
        errorCorrectionLevel: 'M',
        margin: 1,
        scale: 6,
      });
      this.errorMessage = '';
    } catch (error) {
      this.qrDataUrl = null;
      this.errorMessage = `Failed to render QR code: ${String(error)}`;
    }
  }
}
