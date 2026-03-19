import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type WizardRole = 'caller' | 'callee';

export interface WizardSnapshot {
  role: WizardRole | null;
  sessionId: string | null;
  offerSdp: string | null;
  answerSdp: string | null;
  errorMessage: string | null;
}

const INITIAL_STATE: WizardSnapshot = {
  role: null,
  sessionId: null,
  offerSdp: null,
  answerSdp: null,
  errorMessage: null,
};

@Injectable({
  providedIn: 'root',
})
export class WizardState {
  private readonly stateSubject = new BehaviorSubject<WizardSnapshot>(INITIAL_STATE);
  readonly state$ = this.stateSubject.asObservable();

  get snapshot(): WizardSnapshot {
    return this.stateSubject.value;
  }

  startAsCaller(): string {
    const sessionId = this.createSessionId();
    this.stateSubject.next({
      ...INITIAL_STATE,
      role: 'caller',
      sessionId,
    });
    return sessionId;
  }

  startAsCallee(sessionId: string): void {
    this.stateSubject.next({
      ...INITIAL_STATE,
      role: 'callee',
      sessionId,
    });
  }

  ensureSessionId(): string {
    const current = this.snapshot.sessionId;
    if (current) {
      return current;
    }
    const sessionId = this.createSessionId();
    this.patch({ sessionId });
    return sessionId;
  }

  setOfferSdp(offerSdp: string): void {
    this.patch({ offerSdp });
  }

  setAnswerSdp(answerSdp: string): void {
    this.patch({ answerSdp });
  }

  setError(errorMessage: string | null): void {
    this.patch({ errorMessage });
  }

  reset(): void {
    this.stateSubject.next(INITIAL_STATE);
  }

  private patch(partial: Partial<WizardSnapshot>): void {
    this.stateSubject.next({
      ...this.snapshot,
      ...partial,
    });
  }

  private createSessionId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    const random = Math.random().toString(36).slice(2, 10);
    return `session-${Date.now()}-${random}`;
  }
}
