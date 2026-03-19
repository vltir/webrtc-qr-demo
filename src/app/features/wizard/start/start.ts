import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { WizardState } from '../../../core/wizard-state';

@Component({
  selector: 'app-start',
  imports: [],
  templateUrl: './start.html',
  styleUrl: './start.css',
})
export class Start {
  private readonly router = inject(Router);
  private readonly wizardState = inject(WizardState);

  async startCallerFlow(): Promise<void> {
    this.wizardState.startAsCaller();
    await this.router.navigateByUrl('/create-offer');
  }

  async startCalleeFlow(): Promise<void> {
    this.wizardState.reset();
    await this.router.navigateByUrl('/scan-offer');
  }
}
