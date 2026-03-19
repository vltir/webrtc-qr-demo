import { TestBed } from '@angular/core/testing';

import { WizardState } from './wizard-state';

describe('WizardState', () => {
  let service: WizardState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WizardState);
  });

  it('starts caller flow with session id', () => {
    const sessionId = service.startAsCaller();

    expect(service.snapshot.role).toBe('caller');
    expect(service.snapshot.sessionId).toBe(sessionId);
    expect(service.snapshot.offerSdp).toBeNull();
  });

  it('starts callee flow with provided session id', () => {
    service.startAsCallee('session-abc');

    expect(service.snapshot.role).toBe('callee');
    expect(service.snapshot.sessionId).toBe('session-abc');
  });

  it('resets to initial state', () => {
    service.startAsCaller();
    service.setOfferSdp('offer');
    service.setAnswerSdp('answer');
    service.setError('boom');

    service.reset();

    expect(service.snapshot.role).toBeNull();
    expect(service.snapshot.sessionId).toBeNull();
    expect(service.snapshot.offerSdp).toBeNull();
    expect(service.snapshot.answerSdp).toBeNull();
    expect(service.snapshot.errorMessage).toBeNull();
  });
});
