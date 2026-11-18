import { VoIPCallCandidate, VoIPCallSignal } from '../../types';
import { getApiToken } from '../sessionService';

async function postSignal(callId: string, toUserId: string, eventType: string, payload: any): Promise<void> {
  const token = getApiToken();
  if (!token) throw new Error('Session expirée.');
  const response = await fetch('/api/calls/' + encodeURIComponent(callId) + '/signals', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ toUserId, eventType, payload }),
  });
  if (!response.ok) throw new Error('Transmission du signal d’appel impossible.');
}

export async function sendCandidate(callId: string, candidate: VoIPCallCandidate): Promise<void> {
  return postSignal(callId, candidate.toUserId, 'candidate', candidate);
}
export async function sendSignal(callId: string, signal: VoIPCallSignal): Promise<void> {
  const value: any = signal;
  return postSignal(callId, String(value.toUserId || ''), String(value.eventType || 'signal'), value);
}

function listen(callId: string, userId: string, eventType: string, callback: (payload: any) => void): () => void {
  const token = getApiToken();
  if (!token) return () => {};
  let active = true, busy = false, lastId = 0;
  const poll = async () => {
    if (!active || busy) return;
    busy = true;
    try {
      const response = await fetch('/api/calls/' + encodeURIComponent(callId) + '/signals?after=' + lastId, {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!response.ok) return;
      const result = await response.json();
      for (const row of result.signals || []) {
        lastId = Math.max(lastId, Number(row.id || 0));
        if (row.event_type === eventType || (eventType === 'signal' && row.event_type === 'call_ended')) {
          callback({ ...row.payload, event: row.event_type });
        }
      }
    } catch {} finally { busy = false; }
  };
  void poll();
  const timer = window.setInterval(poll, 1200);
  return () => { active = false; window.clearInterval(timer); };
}

export function listenToCandidates(callId: string, userId: string, onCandidate: (candidate: VoIPCallCandidate) => void): () => void {
  return listen(callId, userId, 'candidate', payload => {
    if (payload && payload.toUserId === userId) onCandidate(payload as VoIPCallCandidate);
  });
}
export function listenToSignals(callId: string, userId: string, onSignal: (signal: VoIPCallSignal) => void): () => void {
  return listen(callId, userId, 'signal', payload => {
    if (payload && payload.toUserId === userId) onSignal(payload as VoIPCallSignal);
  });
}
export async function sendCallEvent(callId: string, eventType: string, payload: any): Promise<void> {
  return postSignal(callId, '*', eventType, payload);
}
