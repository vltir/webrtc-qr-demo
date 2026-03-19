import { TestBed } from '@angular/core/testing';

import { WizardState } from './wizard-state';

describe('WizardState', () => {
  let service: WizardState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WizardState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
