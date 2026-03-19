import { AfterViewInit, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { Router } from '@angular/router';

import { Webrtc } from '../../../core/webrtc';
import { WizardState } from '../../../core/wizard-state';

@Component({
  selector: 'app-call-room',
  imports: [NgIf, AsyncPipe],
  templateUrl: './call-room.html',
  styleUrl: './call-room.css',
})
export class CallRoom {
  private readonly webrtc = inject(Webrtc);
  private readonly wizardState = inject(WizardState);
  private readonly router = inject(Router);

  @ViewChild('localVideo', { static: true }) localVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo', { static: true }) remoteVideoRef?: ElementRef<HTMLVideoElement>;

  readonly connectionState$ = this.webrtc.connectionState$;
  errorMessage = '';

  ngAfterViewInit(): void {
    const local = this.localVideoRef?.nativeElement;
    const remote = this.remoteVideoRef?.nativeElement;

    if (local) {
      this.webrtc.bindLocalVideo(local);
    }
    if (remote) {
      this.webrtc.bindRemoteVideo(remote);
    }

    void this.ensureMedia();
  }

  async endCall(): Promise<void> {
    this.webrtc.close();
    this.wizardState.reset();
    await this.router.navigateByUrl('/start');
  }

  private async ensureMedia(): Promise<void> {
    try {
      await this.webrtc.ensureLocalMedia();
    } catch (error) {
      this.errorMessage = `Could not access media devices: ${String(error)}`;
    }
  }
}
