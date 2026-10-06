// Multi-Peer WebRTC Mesh Manager (Zero-cost, 100% Client-Side P2P for 1-on-1 & Group Calls)

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10
};

export interface MultiWebRTCCallbacks {
  onRemoteStream: (userId: string, stream: MediaStream) => void;
  onRemoteStreamRemoved?: (userId: string) => void;
  onIceCandidate: (userId: string, candidate: RTCIceCandidate) => void;
  onConnectionStateChange?: (userId: string, state: RTCPeerConnectionState) => void;
}

export interface LegacyWebRTCCallbacks {
  onRemoteStream: (stream: MediaStream) => void;
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
}

class WebRTCService {
  // Map of userId -> RTCPeerConnection
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  // Map of userId -> MediaStream (remote stream from that user)
  private remoteStreams: Map<string, MediaStream> = new Map();
  // Buffered candidates per userId before remote description is set
  private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map();

  private localStream: MediaStream | null = null;
  private primaryRemoteStream: MediaStream | null = null; // for backward compatibility in 1-on-1
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private currentFacingMode: 'user' | 'environment' = 'user';
  private isScreenSharing = false;
  private originalVideoTrack: MediaStreamTrack | null = null;
  private defaultCallbacks: MultiWebRTCCallbacks | null = null;

  // Set default multi-peer event handlers
  public setCallbacks(callbacks: MultiWebRTCCallbacks) {
    this.defaultCallbacks = callbacks;
  }

  // Acquire user media (Microphone and optional Camera)
  public async startLocalStream(type: 'audio' | 'video' = 'audio', facingMode: 'user' | 'environment' = 'user'): Promise<MediaStream> {
    if (this.localStream) {
      // If already started and compatible, reuse
      const hasVideo = this.localStream.getVideoTracks().length > 0;
      if (type === 'audio' || (type === 'video' && hasVideo)) {
        return this.localStream;
      }
      // If upgrading from audio to video, stop old and request new
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }

    try {
      this.currentFacingMode = facingMode;
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: type === 'video' ? {
          facingMode: this.currentFacingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;

      // Attach tracks to all existing active PeerConnections
      this.peerConnections.forEach((pc) => {
        stream.getTracks().forEach((track) => {
          const senders = pc.getSenders();
          const exists = senders.some(s => s.track?.kind === track.kind);
          if (!exists) {
            pc.addTrack(track, stream);
          }
        });
      });

      // Initialize sound analyzer for live volume waveform
      this.setupAudioAnalyser(stream);

      return stream;
    } catch (err: any) {
      console.error('[WebRTC] getUserMedia failed:', err);
      // Fallback to audio only if video request failed (e.g. no camera attached)
      if (type === 'video') {
        console.warn('[WebRTC] Falling back to audio-only stream');
        return this.startLocalStream('audio');
      }
      throw err;
    }
  }

  // Initialize or retrieve PeerConnection for a specific target peer
  public getOrCreatePeerConnection(
    userId: string, 
    callbacks?: {
      onRemoteStream?: (userId: string, stream: MediaStream) => void;
      onIceCandidate?: (userId: string, candidate: RTCIceCandidate) => void;
      onConnectionStateChange?: (userId: string, state: RTCPeerConnectionState) => void;
    }
  ): RTCPeerConnection {
    if (this.peerConnections.has(userId)) {
      return this.peerConnections.get(userId)!;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    const remoteStream = new MediaStream();
    this.remoteStreams.set(userId, remoteStream);
    this.primaryRemoteStream = remoteStream;

    // Attach local tracks if available
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        if (callbacks?.onIceCandidate) {
          callbacks.onIceCandidate(userId, event.candidate);
        } else if (this.defaultCallbacks?.onIceCandidate) {
          this.defaultCallbacks.onIceCandidate(userId, event.candidate);
        }
      }
    };

    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track from peer ${userId}:`, event.track.kind);
      if (event.streams && event.streams[0]) {
        this.remoteStreams.set(userId, event.streams[0]);
        this.primaryRemoteStream = event.streams[0];
        if (callbacks?.onRemoteStream) {
          callbacks.onRemoteStream(userId, event.streams[0]);
        } else if (this.defaultCallbacks?.onRemoteStream) {
          this.defaultCallbacks.onRemoteStream(userId, event.streams[0]);
        }
      } else {
        const stream = this.remoteStreams.get(userId) || new MediaStream();
        stream.addTrack(event.track);
        this.remoteStreams.set(userId, stream);
        this.primaryRemoteStream = stream;
        if (callbacks?.onRemoteStream) {
          callbacks.onRemoteStream(userId, stream);
        } else if (this.defaultCallbacks?.onRemoteStream) {
          this.defaultCallbacks.onRemoteStream(userId, stream);
        }
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with peer ${userId}:`, pc.connectionState);
      if (callbacks?.onConnectionStateChange) {
        callbacks.onConnectionStateChange(userId, pc.connectionState);
      } else if (this.defaultCallbacks?.onConnectionStateChange) {
        this.defaultCallbacks.onConnectionStateChange(userId, pc.connectionState);
      }
    };

    this.peerConnections.set(userId, pc);
    return pc;
  }

  // Create SDP Offer for a specific peer
  public async createOfferForPeer(userId: string): Promise<RTCSessionDescriptionInit> {
    const pc = this.getOrCreatePeerConnection(userId);
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    await pc.setLocalDescription(offer);
    return offer;
  }

  // Create SDP Answer for a specific peer
  public async createAnswerForPeer(userId: string): Promise<RTCSessionDescriptionInit> {
    const pc = this.getOrCreatePeerConnection(userId);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }

  // Set Remote SDP Description for a specific peer
  public async setRemoteDescriptionForPeer(userId: string, description: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.getOrCreatePeerConnection(userId);
    
    // Avoid InvalidStateError if already set
    if (pc.remoteDescription && pc.remoteDescription.type === description.type) {
      return;
    }

    const rtcDesc = new RTCSessionDescription(description);
    await pc.setRemoteDescription(rtcDesc);

    // Apply buffered ICE candidates
    const buffered = this.pendingCandidates.get(userId) || [];
    while (buffered.length > 0) {
      const cand = buffered.shift();
      if (cand) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.warn(`[WebRTC] Error adding buffered candidate for peer ${userId}:`, e);
        }
      }
    }
  }

  // Add ICE Candidate for a specific peer
  public async addIceCandidateForPeer(userId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peerConnections.get(userId);
    if (!pc || !pc.remoteDescription) {
      const list = this.pendingCandidates.get(userId) || [];
      list.push(candidate);
      this.pendingCandidates.set(userId, list);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn(`[WebRTC] addIceCandidate error for peer ${userId}:`, e);
    }
  }

  // Remove a disconnected peer from the mesh
  public removePeer(userId: string): void {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      try {
        pc.close();
      } catch (e) {}
      this.peerConnections.delete(userId);
    }
    this.remoteStreams.delete(userId);
    this.pendingCandidates.delete(userId);
    if (this.defaultCallbacks?.onRemoteStreamRemoved) {
      this.defaultCallbacks.onRemoteStreamRemoved(userId);
    }
  }

  // 1-on-1 Legacy Bridge Methods for backward compatibility
  public initPeerConnection(callbacks: LegacyWebRTCCallbacks, defaultPeerId = 'primary_peer'): RTCPeerConnection {
    this.cleanUp();
    return this.getOrCreatePeerConnection(defaultPeerId, {
      onRemoteStream: (_, stream) => callbacks.onRemoteStream(stream),
      onIceCandidate: (_, candidate) => callbacks.onIceCandidate(candidate),
      onConnectionStateChange: (_, state) => callbacks.onConnectionStateChange?.(state)
    });
  }

  public async createOffer(defaultPeerId = 'primary_peer'): Promise<RTCSessionDescriptionInit> {
    return this.createOfferForPeer(defaultPeerId);
  }

  public async createAnswer(defaultPeerId = 'primary_peer'): Promise<RTCSessionDescriptionInit> {
    return this.createAnswerForPeer(defaultPeerId);
  }

  public async setRemoteDescription(description: RTCSessionDescriptionInit, defaultPeerId = 'primary_peer'): Promise<void> {
    return this.setRemoteDescriptionForPeer(defaultPeerId, description);
  }

  public async addIceCandidate(candidate: RTCIceCandidateInit, defaultPeerId = 'primary_peer'): Promise<void> {
    return this.addIceCandidateForPeer(defaultPeerId, candidate);
  }

  // Media Track Controls across all active PeerConnections
  public toggleAudio(enabled?: boolean): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = enabled !== undefined ? enabled : !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  public toggleVideo(enabled?: boolean): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = enabled !== undefined ? enabled : !videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }

  public async switchCamera(): Promise<MediaStreamTrack | null> {
    if (!this.localStream) return null;
    try {
      this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: this.currentFacingMode }
      });
      const newTrack = newStream.getVideoTracks()[0];
      const oldTrack = this.localStream.getVideoTracks()[0];

      if (oldTrack) {
        this.localStream.removeTrack(oldTrack);
        oldTrack.stop();
      }
      this.localStream.addTrack(newTrack);

      // Replace track on all PeerConnection senders
      for (const pc of this.peerConnections.values()) {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(newTrack);
        }
      }

      return newTrack;
    } catch (err) {
      console.error('[WebRTC] switchCamera error:', err);
      return null;
    }
  }

  public async startScreenShare(): Promise<MediaStreamTrack | null> {
    if (!navigator.mediaDevices.getDisplayMedia) {
      throw new Error('Screen sharing not supported on this browser');
    }
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      const screenTrack = screenStream.getVideoTracks()[0];
      this.originalVideoTrack = this.localStream?.getVideoTracks()[0] || null;

      if (this.localStream) {
        if (this.originalVideoTrack) {
          this.localStream.removeTrack(this.originalVideoTrack);
        }
        this.localStream.addTrack(screenTrack);
      }

      // Replace or add track on all PeerConnections
      for (const pc of this.peerConnections.values()) {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        } else {
          pc.addTrack(screenTrack, this.localStream!);
        }
      }

      this.isScreenSharing = true;

      screenTrack.onended = () => {
        this.stopScreenShare().catch(() => {});
      };

      return screenTrack;
    } catch (err) {
      console.error('[WebRTC] startScreenShare error:', err);
      return null;
    }
  }

  public async stopScreenShare(): Promise<void> {
    if (!this.isScreenSharing) return;
    this.isScreenSharing = false;

    if (this.originalVideoTrack && this.localStream) {
      const currentTrack = this.localStream.getVideoTracks()[0];
      if (currentTrack) {
        currentTrack.stop();
        this.localStream.removeTrack(currentTrack);
      }
      this.localStream.addTrack(this.originalVideoTrack);

      for (const pc of this.peerConnections.values()) {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(this.originalVideoTrack);
        }
      }
    }
  }

  // Live Soundwave Audio Analyser
  private setupAudioAnalyser(stream: MediaStream): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);
    } catch (e) {
      console.warn('[WebRTC] Audio analyser init warning:', e);
    }
  }

  public getAudioVolume(): number {
    if (!this.analyser) return 0;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / (dataArray.length * 255); // 0.0 to 1.0
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(userId?: string): MediaStream | null {
    if (userId && this.remoteStreams.has(userId)) {
      return this.remoteStreams.get(userId)!;
    }
    return this.primaryRemoteStream;
  }

  public getAllRemoteStreams(): Map<string, MediaStream> {
    return this.remoteStreams;
  }

  public cleanUp(): void {
    this.stopScreenShare().catch(() => {});
    this.pendingCandidates.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    this.remoteStreams.forEach((stream) => {
      stream.getTracks().forEach((t) => t.stop());
    });
    this.remoteStreams.clear();
    this.primaryRemoteStream = null;

    this.peerConnections.forEach((pc) => {
      try {
        pc.close();
      } catch (e) {}
    });
    this.peerConnections.clear();

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
      this.analyser = null;
    }
  }
}

export const webRTCService = new WebRTCService();
