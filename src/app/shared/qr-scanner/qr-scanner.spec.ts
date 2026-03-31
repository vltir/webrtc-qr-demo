import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';

import { QrScanner } from './qr-scanner';

describe('QrScanner', () => {
  let component: QrScanner;
  let fixture: ComponentFixture<QrScanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrScanner],
    }).compileComponents();

    fixture = TestBed.createComponent(QrScanner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  describe('Manual Input', () => {
    it('emits payload when manual input is valid', () => {
      const emitSpy = vi.spyOn(component.payloadScanned, 'emit');
      component.manualPayload = 'abc123';

      component.submitManualPayload();

      expect(emitSpy).toHaveBeenCalledWith('abc123');
      expect(component.errorMessage()).toBe('');
    });

    it('trims whitespace from manual payload', () => {
      const emitSpy = vi.spyOn(component.payloadScanned, 'emit');
      component.manualPayload = '  abc123  ';

      component.submitManualPayload();

      expect(emitSpy).toHaveBeenCalledWith('abc123');
    });

    it('sets error for empty payload', () => {
      component.manualPayload = '   ';

      component.submitManualPayload();

      expect(component.errorMessage()).toContain('Please paste');
    });

    it('toggles manual input visibility', () => {
      expect(component.showManualInput()).toBe(false);

      component.toggleManualInput();
      expect(component.showManualInput()).toBe(true);

      component.toggleManualInput();
      expect(component.showManualInput()).toBe(false);
    });
  });

  describe('Camera Scanning', () => {
    it('starts scanning and lists video devices', async () => {
      const mockDevices: MediaDeviceInfo[] = [
        { deviceId: 'camera1', label: 'Front Camera', kind: 'videoinput', groupId: '', toJSON: () => ({}) },
      ];

      const mockControls: IScannerControls = {
        stop: vi.fn(),
      };

      vi.spyOn(BrowserQRCodeReader, 'listVideoInputDevices').mockResolvedValue(mockDevices);
      vi.spyOn(component['codeReader'], 'decodeFromVideoDevice').mockResolvedValue(mockControls);

      await component.startScanning();

      expect(component.isScanning()).toBe(true);
      expect(component.availableDevices()).toEqual(mockDevices);
      expect(component.selectedDeviceId()).toBe('camera1');
    });

    it('sets error when no camera is found', async () => {
      vi.spyOn(BrowserQRCodeReader, 'listVideoInputDevices').mockResolvedValue([]);

      await component.startScanning();

      expect(component.isScanning()).toBe(false);
      expect(component.errorMessage()).toContain('No camera found');
    });

    it('sets error when camera access fails', async () => {
      vi.spyOn(BrowserQRCodeReader, 'listVideoInputDevices').mockRejectedValue(new Error('Permission denied'));

      await component.startScanning();

      expect(component.isScanning()).toBe(false);
      expect(component.errorMessage()).toContain('Permission denied');
    });

    it('stops scanning and cleans up controls', async () => {
      const mockControls: IScannerControls = {
        stop: vi.fn(),
      };

      component['scannerControls'] = mockControls;
      component['isScanning'].set(true);

      await component.stopScanning();

      expect(mockControls.stop).toHaveBeenCalled();
      expect(component.isScanning()).toBe(false);
      expect(component['scannerControls']).toBeUndefined();
    });

    it('emits payload when QR code is scanned', async () => {
      const mockDevices: MediaDeviceInfo[] = [
        { deviceId: 'camera1', label: 'Front Camera', kind: 'videoinput', groupId: '', toJSON: () => ({}) },
      ];

      let scanCallback: ((result: any, error: any, controls: any) => void) | undefined;

      vi.spyOn(BrowserQRCodeReader, 'listVideoInputDevices').mockResolvedValue(mockDevices);
      vi.spyOn(component['codeReader'], 'decodeFromVideoDevice').mockImplementation(
        async (_deviceId, _videoElement, callback) => {
          scanCallback = callback;
          return { stop: vi.fn() };
        }
      );

      const emitSpy = vi.spyOn(component.payloadScanned, 'emit');
      const stopSpy = vi.spyOn(component, 'stopScanning');

      await component.startScanning();

      // Simulate a QR code being scanned
      const mockResult = { getText: () => 'scanned-payload' };
      const mockControls = { stop: vi.fn() };
      scanCallback?.(mockResult, null, mockControls);

      expect(emitSpy).toHaveBeenCalledWith('scanned-payload');
      expect(stopSpy).toHaveBeenCalled();
    });

    it('changes camera device when onDeviceChange is called', async () => {
      const mockDevices: MediaDeviceInfo[] = [
        { deviceId: 'camera1', label: 'Front Camera', kind: 'videoinput', groupId: '', toJSON: () => ({}) },
        { deviceId: 'camera2', label: 'Back Camera', kind: 'videoinput', groupId: '', toJSON: () => ({}) },
      ];

      vi.spyOn(BrowserQRCodeReader, 'listVideoInputDevices').mockResolvedValue(mockDevices);
      vi.spyOn(component['codeReader'], 'decodeFromVideoDevice').mockResolvedValue({ stop: vi.fn() });

      await component.startScanning();
      expect(component.selectedDeviceId()).toBe('camera1');

      const stopSpy = vi.spyOn(component, 'stopScanning');
      const startSpy = vi.spyOn(component, 'startScanning');

      await component.onDeviceChange('camera2');

      expect(component.selectedDeviceId()).toBe('camera2');
      expect(stopSpy).toHaveBeenCalled();
      expect(startSpy).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('stops scanning on component destroy', async () => {
      const stopSpy = vi.spyOn(component, 'stopScanning');

      await component.ngOnDestroy();

      expect(stopSpy).toHaveBeenCalled();
    });
  });
});
