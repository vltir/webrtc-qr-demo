import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';

import { Start } from './start';
import { WizardState } from '../../../core/wizard-state';

describe('Start', () => {
  let component: Start;
  let fixture: ComponentFixture<Start>;
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let wizardState: WizardState;

  beforeEach(async () => {
    routerMock = {
      navigateByUrl: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [Start],
      providers: [WizardState, { provide: Router, useValue: routerMock }],
    }).compileComponents();

    wizardState = TestBed.inject(WizardState);
    fixture = TestBed.createComponent(Start);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('starts caller flow and navigates to create-offer', async () => {
    await component.startCallerFlow();

    expect(wizardState.snapshot.role).toBe('caller');
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/create-offer');
  });

  it('starts callee flow and navigates to scan-offer', async () => {
    await component.startCalleeFlow();

    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/scan-offer');
  });
});
