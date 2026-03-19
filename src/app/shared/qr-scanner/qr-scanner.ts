import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-qr-scanner',
  imports: [FormsModule, NgIf],
  templateUrl: './qr-scanner.html',
  styleUrl: './qr-scanner.css',
})
export class QrScanner {
  @Output() payloadScanned = new EventEmitter<string>();

  manualPayload = '';
  errorMessage = '';

  submitManualPayload(): void {
    const payload = this.manualPayload.trim();

    if (!payload) {
      this.errorMessage = 'Please paste a signaling payload.';
      return;
    }

    this.errorMessage = '';
    this.payloadScanned.emit(payload);
  }
}
