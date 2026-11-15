import { supabase } from '../../lib/supabase';
import { AppUser, CallType, VoIPCall } from '../../types';
import { webRTCService } from '../webRTCService';
import { soundService } from '../soundService';
import { sendCandidate } from './signalingSupabase';
import { CallEventCallbacks } from './callTypes';

export function setupCallWebRtcCallbacks(params: {
  callId: string;
  localUserId: string;
  stopRingbackOnConnect?: boolean;
  callbacks?: CallEventCallbacks;
}): void {
  const { callId, localUserId, stopRingbackOnConnect, callbacks } = params;
  webRTCService.setCallbacks({
    onRemoteStream: (peerId, stream) => callbacks?.onRemoteStream?.(stream, peerId),
    onIceCandidate: async (peerId, candidate) => {
      try {
        await sendCandidate(callId, {
          fromUserId: localUserId,
          toUserId: peerId,
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
          timestamp: Date.now(),
        });
      } catch {}
    },
    onConnectionStateChange: (_peerId, state) => {
      if (state === 'connected') {
        if (stopRingbackOnConnect) soundService.stopOutgoingRingback();
        callbacks?.onConnected?.();
      }
    },
  });
}

export function buildOutgoingCallPayload(params: {
  callId: string;
  caller: AppUser;
  callee: { id: string; name: string; email?: string; avatarUrl?: string; role?: string };
  type: CallType;
  offerSdp?: string;
}): VoIPCall {
  const { callId, caller, callee, type, offerSdp } = params;
  return {
    id: callId,
    callerId: caller.id,
    callerName: caller.name,
    callerEmail: caller.email,
    callerAvatar: caller.avatarUrl || '',
    callerRole: caller.role || 'Employé',
    calleeId: callee.id,
    calleeName: callee.name,
    calleeEmail: callee.email || '',
    calleeAvatar: callee.avatarUrl || '',
    calleeRole: callee.role || 'Employé',
    participants: [
      { id: caller.id, name: caller.name, role: caller.role, status: 'joined', joinedAt: new Date().toISOString() },
      { id: callee.id, name: callee.name, role: callee.role, status: 'ringing' },
    ],
    type,
    status: 'ringing',
    createdAt: new Date().toISOString(),
    offer: { type: 'offer', sdp: offerSdp || '' },
  };
}

export function broadcastCallRoomEvent(callId: string, event: string, payload: Record<string, any>): void {
  const channel = supabase.channel(`call_room_${callId}`);
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      channel.send({ type: 'broadcast', event, payload });
    }
  });
}
