import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateOffer } from './create-offer';

describe('CreateOffer', () => {
  let component: CreateOffer;
  let fixture: ComponentFixture<CreateOffer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateOffer],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateOffer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
