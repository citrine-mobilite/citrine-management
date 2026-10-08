import { AppUser, CallType, VoIPCallParticipant } from '../../types';

export interface CallEventCallbacks {
  onConnected?: () => void;
  onEnded?: (reason: string) => void;
  onRemoteStream?: (stream: MediaStream, peerId?: string) => void;
  onParticipantJoined?: (participant: VoIPCallParticipant) => void;
  onParticipantLeft?: (participantId: string) => void;
}

export interface WebRTCCallbacks {
  onRemoteStream?: (peerId: string, stream: MediaStream) => void;
  onRemoteStreamRemoved?: (peerId: string) => void;
  onIceCandidate?: (peerId: string, candidate: RTCIceCandidate) => void;
  onConnectionStateChange?: (peerId: string, state: RTCPeerConnectionState) => void;
}
