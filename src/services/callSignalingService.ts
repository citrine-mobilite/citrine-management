import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  Unsubscribe, 
  collection, 
  query, 
  where 
} from 'firebase/firestore';
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

  /**
   * Écoute en continu les appels entrants dirigés vers l'utilisateur connecté
   */
  public listenForIncomingCalls(
    userId: string,
    onIncomingCall: (call: VoIPCall | null) => void
  ): Unsubscribe {
    if (!userId) return () => {};

    const callsCol = collection(db, COLLECTIONS.CALLS);
    const q = query(
      callsCol,
      where('calleeId', '==', userId),
      where('status', '==', 'ringing')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        soundService.stopIncomingRingtone();
        onIncomingCall(null);
        return;
      }

      // Prend le premier appel en sonnerie active
      const docChange = snapshot.docs[0];
      const callData = { id: docChange.id, ...docChange.data() } as VoIPCall;

      // Vérifie que l'appel est récent (moins de 60 secondes)
      const callTime = new Date(callData.createdAt).getTime();
      const now = Date.now();
      if (now - callTime < 60000) {
        soundService.playIncomingRingtone();
        onIncomingCall(callData);
      } else {
        onIncomingCall(null);
      }
    }, (error) => {
      console.warn("Écoute des appels entrants différée :", error);
    });

    return unsubscribe;
  }

  /**
   * Lance un appel sortant audio ou vidéo
   */
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

    // Démarre le flux audio / vidéo local
    await webRTCService.startLocalStream(type);

    webRTCService.setCallbacks({
      onRemoteStream: (peerId, stream) => callbacks?.onRemoteStream?.(stream, peerId),
      onIceCandidate: async (peerId, candidate) => {
        try {
          await sendCandidate(callId, {
            fromUserId: caller.id,
            toUserId: peerId,
            candidate: candidate.candidate,
            sdpMid: candidate.sdpMid,
            sdpMLineIndex: candidate.sdpMLineIndex,
            timestamp: Date.now(),
          });
        } catch {}
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

    // Écoute les ICE candidates envoyés par le destinataire
    this.candidatesUnsub = listenToCandidates(callId, caller.id, (c) => webRTCService.addIceCandidate(c.fromUserId, c));

    // Écoute l'état du document d'appel en temps réel (réponse ou fin d'appel)
    this.activeCallUnsub = onSnapshot(callDocRef, async (snap) => {
      const data = snap.data() as VoIPCall | undefined;
      if (!data) return;

      // Quand l'appelé décroche et envoie sa réponse SDP
      if (data.status === 'connected' && data.answer) {
        soundService.stopOutgoingRingback();
        try {
          await webRTCService.handleAnswer(callee.id, data.answer as RTCSessionDescriptionInit);
          callbacks?.onConnected?.();
        } catch (err) {
          console.warn("Erreur établissement réponse WebRTC :", err);
        }
      }

      // Quand l'appel est terminé ou rejeté
      if (data.status === 'ended' || data.status === 'rejected' || data.status === 'missed') {
        soundService.stopOutgoingRingback();
        callbacks?.onEnded?.(data.endReason || "L'appel a pris fin.");
        this.cleanUp();
      }
    });

    return callData;
  }

  /**
   * Répond à un appel entrant
   */
  public async answerCall(call: VoIPCall, callbacks?: CallEventCallbacks): Promise<void> {
    this.cleanUp();
    this.currentCallId = call.id;
    soundService.stopIncomingRingtone();

    await webRTCService.startLocalStream(call.type);

    webRTCService.setCallbacks({
      onRemoteStream: (peerId, stream) => callbacks?.onRemoteStream?.(stream, peerId),
      onIceCandidate: async (peerId, candidate) => {
        try {
          await sendCandidate(call.id, {
            fromUserId: call.calleeId,
            toUserId: peerId,
            candidate: candidate.candidate,
            sdpMid: candidate.sdpMid,
            sdpMLineIndex: candidate.sdpMLineIndex,
            timestamp: Date.now(),
          });
        } catch {}
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
      
      const updatedParticipants: VoIPCallParticipant[] = (call.participants || []).map((p) => {
        if (p.id === call.calleeId) {
          return { ...p, status: 'joined', joinedAt: new Date().toISOString() };
        }
        return p;
      });

      await updateDoc(callDocRef, {
        status: 'connected',
        startedAt: new Date().toISOString(),
        answer: { type: 'answer', sdp: answer.sdp || '' },
        participants: updatedParticipants
      });
    }

    soundService.playCallConnected();
    this.candidatesUnsub = listenToCandidates(call.id, call.calleeId, (c) => webRTCService.addIceCandidate(c.fromUserId, c));

    // Écoute de la fin d'appel
    const callDocRef = doc(db, COLLECTIONS.CALLS, call.id);
    this.activeCallUnsub = onSnapshot(callDocRef, (snap) => {
      const data = snap.data() as VoIPCall | undefined;
      if (!data) return;
      if (data.status === 'ended' || data.status === 'rejected') {
        callbacks?.onEnded?.(data.endReason || "L'appel est terminé.");
        this.cleanUp();
      }
    });
  }

  /**
   * Décline ou refuse un appel entrant
   */
  public async rejectCall(callId: string, reason = "Appel refusé"): Promise<void> {
    soundService.stopIncomingRingtone();
    try {
      const callDocRef = doc(db, COLLECTIONS.CALLS, callId);
      await updateDoc(callDocRef, {
        status: 'rejected',
        endedAt: new Date().toISOString(),
        endReason: reason,
      });
    } catch {}
    this.cleanUp();
  }

  /**
   * Met fin à l'appel en cours
   */
  public async endCall(callId?: string, reason = 'Terminé'): Promise<void> {
    const idToClose = callId || this.currentCallId;
    soundService.stopOutgoingRingback();
    soundService.stopIncomingRingtone();

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
    soundService.stopOutgoingRingback();
    soundService.stopIncomingRingtone();
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
