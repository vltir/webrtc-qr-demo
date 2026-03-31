import { TestBed } from '@angular/core/testing';
import { SignalingCodec, SignalMessage } from './signaling-codec';

describe('SignalingCodec', () => {
  let service: SignalingCodec;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SignalingCodec);
  });

  it('should roundtrip offer payload and preserve essential SDP data', () => {
    // 1. Erstelle ein realistisches (minimales) WebRTC-SDP
    // Wichtig: Enthält Fingerprint, Ufrag, Pwd und einen Candidate
    const mockSdp = [
      'v=0',
      'o=- 1234567890 2 IN IP4 127.0.0.1',
      's=-',
      't=0 0',
      'a=fingerprint:sha-256 AF:8E:22:DD:C0:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB',
      'a=ice-ufrag:test-ufrag',
      'a=ice-pwd:test-password-123',
      'a=candidate:1 1 UDP 1 192.168.1.100 54321 typ host',
      '',
    ].join('\r\n');

    const source: SignalMessage = {
      version: 1,
      sessionId: 'session-123',
      type: 'offer',
      sdp: mockSdp,
      createdAt: Date.now(),
    };

    // 2. Encode & Decode
    const encoded = service.encodeToQrPayload(source);
    const decoded = service.decodeFromQrPayload(encoded);

    // 3. Assertions
    // Metadaten müssen exakt stimmen
    expect(decoded.version).toBe(source.version);
    expect(decoded.type).toBe(source.type);
    expect(decoded.sessionId).toBe(source.sessionId);

    // Das SDP wird durch das Template verändert, muss aber die Kern-Infos enthalten
    // Wir prüfen hier auf "Inclusion" statt auf "Equality"
    expect(decoded.sdp).toContain('a=ice-ufrag:test-ufrag');
    expect(decoded.sdp).toContain('a=ice-pwd:test-password-123');
    expect(decoded.sdp).toContain('AF:8E:22:DD:C0:11:22:33:44:55:66:77:88:99:AA:BB');
    expect(decoded.sdp).toContain('192.168.1.100');
    expect(decoded.sdp).toContain('54321');

    // Prüfen, ob unser Template beide m-lines (Audio & Video) generiert hat
    expect(decoded.sdp).toContain('m=audio');
    expect(decoded.sdp).toContain('m=video');
  });
});
