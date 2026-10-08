import { collection, doc, setDoc, onSnapshot, Unsubscribe, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { COLLECTIONS } from '../firestoreService';
import { VoIPCallCandidate, VoIPCallSignal } from '../../types';

export async function sendCandidate(callId: string, candidate: VoIPCallCandidate): Promise<void> {
  const candidateDocRef = doc(collection(db, COLLECTIONS.CALLS, callId, 'candidates'));
  await setDoc(candidateDocRef, candidate);
}

export async function sendSignal(callId: string, signal: VoIPCallSignal): Promise<void> {
  const signalDocRef = doc(collection(db, COLLECTIONS.CALLS, callId, 'signals'));
  await setDoc(signalDocRef, signal);
}

export function listenToCandidates(
  callId: string,
  userId: string,
  onCandidate: (candidate: VoIPCallCandidate) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.CALLS, callId, 'candidates'), where('toUserId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        onCandidate(change.doc.data() as VoIPCallCandidate);
      }
    });
  });
}

export function listenToSignals(
  callId: string,
  userId: string,
  onSignal: (signal: VoIPCallSignal) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.CALLS, callId, 'signals'), where('toUserId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        onSignal(change.doc.data() as VoIPCallSignal);
      }
    });
  });
}
