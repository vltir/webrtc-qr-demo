import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Webrtc } from './webrtc';

class FakePeerConnection extends EventTarget {
  localDescription: RTCLocalSessionDescriptionInit | null = null;
  remoteDescription: RTCSessionDescriptionInit | null = null;
  iceGatheringState: RTCIceGatheringState = 'complete';
  connectionState: RTCPeerConnectionState = 'new';

  ontrack: ((this: RTCPeerConnection, ev: RTCTrackEvent) => unknown) | null = null;
  onconnectionstatechange: ((this: RTCPeerConnection, ev: Event) => unknown) | null = null;

  private readonly senders: RTCRtpSender[] = [];
  close = vi.fn();

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    return { type: 'offer', sdp: 'offer-sdp' };
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    return { type: 'answer', sdp: 'answer-sdp' };
  }

  async setLocalDescription(desc?: RTCLocalSessionDescriptionInit): Promise<void> {
    this.localDescription = desc ?? null;
  }

  async setRemoteDescription(desc: RTCSessionDescriptionInit): Promise<void> {
    this.remoteDescription = desc;
  }

  addTrack(track: MediaStreamTrack): RTCRtpSender {
    const sender = { track } as RTCRtpSender;
    this.senders.push(sender);
    return sender;
  }

  getSenders(): RTCRtpSender[] {
    return this.senders;
  }
}

  describe('Webrtc', () => {
  let service: Webrtc;
  let originalRtcPeerConnection: typeof RTCPeerConnection | undefined;
  let originalMediaDevices: MediaDevices | undefined;

  const fakeTrack = { stop: vi.fn() } as unknown as MediaStreamTrack;
  const fakeStream = {
    getTracks: () => [fakeTrack],
  } as unknown as MediaStream;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Webrtc);

    originalRtcPeerConnection = globalThis.RTCPeerConnection;
    originalMediaDevices = globalThis.navigator.mediaDevices;

    (globalThis as unknown as { RTCPeerConnection: typeof RTCPeerConnection }).RTCPeerConnection =
      FakePeerConnection as unknown as typeof RTCPeerConnection;

    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(fakeStream),
      } as Partial<MediaDevices>,
    });
  });

  afterEach(() => {
    if (originalRtcPeerConnection) {
      (globalThis as unknown as { RTCPeerConnection: typeof RTCPeerConnection }).RTCPeerConnection =
        originalRtcPeerConnection;
    }

    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
  });

  it('creates an offer and returns local SDP', async () => {
    const offerSdp = await service.createOffer();
    expect(offerSdp).toBe('offer-sdp');
  });

  it('accepts offer and creates answer SDP', async () => {
    const answerSdp = await service.acceptOfferAndCreateAnswer('incoming-offer-sdp');
    expect(answerSdp).toBe('answer-sdp');
  });

  it('applies remote answer', async () => {
    await service.createOffer();
    await service.applyAnswer('incoming-answer-sdp');
    expect(true).toBe(true); // no throw is enough for this unit-level check
  });

  it('stops local tracks on close', async () => {
    await service.createOffer();
    service.close();
    expect(fakeTrack.stop).toHaveBeenCalledTimes(1);
  });
});
