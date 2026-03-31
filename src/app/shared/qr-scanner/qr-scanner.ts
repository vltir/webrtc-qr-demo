import { Component, EventEmitter, Output, OnDestroy, signal, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';

@Component({
  selector: 'app-qr-scanner',
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './qr-scanner.html',
  styleUrl: './qr-scanner.css',
})
export class QrScanner implements OnDestroy {
  @Output() payloadScanned = new EventEmitter<string>();
  @ViewChild('videoElement', { static: false }) videoElement?: ElementRef<HTMLVideoElement>;

  private codeReader = new BrowserQRCodeReader();
  private scannerControls?: IScannerControls;

  readonly isScanning = signal(false);
  readonly showManualInput = signal(false);
  readonly availableDevices = signal<MediaDeviceInfo[]>([]);
  readonly selectedDeviceId = signal<string | undefined>(undefined);
  readonly errorMessage = signal('');

  manualPayload = '';

  async ngOnDestroy(): Promise<void> {
    await this.stopScanning();
  }

  async startScanning(): Promise<void> {
    this.errorMessage.set('');

    try {
      // Get available video devices
      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      this.availableDevices.set(devices);

      // Select the first device or the already selected one
      const deviceId = this.selectedDeviceId() || devices[0]?.deviceId;
      if (!deviceId) {
        throw new Error('No camera found');
      }

      this.selectedDeviceId.set(deviceId);
      this.isScanning.set(true);

      // Start decoding from video element
      this.scannerControls = await this.codeReader.decodeFromVideoDevice(
        deviceId,
        this.videoElement?.nativeElement,
        (result, error) => {
          if (result) {
            const payload = result.getText();
            this.payloadScanned.emit(payload);
            void this.stopScanning();
          }
          // Ignore errors during scanning (they happen continuously until a code is found)
        }
      );
    } catch (error) {
      this.errorMessage.set(`Failed to start camera: ${String(error)}`);
      this.isScanning.set(false);
    }
  }

  async stopScanning(): Promise<void> {
    if (this.scannerControls) {
      this.scannerControls.stop();
      this.scannerControls = undefined;
    }
    this.isScanning.set(false);
  }

  async onDeviceChange(deviceId: string): Promise<void> {
    this.selectedDeviceId.set(deviceId);
    if (this.isScanning()) {
      await this.stopScanning();
      await this.startScanning();
    }
  }

  toggleManualInput(): void {
    this.showManualInput.set(!this.showManualInput());
  }

  submitManualPayload(): void {
    const payload = this.manualPayload.trim();

    if (!payload) {
      this.errorMessage.set('Please paste a signaling payload.');
      return;
    }

    this.errorMessage.set('');
    this.payloadScanned.emit(payload);
  }
}
