import { Injectable } from '@angular/core';
import { deflateRaw, inflateRaw } from 'pako';
import * as protobuf from 'protobufjs';

export type SignalType = 'offer' | 'answer';

export interface SignalMessage {
  version: number;
  sessionId: string;
  type: SignalType;
  sdp: string;
  createdAt: number; // Unix ms
}

const SIGNAL_PROTO = `
syntax = "proto3";
package webrtc;

enum MessageType {
  OFFER = 0;
  ANSWER = 1;
}

message SignalMessage {
  uint32 version = 1;
  string sessionId = 2;
  MessageType type = 3;
  string sdp = 4;
  int64 createdAt = 5;
}
`;

@Injectable({
  providedIn: 'root',
})
export class SignalingCodec {
  private readonly root = protobuf.parse(SIGNAL_PROTO).root;
  private readonly signalMessageType = this.root.lookupType('webrtc.SignalMessage');

  encodeToQrPayload(message: SignalMessage): string {
    const protoObject = {
      version: message.version,
      sessionId: message.sessionId,
      type: message.type === 'offer' ? 0 : 1,
      sdp: message.sdp,
      createdAt: message.createdAt,
    };

    const verifyError = this.signalMessageType.verify(protoObject);
    if (verifyError) {
      throw new Error(`SignalMessage validation failed: ${verifyError}`);
    }

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
        defaults: true,
      }) as {
        version: number;
        sessionId: string;
        type: 'OFFER' | 'ANSWER';
        sdp: string;
        createdAt: number;
      };

      return {
        version: obj.version,
        sessionId: obj.sessionId,
        type: obj.type === 'OFFER' ? 'offer' : 'answer',
        sdp: obj.sdp,
        createdAt: obj.createdAt,
      };
    } catch (error) {
      throw new Error(`Invalid QR signaling payload: ${String(error)}`);
    }
  }

  private toBase64Url(bytes: Uint8Array): string {
    let binary = '';
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }

    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  private fromBase64Url(base64Url: string): Uint8Array {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    while (base64.length % 4 !== 0) {
      base64 += '=';
    }

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  }
}
