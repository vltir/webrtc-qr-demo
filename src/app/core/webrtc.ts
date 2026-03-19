import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Webrtc {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  private localVideoElement: HTMLVideoElement | null = null;
  private remoteVideoElement: HTMLVideoElement | null = null;

  private readonly connectionStateSubject = new BehaviorSubject<RTCPeerConnection>('new');
  readonly connectionState$ = this.connectionStateSubject.asObservable();

  private readonly rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
    ],
  };

  bindLocalVideo(element: HTMLVideoElement): void {
    this.localVideoElement = element;
    if (this.localStream) {
      this.localVideoElement.srcObject = this.localStream;
      this.localVideoElement.muted = true;
      this.localVideoElement.playsInline = true;
    }
  }

  bindRemoteVideo(element: HTMLVideoElement): void {
    this.remoteVideoElement = element;
    if (this.remoteStream) {
      this.remoteVideoElement.srcObject = this.remoteStream;
      this.remoteVideoElement.playsInline = true;
    }
  }

  async ensureLocalMedia(constraints: MediaStreamConstraints = {
    video: true,
    audio: true
  }): Promise<MediaStream> {
    if(this.localStream) {
      return this.localStream;
    }

    if(!navigator.mediaDevices?.getUserMedia) {
      throw new Error('getUserMedia is not available in this browser/context');
    }

    this.localStream = await navigator.mediaDevices.getUserMedia(constriants);

    if (this.localVideoElement) {
      this.localVideoElement.srcObject = this.localStream;
      this.localVideoElement.muted = true;
      this.localVideoElement.playsInline = true;
    }

    return this.localStream;
  }

  async createOffer(): Promise<string> {
    const pc = this.ensurePeerConnection();
    const stream = await this.ensureLocalMedia();

    this.ensureTracksAdded(stream, pc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await this.waitForIceGatheringComplete(pc);

    const sdp = pc.localDescription?.sdp;
    if (!sdp) {
      throw new Error('Failed to create local offer SDP.');
    }

    return sdp;
  }

  async acceptOfferAndCreateAnswer(offerSdp: string): Promise<string> {
    const pc = this.ensurePeerConnection();
    const stream = await this.ensureLocalMedia();

    this.ensureTracksAdded(stream, pc);

    await pc.setRemoteDescription({
      type: 'offer',
      sdp: offerSdp,
    });

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await this.waitForIceGatheringComplete(pc);

    const sdp = pc.localDescription?.sdp;
    if (!sdp) {
      throw new Error('Failed to create local answer SDP.');
    }

    return sdp;
  }

  async applyAnswer(answerSdp: string): Promise<void> {
    const pc = this.ensurePeerConnection();
    await pc.setRemoteDescription({
      type: 'answer',
      sdp: answerSdp,
    });
  }

  close(): void {
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        track.stop();
      }
    }

    if (this.peerConnection) {
      this.peerConnection.close();
    }
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;

    if (this.localVideoElement) {
      this.localVideoElement.srcObject = null;
    }
    if (this.remoteVideoElement) {
      this.remoteVideoElement.srcObject = null;
    }

    this.connectionStateSubject.next('closed');
  }

  private ensurePeerConnection(): RTCPeerConnection {
    if (this.peerConnection) {
      return this.peerConnection;
    }

    const pc = new RTCPeerConnection(this.rtcConfig);
    this.remoteStream = this.createEmptyMediaStream();

    pc.ontrack = (event: RTCTrackEvent) => {
      const incomingStream = event.streams?.[0];
      if (incomingStream) {
        this.remoteStream = incomingStream;
      } else {
        // Fallback for environments that do not provide streams on track events.
        this.remoteStream?.addTrack(event.track);
      }

      if (this.remoteVideoElement && this.remoteStream) {
        this.remoteVideoElement.srcObject = this.remoteStream;
        this.remoteVideoElement.playsInline = true;
      }
    };

    pc.onconnectionstatechange = () => {
      this.connectionStateSubject.next(pc.connectionState);
    };

    this.peerConnection = pc;
    return pc;
  }

  private ensureTracksAdded(stream: MediaStream, pc: RTCPeerConnection): void {
    const existingTracks = new Set(pc.getSenders().map((sender) => sender.track).filter(Boolean));

    for (const track of stream.getTracks()) {
      if (!existingTracks.has(track)) {
        pc.addTrack(track, stream);
      }
    }
  }

  private waitForIceGatheringComplete(pc: RTCPeerConnection, timeoutMs = 7000): Promise<void> {
    if (pc.iceGatheringState === 'complete') {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        pc.removeEventListener('icegatheringstatechange', onStateChange);
        reject(new Error('Timed out while gathering ICE candidates.'));
      }, timeoutMs);

      const onStateChange = () => {
        if (pc.iceGatheringState === 'complete') {
          clearTimeout(timeoutId);
          pc.removeEventListener('icegatheringstatechange', onStateChange);
          resolve();
        }
      };

      pc.addEventListener('icegatheringstatechange', onStateChange);
    });
  }

  private createEmptyMediaStream(): MediaStream {
    if (typeof MediaStream !== 'undefined') {
      return new MediaStream();
    }

    const tracks: MediaStreamTrack[] = [];
    return {
      addTrack: (track: MediaStreamTrack) => {
        tracks.push(track);
      },
      getTracks: () => tracks,
    } as unknown as MediaStream;
  }

}
