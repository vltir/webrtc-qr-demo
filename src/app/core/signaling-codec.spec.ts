import { TestBed } from '@angular/core/testing';

import { SignalingCodec } from './signaling-codec';

describe('SignalingCodec', () => {
  let service: SignalingCodec;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SignalingCodec);
  });

  it('should roundtrip offer payload', () => {
    const source = {
      version: 1,
      sessionId: 'session-123',
      type: 'offer' as const,
      sdp: 'v=0\r\no=- 123 2 IN IP4 127.0.0.1\r\ns=-\r\n',
      createdAt: Date.now(),
    };

    const encoded = service.encodeToQrPayload(source);
    const decoded = service.decodeFromQrPayload(encoded);

    expect(decoded).toEqual(source);
  });
});
