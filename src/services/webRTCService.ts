import { PeerMeshManager } from './calls/peerMeshManager';
import { StreamAudioAnalyser } from './calls/audioAnalyser';
import { WebRTCCallbacks } from './calls/callTypes';

class WebRTCService {
  private meshManager = new PeerMeshManager();
  private analyser = new StreamAudioAnalyser();
  private localStream: MediaStream | null = null;
  private callbacks: WebRTCCallbacks | null = null;

  public setCallbacks(callbacks: WebRTCCallbacks) {
    this.callbacks = callbacks;
  }

  public async startLocalStream(type: 'audio' | 'video' = 'audio'): Promise<MediaStream> {
    if (this.localStream) {
      return this.localStream;
    }

    const constraints: MediaStreamConstraints = {
      audio: { echoCancellation: true, noiseSuppression: true },
      video: type === 'video' ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
    };

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.analyser.setup(this.localStream);
      return this.localStream;
    } catch {
      if (type === 'video') {
        return this.startLocalStream('audio');
      }
      throw new Error('Impossible d\'accéder aux périphériques média');
    }
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    const pc = this.meshManager.getOrCreatePeerConnection(peerId, this.localStream, this.callbacks || {});
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  }

  public async handleOffer(peerId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const pc = this.meshManager.getOrCreatePeerConnection(peerId, this.localStream, this.callbacks || {});
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    await this.meshManager.processPendingCandidates(peerId);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }

  public async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.meshManager.getPeer(peerId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      await this.meshManager.processPendingCandidates(peerId);
    }
  }

  public async addIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    await this.meshManager.addIceCandidate(peerId, candidate);
  }

  public getAudioLevel(): number {
    return this.analyser.getAudioLevel();
  }

  public toggleMute(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => (track.enabled = !muted));
    }
  }

  public toggleVideo(videoOff: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => (track.enabled = !videoOff));
    }
  }

  public endCall(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    this.analyser.cleanup();
    this.meshManager.closeAll();
  }
}

export const webRTCService = new WebRTCService();
export default webRTCService;
