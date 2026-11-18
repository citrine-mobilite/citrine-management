import { VoIPCall, CallType, AppUser } from '../types';
import { webRTCService } from './webRTCService';
import { soundService } from './soundService';
import { listenToCandidates, listenToSignals, sendSignal } from './calls/signalingMariaDb';
import { CallEventCallbacks } from './calls/callTypes';
import { broadcastCallRoomEvent, buildOutgoingCallPayload, setupCallWebRtcCallbacks } from './calls/callChannelHelpers';
import { getApiToken } from './sessionService';

type Unsubscribe = () => void;

async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getApiToken();
  if (!token) throw new Error('Session expirée. Veuillez vous reconnecter.');
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token, ...(init.headers || {}) },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) throw new Error(result.error || 'Service d’appel indisponible.');
  return result;
}

class CallSignalingService {
  private signalUnsubs: Unsubscribe[] = [];
  private currentCallId: string | null = null;

  public listenForIncomingCalls(_userId: string, onIncomingCall: (call: VoIPCall | null) => void): Unsubscribe {
    let active = true, busy = false;
    let lastCallId: string | null = null;
    const poll = async () => {
      if (!active || busy) return;
      busy = true;
      try {
        const result = await apiFetch('/api/calls/incoming');
        const call = (result.calls || []).find((item: VoIPCall) =>
          item.status === 'ringing' && Date.now() - new Date(item.createdAt).getTime() < 60000
        ) as VoIPCall | undefined;
        if (call && call.id !== lastCallId) {
          lastCallId = call.id;
          soundService.playIncomingRingtone();
          onIncomingCall(call);
        } else if (!call && lastCallId) {
          lastCallId = null;
          soundService.stopIncomingRingtone();
          onIncomingCall(null);
        }
      } catch (error) {
        console.warn('[Call incoming poll]', error);
      } finally { busy = false; }
    };
    void poll();
    const timer = window.setInterval(poll, 2000);
    return () => { active = false; window.clearInterval(timer); soundService.stopIncomingRingtone(); };
  }

  public async initiateCall(params: {
    caller: AppUser;
    callee: { id: string; name: string; email?: string; avatarUrl?: string; role?: string };
    type: CallType;
    callbacks?: CallEventCallbacks;
  }): Promise<VoIPCall> {
    const { caller, callee, type, callbacks } = params;
    this.cleanUp();
    const callId = 'call_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    this.currentCallId = callId;
    try {
      await webRTCService.startLocalStream(type);
      setupCallWebRtcCallbacks({ callId, localUserId: caller.id, stopRingbackOnConnect: true, callbacks });
      const offer = await webRTCService.createOffer(callee.id);
      const callData = buildOutgoingCallPayload({ callId, caller, callee, type, offerSdp: offer.sdp });
      const created = await apiFetch('/api/calls', {
        method: 'POST', body: JSON.stringify({ receiverId: callee.id, call: callData }),
      });
      soundService.playOutgoingRingback();
      this.signalUnsubs.push(listenToCandidates(callId, caller.id, candidate => {
        void webRTCService.addIceCandidate(candidate.fromUserId, candidate);
      }));
      this.signalUnsubs.push(listenToSignals(callId, caller.id, async signal => {
        const event = (signal as any).event;
        if (event === 'call_answered' && (signal as any).answer) {
          soundService.stopOutgoingRingback();
          try {
            await webRTCService.handleAnswer(callee.id, (signal as any).answer as RTCSessionDescriptionInit);
            callbacks?.onConnected?.();
          } catch (error) { console.warn('[Call answer]', error); }
        } else if (event === 'call_ended') {
          soundService.stopOutgoingRingback();
          callbacks?.onEnded?.((signal as any).reason || "L'appel a pris fin.");
          this.cleanUp();
        }
      }));
      return (created.call || callData) as VoIPCall;
    } catch (error) {
      this.cleanUp();
      throw error;
    }
  }

  public async answerCall(call: VoIPCall, callbacks?: CallEventCallbacks): Promise<void> {
    this.cleanUp();
    this.currentCallId = call.id;
    soundService.stopIncomingRingtone();
    await webRTCService.startLocalStream(call.type);
    setupCallWebRtcCallbacks({ callId: call.id, localUserId: call.calleeId, callbacks });
    if (call.offer) {
      const answer = await webRTCService.handleOffer(call.callerId, call.offer as RTCSessionDescriptionInit);
      await sendSignal(call.id, {
        fromUserId: call.calleeId, toUserId: call.callerId,
        event: 'call_answered', answer: { type: 'answer', sdp: answer.sdp || '' },
      } as any);
      await apiFetch('/api/calls/' + encodeURIComponent(call.id) + '/status', {
        method: 'POST', body: JSON.stringify({ status: 'connected' }),
      });
    }
    this.signalUnsubs.push(listenToCandidates(call.id, call.calleeId, candidate => {
      void webRTCService.addIceCandidate(candidate.fromUserId, candidate);
    }));
    this.signalUnsubs.push(listenToSignals(call.id, call.calleeId, signal => {
      if ((signal as any).event === 'call_ended') {
        callbacks?.onEnded?.((signal as any).reason || "L'appel est terminé.");
        this.cleanUp();
      }
    }));
    soundService.playCallConnected();
  }

  public async rejectCall(callId: string, reason = 'Appel refusé'): Promise<void> {
    soundService.stopIncomingRingtone();
    await broadcastCallRoomEvent(callId, 'call_ended', { reason });
    await apiFetch('/api/calls/' + encodeURIComponent(callId) + '/status', {
      method: 'POST', body: JSON.stringify({ status: 'rejected' }),
    }).catch(() => {});
    this.cleanUp();
  }

  public async endCall(callId?: string, reason = 'Terminé'): Promise<void> {
    const id = callId || this.currentCallId;
    soundService.stopOutgoingRingback();
    soundService.stopIncomingRingtone();
    if (id) {
      await broadcastCallRoomEvent(id, 'call_ended', { reason });
      await apiFetch('/api/calls/' + encodeURIComponent(id) + '/status', {
        method: 'POST', body: JSON.stringify({ status: 'ended' }),
      }).catch(() => {});
    }
    soundService.playCallEnded();
    webRTCService.endCall();
    this.cleanUp();
  }

  public cleanUp(): void {
    soundService.stopOutgoingRingback();
    soundService.stopIncomingRingtone();
    for (const unsubscribe of this.signalUnsubs) unsubscribe();
    this.signalUnsubs = [];
    this.currentCallId = null;
  }
}

export const callSignalingService = new CallSignalingService();
export default callSignalingService;
