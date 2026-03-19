import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanOffer } from './scan-offer';

describe('ScanOffer', () => {
  let component: ScanOffer;
  let fixture: ComponentFixture<ScanOffer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScanOffer],
    }).compileComponents();

    fixture = TestBed.createComponent(ScanOffer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
