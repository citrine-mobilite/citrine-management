import { useState, useMemo, useEffect } from 'react';
import { Employee, AppUser, VoIPCall, UserOnlinePresence, CallType } from '../../types';
import { callSignalingService } from '../../services/callSignalingService';
import { COLLECTIONS, subscribeToCollection } from '../../services/dataService';

interface UseTeamCallsLogicProps {
  currentUser: AppUser | null;
  employees: Employee[];
  users: AppUser[];
  propOnlinePresences?: UserOnlinePresence[];
  propCallHistory?: VoIPCall[];
  propOnStartCall?: (
    target: { id: string; name: string; email?: string; avatarUrl?: string; role?: string },
    type: CallType
  ) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const useTeamCallsLogic = ({
  currentUser,
  employees,
  users,
  propOnlinePresences,
  propCallHistory,
  propOnStartCall,
  showToast,
}: UseTeamCallsLogicProps) => {
  const [activeCall, setActiveCall] = useState<VoIPCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<VoIPCall | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [livePresences, setLivePresences] = useState<UserOnlinePresence[]>([]);
  const [liveCalls, setLiveCalls] = useState<VoIPCall[]>([]);

  useEffect(() => {
    if (propOnlinePresences && propOnlinePresences.length > 0) return;
    const unsub = subscribeToCollection<UserOnlinePresence>(
      COLLECTIONS.USER_PRESENCES,
      (data) => setLivePresences(data || [])
    );
    return () => unsub();
  }, [propOnlinePresences]);

  useEffect(() => {
    if (propCallHistory && propCallHistory.length > 0) return;
    const unsub = subscribeToCollection<VoIPCall>(
      COLLECTIONS.CALLS,
      (data) => setLiveCalls(data || [])
    );
    return () => unsub();
  }, [propCallHistory]);

  const effectiveOnlinePresences = propOnlinePresences || livePresences;
  const effectiveCallHistory = useMemo(
    () =>
      [...(propCallHistory || liveCalls)].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [propCallHistory, liveCalls]
  );

  useEffect(() => {
    if (!currentUser?.id) return;
    const unsubscribe = callSignalingService.listenForIncomingCalls(
      currentUser.id,
      (call) => setIncomingCall(call)
    );
    return () => unsubscribe();
  }, [currentUser?.id]);

  const colleagues = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; email: string; avatarUrl?: string; role: string; department?: string }
    >();

    (employees || []).forEach((emp) => {
      if (emp.id && emp.name) {
        map.set(emp.id, {
          id: emp.id,
          name: emp.name,
          email: emp.email || '',
          avatarUrl: emp.avatarUrl,
          role: emp.roleType || 'Employé',
          department: emp.department || 'Opérations',
        });
      }
    });

    (users || []).forEach((u) => {
      if (u.id && !map.has(u.id)) {
        map.set(u.id, {
          id: u.id,
          name: u.name,
          email: u.email,
          avatarUrl: u.avatarUrl,
          role: u.role,
          department: u.department || 'Administration',
        });
      }
    });

    if (currentUser?.id) {
      map.delete(currentUser.id);
    }
    return Array.from(map.values());
  }, [employees, users, currentUser]);

  const presenceMap = useMemo(() => {
    const pMap = new Map<string, UserOnlinePresence>();
    effectiveOnlinePresences.forEach((p) => {
      if (p.userId) pMap.set(p.userId, p);
      if (p.userEmail) pMap.set(p.userEmail.toLowerCase(), p);
    });
    return pMap;
  }, [effectiveOnlinePresences]);

  const handleStartCall = async (
    target: { id: string; name: string; email?: string; avatarUrl?: string; role?: string },
    type: CallType
  ) => {
    if (propOnStartCall) propOnStartCall(target, type);

    if (!currentUser) {
      if (showToast) showToast("Veuillez vous connecter pour lancer un appel d'équipe.", 'error');
      return;
    }

    try {
      const callData = await callSignalingService.initiateCall({
        caller: currentUser,
        callee: target,
        type,
        callbacks: {
          onConnected: () => {
            setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
            if (showToast) showToast(`Connecté avec ${target.name}`, 'success');
          },
          onRemoteStream: (stream) => setRemoteStream(stream),
          onEnded: (reason) => {
            setActiveCall(null);
            setRemoteStream(null);
            if (showToast) showToast(reason || 'Appel terminé.', 'info');
          },
        },
      });
      setActiveCall(callData);
    } catch (err: any) {
      const msg = err?.message || "Impossible d'accéder au micro ou à la caméra.";
      if (showToast) showToast(msg, 'error');
    }
  };

  const handleAcceptIncomingCall = async (call: VoIPCall) => {
    setIncomingCall(null);
    setActiveCall(call);

    try {
      await callSignalingService.answerCall(call, {
        onConnected: () => {
          setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
        },
        onRemoteStream: (stream) => setRemoteStream(stream),
        onEnded: (reason) => {
          setActiveCall(null);
          setRemoteStream(null);
          if (showToast) showToast(reason || 'Appel terminé.', 'info');
        },
      });
    } catch (err: any) {
      if (showToast) showToast(err?.message || "Erreur lors de la prise d'appel.", 'error');
    }
  };

  const handleRejectIncomingCall = async (call: VoIPCall) => {
    setIncomingCall(null);
    await callSignalingService.rejectCall(call.id);
    if (showToast) showToast('Appel refusé.', 'info');
  };

  const handleEndActiveCall = async (durationSeconds: number) => {
    if (activeCall) {
      await callSignalingService.endCall(activeCall.id, `Terminé (${durationSeconds}s)`);
    }
    setActiveCall(null);
    setRemoteStream(null);
  };

  return {
    activeCall,
    incomingCall,
    remoteStream,
    effectiveOnlinePresences,
    effectiveCallHistory,
    colleagues,
    presenceMap,
    handleStartCall,
    handleAcceptIncomingCall,
    handleRejectIncomingCall,
    handleEndActiveCall,
  };
};
