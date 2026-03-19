import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CallRoom } from './call-room';

describe('CallRoom', () => {
  let component: CallRoom;
  let fixture: ComponentFixture<CallRoom>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CallRoom],
    }).compileComponents();

    fixture = TestBed.createComponent(CallRoom);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
