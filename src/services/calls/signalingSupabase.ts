import { supabase } from '../../lib/supabase';
import { VoIPCallCandidate, VoIPCallSignal } from '../../types';

export async function sendCandidate(callId: string, candidate: VoIPCallCandidate): Promise<void> {
  const channel = supabase.channel(`call_signaling_${callId}`);
  await channel.send({
    type: 'broadcast',
    event: 'candidate',
    payload: candidate,
  });
}

export async function sendSignal(callId: string, signal: VoIPCallSignal): Promise<void> {
  const channel = supabase.channel(`call_signaling_${callId}`);
  await channel.send({
    type: 'broadcast',
    event: 'signal',
    payload: signal,
  });
}

export function listenToCandidates(
  callId: string,
  userId: string,
  onCandidate: (candidate: VoIPCallCandidate) => void
): () => void {
  const channel = supabase.channel(`call_signaling_${callId}`);
  
  channel.on('broadcast', { event: 'candidate' }, ({ payload }) => {
    if (payload && payload.toUserId === userId) {
      onCandidate(payload as VoIPCallCandidate);
    }
  }).subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function listenToSignals(
  callId: string,
  userId: string,
  onSignal: (signal: VoIPCallSignal) => void
): () => void {
  const channel = supabase.channel(`call_signaling_${callId}`);
  
  channel.on('broadcast', { event: 'signal' }, ({ payload }) => {
    if (payload && payload.toUserId === userId) {
      onSignal(payload as VoIPCallSignal);
    }
  }).subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
