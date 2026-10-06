// Firestore Signaling & Presence Service for Multi-Peer WebRTC VoIP Calls

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  limit, 
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS } from './firestoreService';
import { 
  VoIPCall, 
  CallType, 
  VoIPCallCandidate, 
  VoIPCallSignal, 
  VoIPCallParticipant, 
  UserOnlinePresence, 
  AppUser 
} from '../types';
import { webRTCService } from './webRTCService';
import { soundService } from './soundService';

export interface CallEventCallbacks {
  onConnected?: () => void;
  onEnded?: (reason: string) => void;
  onRemoteStream?: (stream: MediaStream, peerId?: string) => void;
  onParticipantJoined?: (participant: VoIPCallParticipant) => void;
  onParticipantLeft?: (participantId: string) => void;
}

class CallSignalingService {
  private activeCallUnsub: Unsubscribe | null = null;
  private signalsUnsub: Unsubscribe | null = null;
  private candidatesUnsub: Unsubscribe | null = null;
  private ringTimeout: any = null;
  private currentCallId: string | null = null;
  private currentUserId: string | null = null;

  // 1. Initiate an Outgoing Call (1-to-1 initially, expandable to group conference)
  public async initiateCall(params: {
    caller: AppUser;
    callee: { id: string; name: string; email?: string; avatarUrl?: string; role?: string };
    type: CallType;
    onConnected?: () => void;
    onEnded?: (reason: string) => void;
    onRemoteStream?: (stream: MediaStream) => void;
  }): Promise<VoIPCall> {
    const { caller, callee, type, onConnected, onEnded, onRemoteStream } = params;

    this.cleanUp();

    const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.currentCallId = callId;
    this.currentUserId = caller.id;
    const callDocRef = doc(db, COLLECTIONS.CALLS, callId);

    // 1. Grab local media stream
    await webRTCService.startLocalStream(type);

    // 2. Setup multi-peer webRTC callbacks
    webRTCService.setCallbacks({
      onRemoteStream: (peerId, stream) => {
        if (onRemoteStream) onRemoteStream(stream);
      },
      onRemoteStreamRemoved: (peerId) => {
        console.log(`[WebRTC] Remote stream removed for peer: ${peerId}`);
      },
      onIceCandidate: async (peerId, candidate) => {
        await this.sendCandidate(callId, {
          fromUserId: caller.id,
          toUserId: peerId,
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
          timestamp: Date.now()
        });
      },
      onConnectionStateChange: (peerId, state) => {
        console.log(`[WebRTC] Connection with ${peerId}: ${state}`);
        if (state === 'connected') {
          soundService.stopAll();
          if (onConnected) onConnected();
        }
      }
    });

    // 3. Create initial SDP Offer for primary callee
    const offer = await webRTCService.createOfferForPeer(callee.id);

    // 4. Build Initial Call Structure with Participants
    const initialParticipants: VoIPCallParticipant[] = [
      {
        id: caller.id,
        name: caller.name,
        email: caller.email,
        avatarUrl: caller.avatarUrl || '',
        role: caller.role || 'Employé',
        status: 'joined',
        joinedAt: new Date().toISOString()
      },
      {
        id: callee.id,
        name: callee.name,
        email: callee.email || '',
        avatarUrl: callee.avatarUrl || '',
        role: callee.role || 'Employé',
        status: 'ringing'
      }
    ];

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
      participants: initialParticipants,
      isGroupCall: false,
      type,
      status: 'ringing',
      createdAt: new Date().toISOString(),
      offer: {
        type: 'offer',
        sdp: offer.sdp || ''
      },
      callerCandidates: [],
      calleeCandidates: []
    };

    await setDoc(callDocRef, callData);

    // 5. Play ringback tone
    soundService.startOutgoingRingback();

    // 6. Timeout after 45s if unanswered
    this.ringTimeout = setTimeout(async () => {
      try {
        const snap = await getDoc(callDocRef);
        if (snap.exists() && (snap.data() as VoIPCall).status === 'ringing') {
          await updateDoc(callDocRef, {
            status: 'missed',
            endedAt: new Date().toISOString()
          });
          soundService.playHangupTone();
          if (onEnded) onEnded('Non répondu (Délai dépassé)');
        }
      } catch (e) {
        console.warn('Call ring timeout warning:', e);
      }
    }, 45000);

    // 7. Subscribe to Call doc and multi-peer signaling
    this.setupCallListeners(callId, caller.id, {
      onConnected,
      onEnded,
      onRemoteStream
    });

    return callData;
  }

  // 2. Answer an Incoming Call
  public async answerCall(
    call: VoIPCall, 
    callbacks?: CallEventCallbacks
  ): Promise<void> {
    this.cleanUp();
    this.currentCallId = call.id;
    this.currentUserId = call.calleeId;
    const callDocRef = doc(db, COLLECTIONS.CALLS, call.id);
    soundService.stopAll();

    // 1. Grab local media stream
    await webRTCService.startLocalStream(call.type);

    // 2. Setup multi-peer webRTC callbacks
    webRTCService.setCallbacks({
      onRemoteStream: (peerId, stream) => {
        if (callbacks?.onRemoteStream) callbacks.onRemoteStream(stream, peerId);
      },
      onRemoteStreamRemoved: (peerId) => {
        if (callbacks?.onParticipantLeft) callbacks.onParticipantLeft(peerId);
      },
      onIceCandidate: async (peerId, candidate) => {
        await this.sendCandidate(call.id, {
          fromUserId: call.calleeId,
          toUserId: peerId,
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
          timestamp: Date.now()
        });
      },
      onConnectionStateChange: (peerId, state) => {
        if (state === 'connected') {
          soundService.stopAll();
          if (callbacks?.onConnected) callbacks.onConnected();
        }
      }
    });

    // 3. Connect to primary caller if legacy offer exists
    if (call.offer) {
      await webRTCService.setRemoteDescriptionForPeer(call.callerId, call.offer as RTCSessionDescriptionInit);
      const answer = await webRTCService.createAnswerForPeer(call.callerId);

      // Update call participants array
      const currentSnap = await getDoc(callDocRef);
      let participants = call.participants || [];
      if (currentSnap.exists()) {
        const d = currentSnap.data() as VoIPCall;
        participants = d.participants || participants;
      }

      const updatedParticipants = participants.map(p => {
        if (p.id === call.calleeId) {
          return { ...p, status: 'joined' as const, joinedAt: new Date().toISOString() };
        }
        return p;
      });

      // Ensure caller is marked joined
      const hasCallee = updatedParticipants.some(p => p.id === call.calleeId);
      if (!hasCallee) {
        updatedParticipants.push({
          id: call.calleeId,
          name: call.calleeName,
          email: call.calleeEmail,
          avatarUrl: call.calleeAvatar,
          role: call.calleeRole,
          status: 'joined',
          joinedAt: new Date().toISOString()
        });
      }

      await updateDoc(callDocRef, {
        status: 'connected',
        startedAt: new Date().toISOString(),
        participants: updatedParticipants,
        answer: {
          type: 'answer',
          sdp: answer.sdp || ''
        }
      });
    }

    soundService.playConnectedChime();
    if (callbacks?.onConnected) callbacks.onConnected();

    // 4. Setup listeners for any multi-peer signals and candidates
    this.setupCallListeners(call.id, call.calleeId, callbacks);
  }

  // 3. Add a Colleague to an Ongoing Call (Group Conference)
  public async addParticipantToCall(
    callId: string,
    inviter: AppUser,
    targetUser: { id: string; name: string; email?: string; avatarUrl?: string; role?: string }
  ): Promise<void> {
    const callDocRef = doc(db, COLLECTIONS.CALLS, callId);
    const snap = await getDoc(callDocRef);
    if (!snap.exists()) throw new Error('Appel introuvable.');

    const call = snap.data() as VoIPCall;
    const participants = call.participants || [
      { id: call.callerId, name: call.callerName, avatarUrl: call.callerAvatar, role: call.callerRole, status: 'joined' },
      { id: call.calleeId, name: call.calleeName, avatarUrl: call.calleeAvatar, role: call.calleeRole, status: 'joined' }
    ];

    // Check if target is already in participants
    const existingIndex = participants.findIndex(p => p.id === targetUser.id);
    if (existingIndex >= 0) {
      if (participants[existingIndex].status === 'joined') {
        throw new Error(`${targetUser.name} participe déjà à cet appel.`);
      }
      participants[existingIndex].status = 'ringing';
    } else {
      participants.push({
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email || '',
        avatarUrl: targetUser.avatarUrl || '',
        role: targetUser.role || 'Employé',
        status: 'ringing'
      });
    }

    await updateDoc(callDocRef, {
      isGroupCall: true,
      invitedBy: inviter.name,
      participants
    });

    // Create an SDP offer for the newly invited participant from inviter
    try {
      const offer = await webRTCService.createOfferForPeer(targetUser.id);
      await this.sendSignal(callId, {
        fromUserId: inviter.id,
        fromUserName: inviter.name,
        toUserId: targetUser.id,
        type: 'offer',
        sdp: offer.sdp || '',
        timestamp: Date.now()
      });
    } catch (e) {
      console.warn('[Signaling] Pre-creating offer warning:', e);
    }
  }

  // 4. Join a Group Call when invited
  public async joinGroupCall(
    call: VoIPCall,
    currentUser: AppUser,
    callbacks?: CallEventCallbacks
  ): Promise<void> {
    this.cleanUp();
    this.currentCallId = call.id;
    this.currentUserId = currentUser.id;
    const callDocRef = doc(db, COLLECTIONS.CALLS, call.id);
    soundService.stopAll();

    // 1. Grab local stream
    await webRTCService.startLocalStream(call.type);

    // 2. Setup multi-peer webRTC callbacks
    webRTCService.setCallbacks({
      onRemoteStream: (peerId, stream) => {
        if (callbacks?.onRemoteStream) callbacks.onRemoteStream(stream, peerId);
      },
      onRemoteStreamRemoved: (peerId) => {
        if (callbacks?.onParticipantLeft) callbacks.onParticipantLeft(peerId);
      },
      onIceCandidate: async (peerId, candidate) => {
        await this.sendCandidate(call.id, {
          fromUserId: currentUser.id,
          toUserId: peerId,
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
          timestamp: Date.now()
        });
      },
      onConnectionStateChange: (peerId, state) => {
        if (state === 'connected') {
          soundService.stopAll();
          if (callbacks?.onConnected) callbacks.onConnected();
        }
      }
    });

    // 3. Mark current user as joined in Firestore
    const snap = await getDoc(callDocRef);
    if (snap.exists()) {
      const d = snap.data() as VoIPCall;
      const participants = (d.participants || []).map(p => {
        if (p.id === currentUser.id) {
          return { ...p, status: 'joined' as const, joinedAt: new Date().toISOString() };
        }
        return p;
      });

      await updateDoc(callDocRef, {
        participants,
        status: 'connected'
      });

      // 4. Create WebRTC offer to each participant already in the call
      const activePeers = participants.filter(p => p.status === 'joined' && p.id !== currentUser.id);
      for (const peer of activePeers) {
        try {
          const offer = await webRTCService.createOfferForPeer(peer.id);
          await this.sendSignal(call.id, {
            fromUserId: currentUser.id,
            fromUserName: currentUser.name,
            toUserId: peer.id,
            type: 'offer',
            sdp: offer.sdp || '',
            timestamp: Date.now()
          });
        } catch (e) {
          console.warn(`[Signaling] Offer to ${peer.name} failed:`, e);
        }
      }
    }

    soundService.playConnectedChime();
    if (callbacks?.onConnected) callbacks.onConnected();

    // 5. Setup multi-peer signal & candidate listeners
    this.setupCallListeners(call.id, currentUser.id, callbacks);
  }

  // 5. Setup Live Listeners for Call Doc, Signals & Candidates
  private setupCallListeners(
    callId: string, 
    myUserId: string, 
    callbacks?: CallEventCallbacks
  ) {
    const callDocRef = doc(db, COLLECTIONS.CALLS, callId);
    const signalsCol = collection(db, COLLECTIONS.CALLS, callId, 'signals');
    const candidatesCol = collection(db, COLLECTIONS.CALLS, callId, 'candidates');

    // 1. Call Doc Listener (Status, Participant changes)
    let hasSetInitialAnswer = false;
    this.activeCallUnsub = onSnapshot(callDocRef, async (snapshot) => {
      if (!snapshot.exists()) return;
      const updated = snapshot.data() as VoIPCall;

      // Handle 1-on-1 direct answer
      if (updated.status === 'connected' && updated.answer && !hasSetInitialAnswer && updated.callerId === myUserId) {
        hasSetInitialAnswer = true;
        clearTimeout(this.ringTimeout);
        soundService.playConnectedChime();
        await webRTCService.setRemoteDescriptionForPeer(updated.calleeId, updated.answer as RTCSessionDescriptionInit);
        if (callbacks?.onConnected) callbacks.onConnected();
      }

      // Check if call was rejected or ended completely
      if (updated.status === 'rejected') {
        clearTimeout(this.ringTimeout);
        soundService.playHangupTone();
        this.cleanUp();
        if (callbacks?.onEnded) callbacks.onEnded('Appel refusé');
      } else if (updated.status === 'ended') {
        clearTimeout(this.ringTimeout);
        soundService.playHangupTone();
        this.cleanUp();
        if (callbacks?.onEnded) callbacks.onEnded('Appel terminé');
      } else if (updated.status === 'missed') {
        clearTimeout(this.ringTimeout);
        soundService.playHangupTone();
        this.cleanUp();
        if (callbacks?.onEnded) callbacks.onEnded('Aucune réponse');
      }
    });

    // 2. Multi-Peer Signals Listener (Offers & Answers targeted at me)
    const signalsQuery = query(signalsCol, where('toUserId', '==', myUserId));
    this.signalsUnsub = onSnapshot(signalsQuery, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const signal = change.doc.data() as VoIPCallSignal;
          const fromPeerId = signal.fromUserId;

          if (signal.type === 'offer') {
            console.log(`[Signaling] Received Offer from ${signal.fromUserName || fromPeerId}`);
            try {
              await webRTCService.setRemoteDescriptionForPeer(fromPeerId, {
                type: 'offer',
                sdp: signal.sdp
              });
              const answer = await webRTCService.createAnswerForPeer(fromPeerId);
              await this.sendSignal(callId, {
                fromUserId: myUserId,
                toUserId: fromPeerId,
                type: 'answer',
                sdp: answer.sdp || '',
                timestamp: Date.now()
              });
            } catch (e) {
              console.warn(`[Signaling] Error answering offer from ${fromPeerId}:`, e);
            }
          } else if (signal.type === 'answer') {
            console.log(`[Signaling] Received Answer from ${fromPeerId}`);
            try {
              await webRTCService.setRemoteDescriptionForPeer(fromPeerId, {
                type: 'answer',
                sdp: signal.sdp
              });
            } catch (e) {
              console.warn(`[Signaling] Error setting answer from ${fromPeerId}:`, e);
            }
          }
        }
      }
    });

    // 3. Multi-Peer Candidates Listener (ICE candidates targeted at me)
    const candidatesQuery = query(candidatesCol, where('toUserId', '==', myUserId));
    this.candidatesUnsub = onSnapshot(candidatesQuery, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const cand = change.doc.data() as VoIPCallCandidate;
          if (cand.fromUserId) {
            await webRTCService.addIceCandidateForPeer(cand.fromUserId, {
              candidate: cand.candidate,
              sdpMid: cand.sdpMid,
              sdpMLineIndex: cand.sdpMLineIndex
            });
          }
        }
      }
    });
  }

  // Send Signal to subcollection
  public async sendSignal(callId: string, signal: VoIPCallSignal): Promise<void> {
    try {
      const sigId = `sig_${signal.fromUserId}_${signal.toUserId}_${Date.now()}`;
      const sigDocRef = doc(db, COLLECTIONS.CALLS, callId, 'signals', sigId);
      await setDoc(sigDocRef, signal);
    } catch (e) {
      console.warn('[Signaling] Send signal error:', e);
    }
  }

  // Send ICE Candidate to subcollection
  public async sendCandidate(callId: string, candidate: VoIPCallCandidate): Promise<void> {
    try {
      const candId = `cand_${candidate.fromUserId}_${candidate.toUserId}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      const candDocRef = doc(db, COLLECTIONS.CALLS, callId, 'candidates', candId);
      await setDoc(candDocRef, candidate);
    } catch (e) {
      console.warn('[Signaling] Send candidate error:', e);
    }
  }

  // 6. Reject an Incoming Call
  public async rejectCall(callId: string, rejectingUserId?: string): Promise<void> {
    soundService.stopAll();
    try {
      const callDocRef = doc(db, COLLECTIONS.CALLS, callId);
      const snap = await getDoc(callDocRef);
      if (snap.exists()) {
        const call = snap.data() as VoIPCall;
        if (call.participants && call.participants.length > 2 && rejectingUserId) {
          // If in a group call, only mark this user as rejected
          const participants = call.participants.map(p => 
            p.id === rejectingUserId ? { ...p, status: 'rejected' as const } : p
          );
          await updateDoc(callDocRef, { participants });
        } else {
          // 1-on-1 call: reject completely
          await updateDoc(callDocRef, {
            status: 'rejected',
            endedAt: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.warn('Reject call error:', e);
    }
    this.cleanUp();
  }

  // 7. Leave or End an Active Call
  public async endCall(callId: string, durationSeconds: number = 0, leavingUserId?: string): Promise<void> {
    clearTimeout(this.ringTimeout);
    soundService.playHangupTone();
    try {
      const callDocRef = doc(db, COLLECTIONS.CALLS, callId);
      const snap = await getDoc(callDocRef);
      if (snap.exists()) {
        const call = snap.data() as VoIPCall;
        const participants = call.participants || [];

        if (leavingUserId && participants.length > 2) {
          // Multi-participant call: mark leaving user as 'left'
          const updatedParticipants = participants.map(p => 
            p.id === leavingUserId ? { ...p, status: 'left' as const } : p
          );
          const activeCount = updatedParticipants.filter(p => p.status === 'joined').length;

          if (activeCount <= 1) {
            // If only 1 or 0 participants remain, end entire call
            await updateDoc(callDocRef, {
              status: 'ended',
              endedAt: new Date().toISOString(),
              durationSeconds,
              participants: updatedParticipants
            });
          } else {
            // Otherwise conference continues for remaining members!
            await updateDoc(callDocRef, {
              participants: updatedParticipants
            });
          }
        } else {
          // 1-on-1 call or full hangup
          await updateDoc(callDocRef, {
            status: 'ended',
            endedAt: new Date().toISOString(),
            durationSeconds
          });
        }
      }
    } catch (e) {
      console.warn('End call error:', e);
    }
    this.cleanUp();
  }

  // 8. Subscribe to incoming calls (Direct or Group Invites)
  public subscribeToIncomingCalls(
    userId: string, 
    onIncomingCall: (call: VoIPCall) => void
  ): Unsubscribe {
    const callsCol = collection(db, COLLECTIONS.CALLS);
    // Listen to calls active within last 60 seconds
    const q = query(
      callsCol,
      where('status', 'in', ['ringing', 'connected']),
      limit(10)
    );

    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const call = change.doc.data() as VoIPCall;
          const created = new Date(call.createdAt).getTime();
          const now = Date.now();

          // Check if call was created recently (< 60s)
          if (now - created < 60000) {
            // Check direct call
            const isDirectCallee = call.calleeId === userId && call.status === 'ringing';
            // Check group participant invite
            const isGroupInvitee = call.participants?.some(p => p.id === userId && p.status === 'ringing');

            if (isDirectCallee || isGroupInvitee) {
              soundService.startIncomingRingtone();
              onIncomingCall(call);
            }
          }
        }
      });
    }, (err) => {
      console.warn('Incoming calls listener error:', err);
    });
  }

  // 9. Subscribe to Call History
  public subscribeToCallHistory(
    userId: string, 
    onHistoryUpdated: (calls: VoIPCall[]) => void
  ): Unsubscribe {
    const callsCol = collection(db, COLLECTIONS.CALLS);
    return onSnapshot(callsCol, (snapshot) => {
      const allCalls = snapshot.docs
        .map(d => d.data() as VoIPCall)
        .filter(c => {
          if (c.callerId === userId || c.calleeId === userId) return true;
          return c.participants?.some(p => p.id === userId);
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      onHistoryUpdated(allCalls.slice(0, 50));
    }, (err) => {
      console.warn('Call history subscription warning:', err);
    });
  }

  // 10. Presence Management
  public async setPresence(user: AppUser, status: 'online' | 'in_call' | 'away'): Promise<void> {
    if (!user || !user.id) return;
    try {
      const presenceRef = doc(db, COLLECTIONS.USER_PRESENCES, user.id);
      const data: UserOnlinePresence = {
        id: user.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        avatarUrl: user.avatarUrl || '',
        role: user.role || 'Employé',
        status,
        lastSeen: new Date().toISOString(),
        device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'
      };
      await setDoc(presenceRef, data, { merge: true });
    } catch (e) {
      console.warn('Presence update warning:', e);
    }
  }

  public subscribeToPresences(callback: (presences: UserOnlinePresence[]) => void): Unsubscribe {
    const presencesCol = collection(db, COLLECTIONS.USER_PRESENCES);
    return onSnapshot(presencesCol, (snapshot) => {
      const list = snapshot.docs.map(d => d.data() as UserOnlinePresence);
      callback(list);
    }, (err) => {
      console.warn('Presence subscription warning:', err);
    });
  }

  // Cleanup active listeners and audio
  public cleanUp(): void {
    if (this.activeCallUnsub) {
      this.activeCallUnsub();
      this.activeCallUnsub = null;
    }
    if (this.signalsUnsub) {
      this.signalsUnsub();
      this.signalsUnsub = null;
    }
    if (this.candidatesUnsub) {
      this.candidatesUnsub();
      this.candidatesUnsub = null;
    }
    if (this.ringTimeout) {
      clearTimeout(this.ringTimeout);
      this.ringTimeout = null;
    }
    this.currentCallId = null;
    this.currentUserId = null;
    webRTCService.cleanUp();
  }
}

export const callSignalingService = new CallSignalingService();
