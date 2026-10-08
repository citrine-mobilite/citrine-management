import { doc, setDoc, getDoc, updateDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS } from './firestoreService';
import { VoIPCall, CallType, AppUser, VoIPCallParticipant } from '../types';
import { webRTCService } from './webRTCService';
import { soundService } from './soundService';
import { sendCandidate, sendSignal, listenToCandidates, listenToSignals } from './calls/signalingFirestore';
import { CallEventCallbacks } from './calls/callTypes';

class CallSignalingService {
  private activeCallUnsub: Unsubscribe | null = null;
  private candidatesUnsub: Unsubscribe | null = null;
  private signalsUnsub: Unsubscribe | null = null;
  private currentCallId: string | null = null;

  public async initiateCall(params: {
    caller: AppUser;
    callee: { id: string; name: string; email?: string; avatarUrl?: string; role?: string };
    type: CallType;
    callbacks?: CallEventCallbacks;
  }): Promise<VoIPCall> {
    const { caller, callee, type, callbacks } = params;
    this.cleanUp();

    const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.currentCallId = callId;
    const callDocRef = doc(db, COLLECTIONS.CALLS, callId);

    await webRTCService.startLocalStream(type);

    webRTCService.setCallbacks({
      onRemoteStream: (peerId, stream) => callbacks?.onRemoteStream?.(stream, peerId),
      onIceCandidate: async (peerId, candidate) => {
        await sendCandidate(callId, {
          fromUserId: caller.id,
          toUserId: peerId,
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
          timestamp: Date.now(),
        });
      },
      onConnectionStateChange: (peerId, state) => {
        if (state === 'connected') {
          soundService.stopOutgoingRingback();
          callbacks?.onConnected?.();
        }
      },
    });

    const offer = await webRTCService.createOffer(callee.id);

    const callData: VoIPCall = {
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
      offer: { type: 'offer', sdp: offer.sdp || '' },
    };

    await setDoc(callDocRef, callData);
    soundService.playOutgoingRingback();

    this.candidatesUnsub = listenToCandidates(callId, caller.id, (c) => webRTCService.addIceCandidate(c.fromUserId, c));

    return callData;
  }

  public async answerCall(call: VoIPCall, callbacks?: CallEventCallbacks): Promise<void> {
    this.cleanUp();
    this.currentCallId = call.id;
    soundService.stopIncomingRingtone();

    await webRTCService.startLocalStream(call.type);

    webRTCService.setCallbacks({
      onRemoteStream: (peerId, stream) => callbacks?.onRemoteStream?.(stream, peerId),
      onIceCandidate: async (peerId, candidate) => {
        await sendCandidate(call.id, {
          fromUserId: call.calleeId,
          toUserId: peerId,
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
          timestamp: Date.now(),
        });
      },
      onConnectionStateChange: (peerId, state) => {
        if (state === 'connected') {
          callbacks?.onConnected?.();
        }
      },
    });

    if (call.offer) {
      const answer = await webRTCService.handleOffer(call.callerId, call.offer as RTCSessionDescriptionInit);
      const callDocRef = doc(db, COLLECTIONS.CALLS, call.id);
      await updateDoc(callDocRef, {
        status: 'connected',
        startedAt: new Date().toISOString(),
        answer: { type: 'answer', sdp: answer.sdp || '' },
      });
    }

    soundService.playCallConnected();
    this.candidatesUnsub = listenToCandidates(call.id, call.calleeId, (c) => webRTCService.addIceCandidate(c.fromUserId, c));
  }

  public async endCall(callId?: string, reason = 'Terminé'): Promise<void> {
    const idToClose = callId || this.currentCallId;
    if (idToClose) {
      try {
        const callDocRef = doc(db, COLLECTIONS.CALLS, idToClose);
        await updateDoc(callDocRef, {
          status: 'ended',
          endedAt: new Date().toISOString(),
          endReason: reason,
        });
      } catch {}
    }
    soundService.playCallEnded();
    webRTCService.endCall();
    this.cleanUp();
  }

  public cleanUp(): void {
    if (this.activeCallUnsub) this.activeCallUnsub();
    if (this.candidatesUnsub) this.candidatesUnsub();
    if (this.signalsUnsub) this.signalsUnsub();
    this.activeCallUnsub = null;
    this.candidatesUnsub = null;
    this.signalsUnsub = null;
    this.currentCallId = null;
  }
}

export const callSignalingService = new CallSignalingService();
export default callSignalingService;
