import { supabase, supabaseAdmin } from '../lib/supabase';
import { VoIPCall, CallType, AppUser, VoIPCallParticipant } from '../types';
import { webRTCService } from './webRTCService';
import { soundService } from './soundService';
import { sendCandidate, listenToCandidates } from './calls/signalingSupabase';
import { CallEventCallbacks } from './calls/callTypes';

type Unsubscribe = () => void;

class CallSignalingService {
  private activeCallChannel: any = null;
  private candidatesUnsub: Unsubscribe | null = null;
  private currentCallId: string | null = null;

  /**
   * Écoute en continu les appels entrants dirigés vers l'utilisateur connecté via Supabase Realtime
   */
  public listenForIncomingCalls(
    userId: string,
    onIncomingCall: (call: VoIPCall | null) => void
  ): Unsubscribe {
    if (!userId) return () => {};

    const userChannel = supabase.channel(`incoming_calls_user_${userId}`);

    userChannel.on('broadcast', { event: 'incoming_call' }, ({ payload }) => {
      const callData = payload as VoIPCall;
      if (callData && callData.status === 'ringing') {
        const callTime = new Date(callData.createdAt).getTime();
        const now = Date.now();
        if (now - callTime < 60000) {
          soundService.playIncomingRingtone();
          onIncomingCall(callData);
        } else {
          onIncomingCall(null);
        }
      }
    });

    userChannel.on('broadcast', { event: 'call_ended' }, () => {
      soundService.stopIncomingRingtone();
      onIncomingCall(null);
    });

    userChannel.subscribe();

    return () => {
      supabase.removeChannel(userChannel);
    };
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

    // Notification broadcast temps réel à l'appelé
    const calleeChannel = supabase.channel(`incoming_calls_user_${callee.id}`);
    calleeChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        calleeChannel.send({
          type: 'broadcast',
          event: 'incoming_call',
          payload: callData,
        });
      }
    });

    // Enregistrement asynchrone non-bloquant en table Supabase calls
    supabaseAdmin.from('calls').upsert({
      doc_id: callId,
      caller_id: caller.id,
      callee_id: callee.id,
      type,
      status: 'ringing',
      raw_data: callData,
      updated_at: new Date().toISOString()
    }).then(() => {}, () => {});

    soundService.playOutgoingRingback();

    // Écoute les ICE candidates envoyés par le destinataire
    this.candidatesUnsub = listenToCandidates(callId, caller.id, (c) => webRTCService.addIceCandidate(c.fromUserId, c));

    // Canal dédié à cet appel
    const callChannel = supabase.channel(`call_room_${callId}`);
    this.activeCallChannel = callChannel;

    callChannel.on('broadcast', { event: 'call_answered' }, async ({ payload }) => {
      soundService.stopOutgoingRingback();
      if (payload?.answer) {
        try {
          await webRTCService.handleAnswer(callee.id, payload.answer as RTCSessionDescriptionInit);
          callbacks?.onConnected?.();
        } catch (err) {
          console.warn('Erreur établissement réponse WebRTC :', err);
        }
      }
    });

    callChannel.on('broadcast', { event: 'call_ended' }, ({ payload }) => {
      soundService.stopOutgoingRingback();
      callbacks?.onEnded?.(payload?.reason || "L'appel a pris fin.");
      this.cleanUp();
    });

    callChannel.subscribe();

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

      const callChannel = supabase.channel(`call_room_${call.id}`);
      this.activeCallChannel = callChannel;

      callChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          callChannel.send({
            type: 'broadcast',
            event: 'call_answered',
            payload: {
              answer: { type: 'answer', sdp: answer.sdp || '' },
              calleeId: call.calleeId,
            },
          });
        }
      });

      callChannel.on('broadcast', { event: 'call_ended' }, ({ payload }) => {
        callbacks?.onEnded?.(payload?.reason || "L'appel est terminé.");
        this.cleanUp();
      });

      supabaseAdmin.from('calls').upsert({
        doc_id: call.id,
        status: 'connected',
        started_at: new Date().toISOString(),
        raw_data: { ...call, status: 'connected', answer: { type: 'answer', sdp: answer.sdp || '' } },
        updated_at: new Date().toISOString()
      }).then(() => {}, () => {});
    }

    soundService.playCallConnected();
    this.candidatesUnsub = listenToCandidates(call.id, call.calleeId, (c) => webRTCService.addIceCandidate(c.fromUserId, c));
  }

  /**
   * Décline ou refuse un appel entrant
   */
  public async rejectCall(callId: string, reason = "Appel refusé"): Promise<void> {
    soundService.stopIncomingRingtone();
    const callChannel = supabase.channel(`call_room_${callId}`);
    callChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        callChannel.send({
          type: 'broadcast',
          event: 'call_ended',
          payload: { reason },
        });
      }
    });

    supabaseAdmin.from('calls').upsert({
      doc_id: callId,
      status: 'rejected',
      end_reason: reason,
      updated_at: new Date().toISOString()
    }).then(() => {}, () => {});

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
      const callChannel = supabase.channel(`call_room_${idToClose}`);
      callChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          callChannel.send({
            type: 'broadcast',
            event: 'call_ended',
            payload: { reason },
          });
        }
      });

      supabaseAdmin.from('calls').upsert({
        doc_id: idToClose,
        status: 'ended',
        ended_at: new Date().toISOString(),
        end_reason: reason,
        updated_at: new Date().toISOString()
      }).then(() => {}, () => {});
    }

    soundService.playCallEnded();
    webRTCService.endCall();
    this.cleanUp();
  }

  public cleanUp(): void {
    soundService.stopOutgoingRingback();
    soundService.stopIncomingRingtone();
    if (this.activeCallChannel) {
      supabase.removeChannel(this.activeCallChannel);
      this.activeCallChannel = null;
    }
    if (this.candidatesUnsub) this.candidatesUnsub();
    this.candidatesUnsub = null;
    this.currentCallId = null;
  }
}

export const callSignalingService = new CallSignalingService();
export default callSignalingService;
