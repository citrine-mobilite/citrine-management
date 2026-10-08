import { ICE_SERVERS } from './iceConfig';
import { WebRTCCallbacks } from './callTypes';

export class PeerMeshManager {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map();

  public getOrCreatePeerConnection(
    peerId: string,
    localStream: MediaStream | null,
    callbacks: WebRTCCallbacks
  ): RTCPeerConnection {
    if (this.peerConnections.has(peerId)) {
      return this.peerConnections.get(peerId)!;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && callbacks.onIceCandidate) {
        callbacks.onIceCandidate(peerId, event.candidate);
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      this.remoteStreams.set(peerId, stream);
      if (callbacks.onRemoteStream) {
        callbacks.onRemoteStream(peerId, stream);
      }
    };

    pc.onconnectionstatechange = () => {
      if (callbacks.onConnectionStateChange) {
        callbacks.onConnectionStateChange(peerId, pc.connectionState);
      }
    };

    this.peerConnections.set(peerId, pc);
    return pc;
  }

  public async addIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peerConnections.get(peerId);
    if (pc && pc.remoteDescription) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      const existing = this.pendingCandidates.get(peerId) || [];
      existing.push(candidate);
      this.pendingCandidates.set(peerId, existing);
    }
  }

  public async processPendingCandidates(peerId: string): Promise<void> {
    const pc = this.peerConnections.get(peerId);
    if (!pc || !pc.remoteDescription) return;

    const pending = this.pendingCandidates.get(peerId) || [];
    for (const c of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch (e) {
        console.warn('Failed adding buffered candidate:', e);
      }
    }
    this.pendingCandidates.delete(peerId);
  }

  public closePeer(peerId: string): void {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
    this.remoteStreams.delete(peerId);
    this.pendingCandidates.delete(peerId);
  }

  public closeAll(): void {
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.remoteStreams.clear();
    this.pendingCandidates.clear();
  }

  public getPeer(peerId: string): RTCPeerConnection | undefined {
    return this.peerConnections.get(peerId);
  }

  public getRemoteStream(peerId: string): MediaStream | undefined {
    return this.remoteStreams.get(peerId);
  }
}
