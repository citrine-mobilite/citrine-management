import { supabase, supabaseAdmin } from '../lib/supabase';
import { VoIPCall, CallType, AppUser } from '../types';
import { webRTCService } from './webRTCService';
import { soundService } from './soundService';
import { listenToCandidates } from './calls/signalingSupabase';
import { CallEventCallbacks } from './calls/callTypes';
import {
  broadcastCallRoomEvent,
  buildOutgoingCallPayload,
  setupCallWebRtcCallbacks,
} from './calls/callChannelHelpers';

type Unsubscribe = () => void;

class CallSignalingService {
  private activeCallChannel: any = null;
  private candidatesUnsub: Unsubscribe | null = null;
  private currentCallId: string | null = null;

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
        if (Date.now() - callTime < 60000) {
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

    await webRTCService.startLocalStream(type);
    setupCallWebRtcCallbacks({ callId, localUserId: caller.id, stopRingbackOnConnect: true, callbacks });

    const offer = await webRTCService.createOffer(callee.id);
    const callData = buildOutgoingCallPayload({ callId, caller, callee, type, offerSdp: offer.sdp });

    const calleeChannel = supabase.channel(`incoming_calls_user_${callee.id}`);
    calleeChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        calleeChannel.send({ type: 'broadcast', event: 'incoming_call', payload: callData });
      }
    });

    supabaseAdmin
      .from('calls')
      .insert({
        room_id: callId,
        caller_id: caller.id,
        recipient_id: callee.id,
        call_type: type,
        status: 'ringing',
        raw_data: callData,
        updated_at: new Date().toISOString(),
      })
      .then(() => {}, () => {});

    soundService.playOutgoingRingback();
    this.candidatesUnsub = listenToCandidates(callId, caller.id, (c) => webRTCService.addIceCandidate(c.fromUserId, c));

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

  public async answerCall(call: VoIPCall, callbacks?: CallEventCallbacks): Promise<void> {
    this.cleanUp();
    this.currentCallId = call.id;
    soundService.stopIncomingRingtone();

    await webRTCService.startLocalStream(call.type);
    setupCallWebRtcCallbacks({ callId: call.id, localUserId: call.calleeId, callbacks });

    if (call.offer) {
      const answer = await webRTCService.handleOffer(call.callerId, call.offer as RTCSessionDescriptionInit);
      const callChannel = supabase.channel(`call_room_${call.id}`);
      this.activeCallChannel = callChannel;

      callChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          callChannel.send({
            type: 'broadcast',
            event: 'call_answered',
            payload: { answer: { type: 'answer', sdp: answer.sdp || '' }, calleeId: call.calleeId },
          });
        }
      });

      callChannel.on('broadcast', { event: 'call_ended' }, ({ payload }) => {
        callbacks?.onEnded?.(payload?.reason || "L'appel est terminé.");
        this.cleanUp();
      });

      supabaseAdmin
        .from('calls')
        .update({
          status: 'connected',
          raw_data: { ...call, status: 'connected', answer: { type: 'answer', sdp: answer.sdp || '' } },
          updated_at: new Date().toISOString(),
        })
        .eq('room_id', call.id)
        .then(() => {}, () => {});
    }

    soundService.playCallConnected();
    this.candidatesUnsub = listenToCandidates(call.id, call.calleeId, (c) => webRTCService.addIceCandidate(c.fromUserId, c));
  }

  public async rejectCall(callId: string, reason = 'Appel refusé'): Promise<void> {
    soundService.stopIncomingRingtone();
    broadcastCallRoomEvent(callId, 'call_ended', { reason });
    supabaseAdmin
      .from('calls')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('room_id', callId)
      .then(() => {}, () => {});
    this.cleanUp();
  }

  public async endCall(callId?: string, reason = 'Terminé'): Promise<void> {
    const idToClose = callId || this.currentCallId;
    soundService.stopOutgoingRingback();
    soundService.stopIncomingRingtone();

    if (idToClose) {
      broadcastCallRoomEvent(idToClose, 'call_ended', { reason });
      supabaseAdmin
        .from('calls')
        .update({ status: 'ended', updated_at: new Date().toISOString() })
        .eq('room_id', idToClose)
        .then(() => {}, () => {});
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
