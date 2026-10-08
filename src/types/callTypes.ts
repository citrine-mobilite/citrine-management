export type CallType = 'audio' | 'video';

export type CallStatus = 'ringing' | 'connected' | 'rejected' | 'ended' | 'missed' | 'busy';

export interface VoIPCallCandidate {
  fromUserId?: string;
  toUserId?: string;
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
  timestamp: number;
}

export interface VoIPCallSignal {
  id?: string;
  fromUserId: string;
  fromUserName?: string;
  toUserId: string;
  type: 'offer' | 'answer';
  sdp: string;
  timestamp: number;
}

export interface VoIPCallParticipant {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
  status: 'joined' | 'ringing' | 'rejected' | 'left';
  joinedAt?: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

export interface VoIPCall {
  id: string;
  callerId: string;
  callerName: string;
  callerEmail?: string;
  callerAvatar?: string;
  callerRole?: string;
  calleeId: string;
  calleeName: string;
  calleeEmail?: string;
  calleeAvatar?: string;
  calleeRole?: string;
  invitedBy?: string;
  isGroupCall?: boolean;
  participants?: VoIPCallParticipant[];
  type: CallType;
  status: CallStatus;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  offer?: {
    type: 'offer';
    sdp: string;
  };
  answer?: {
    type: 'answer';
    sdp: string;
  };
  callerCandidates?: VoIPCallCandidate[];
  calleeCandidates?: VoIPCallCandidate[];
  isScreenSharing?: boolean;
}

export interface UserOnlinePresence {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  avatarUrl?: string;
  role: string;
  status: 'online' | 'in_call' | 'away' | 'offline';
  lastSeen: string;
  currentCallId?: string;
  device?: string;
}
