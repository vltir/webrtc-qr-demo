import { Injectable } from '@angular/core';
import { deflateRaw, inflateRaw } from 'pako';
import * as protobuf from 'protobufjs';

export type SignalType = 'offer' | 'answer';

export interface SignalMessage {
  version: number;
  sessionId: string;
  type: SignalType;
  sdp: string;
  createdAt: number;
}

const SIGNAL_PROTO = `
syntax = "proto3";
package webrtc;

message Candidate {
  bytes ip = 1;
  uint32 port = 2;
  uint32 priority = 3;
}

message SignalMessage {
  uint32 version = 1;
  string sessionId = 2;
  enum MessageType { OFFER = 0; ANSWER = 1; }
  MessageType type = 3;
  int64 createdAt = 4;
  string ufrag = 5;
  string pwd = 6;
  bytes fingerprint = 7;
  repeated Candidate candidates = 8;
}
`;

@Injectable({
  providedIn: 'root',
})
export class SignalingCodec {
  private readonly root = protobuf.parse(SIGNAL_PROTO).root;
  private readonly signalMessageType = this.root.lookupType('webrtc.SignalMessage');

  encodeToQrPayload(message: SignalMessage): string {
    const iceInfo = this.extractSdpDetails(message.sdp);

    const protoObject = {
      version: message.version,
      sessionId: message.sessionId,
      type: message.type === 'offer' ? 0 : 1,
      createdAt: message.createdAt,
      ufrag: iceInfo.ufrag,
      pwd: iceInfo.pwd,
      fingerprint: iceInfo.fingerprint,
      candidates: iceInfo.candidates,
    };

    const encodedBinary = this.signalMessageType
      .encode(this.signalMessageType.create(protoObject))
      .finish();

    const compressed = deflateRaw(encodedBinary);
    return this.toBase64Url(compressed);
  }

  decodeFromQrPayload(payload: string): SignalMessage {
    try {
      const compressed = this.fromBase64Url(payload);
      const decompressed = inflateRaw(compressed);
      const decoded = this.signalMessageType.decode(decompressed);

      const obj = this.signalMessageType.toObject(decoded, {
        longs: Number,
        enums: String,
        bytes: Uint8Array,
      }) as any;

      const sdp = this.reconstructSdp(obj);

      return {
        version: obj.version,
        sessionId: obj.sessionId,
        type: obj.type === 'OFFER' ? 'offer' : 'answer',
        sdp: sdp,
        createdAt: obj.createdAt,
      };
    } catch (error) {
      throw new Error(`QR-Decode failed: ${String(error)}`);
    }
  }

  private extractSdpDetails(sdp: string) {
    // Sicherere Extraktion ohne zweideutige Ternary-Syntax
    const uMatch = sdp.match(/a=ice-ufrag:(.+)/);
    const pMatch = sdp.match(/a=ice-pwd:(.+)/);
    const fMatch = sdp.match(/a=fingerprint:sha-256 (.+)/);

    const ufrag = uMatch ? uMatch[1].trim() : '';
    const pwd = pMatch ? pMatch[1].trim() : '';
    const fpHex = fMatch ? fMatch[1].trim() : '';

    let fingerprint = new Uint8Array(0);
    if (fpHex) {
      const hexParts = fpHex.replace(/:/g, '').match(/.{1,2}/g);
      if (hexParts) {
        fingerprint = new Uint8Array(hexParts.map((byte: string) => parseInt(byte, 16)));
      }
    }

    const candidates: any[] = [];
    const candidateRegex = /a=candidate:.+ (\d+\.\d+\.\d+\.\d+) (\d+) typ host/g;
    let match;
    while ((match = candidateRegex.exec(sdp)) !== null) {
      const ipBytes = new Uint8Array(match[1].split('.').map((n: string) => parseInt(n, 10)));
      candidates.push({
        ip: ipBytes,
        port: parseInt(match[2], 10),
        priority: 1,
      });
    }

    return { ufrag, pwd, fingerprint, candidates };
  }

  private reconstructSdp(obj: any): string {
    const fphex = Array.from(obj.fingerprint || [])
      .map((b: any) => b.toString(16).padStart(2, '0').toUpperCase())
      .join(':');

    const setupType = obj.type === 'OFFER' ? 'actpass' : 'active';
    const sdpSessionId =
      typeof obj.sessionId === 'string'
        ? obj.sessionId.replace(/\D/g, '').slice(0, 10) || '12345'
        : obj.sessionId;

    // Wir bauen ein SDP mit ZWEI Sektionen: Audio (Mid 0) und Video (Mid 1)
    // Das entspricht dem Standard-Verhalten von Browsern bei Audio+Video
    let sdp =
      [
        `v=0`,
        `o=- ${sdpSessionId} 2 IN IP4 127.0.0.1`,
        `s=-`,
        `t=0 0`,
        `a=msid-semantic: WMS`,
        // 1. AUDIO SEKTION
        `m=audio 9 UDP/TLS/RTP/SAVPF 111`,
        `c=IN IP4 0.0.0.0`,
        `a=rtpmap:111 opus/48000/2`,
        `a=setup:${setupType}`,
        `a=mid:0`,
        `a=fingerprint:sha-256 ${fphex}`,
        `a=ice-ufrag:${obj.ufrag}`,
        `a=ice-pwd:${obj.pwd}`,
      ].join('\r\n') + '\r\n';

    // Candidates für Audio (wird durch BUNDLE meist auch für Video genutzt)
    if (obj.candidates) {
      obj.candidates.forEach((c: any) => {
        const ip = Array.from(c.ip).join('.');
        sdp += `a=candidate:1 1 UDP 1 ${ip} ${c.port} typ host\r\n`;
      });
    }

    // 2. VIDEO SEKTION
    sdp +=
      [
        `m=video 9 UDP/TLS/RTP/SAVPF 96`,
        `c=IN IP4 0.0.0.0`,
        `a=rtpmap:96 VP8/90000`,
        `a=setup:${setupType}`,
        `a=mid:1`, // Wichtig: Eigene Media-ID
        `a=fingerprint:sha-256 ${fphex}`,
        `a=ice-ufrag:${obj.ufrag}`,
        `a=ice-pwd:${obj.pwd}`,
      ].join('\r\n') + '\r\n';

    // Candidates auch für Video hinzufügen (sicher ist sicher)
    if (obj.candidates) {
      obj.candidates.forEach((c: any) => {
        const ip = Array.from(c.ip).join('.');
        sdp += `a=candidate:1 1 UDP 1 ${ip} ${c.port} typ host\r\n`;
      });
    }

    // BUNDLE-Attribut: Sagt dem Browser, dass Audio & Video denselben Port nutzen
    sdp += `a=group:BUNDLE 0 1\r\n`;

    return sdp;
  }

  private toBase64Url(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  private fromBase64Url(base64Url: string): Uint8Array {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) base64 += '=';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
