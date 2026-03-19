import { ComponentFixture, TestBed } from '@angular/core/testing';

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

  it('emits payload when manual input is valid', () => {
    const emitSpy = vi.spyOn(component.payloadScanned, 'emit');
    component.manualPayload = 'abc123';

    component.submitManualPayload();

    expect(emitSpy).toHaveBeenCalledWith('abc123');
    expect(component.errorMessage).toBe('');
  });

  it('sets error for empty payload', () => {
    component.manualPayload = '   ';

    component.submitManualPayload();

    expect(component.errorMessage).toContain('Please paste');
  });
});
