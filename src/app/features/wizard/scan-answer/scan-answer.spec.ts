import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanAnswer } from './scan-answer';

describe('ScanAnswer', () => {
  let component: ScanAnswer;
  let fixture: ComponentFixture<ScanAnswer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScanAnswer],
    }).compileComponents();

    fixture = TestBed.createComponent(ScanAnswer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
