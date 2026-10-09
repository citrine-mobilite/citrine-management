import React, { useState, useMemo, useEffect } from 'react';
import { PhoneCall, History, Users, Search, Phone, Video, ShieldCheck, Wifi } from 'lucide-react';
import { Employee, AppUser, VoIPCall, UserOnlinePresence, CallType } from '../types';
import { ColleaguesCallDirectory } from './calls/ColleaguesCallDirectory';
import { CallHistoryList } from './calls/CallHistoryList';
import { ActiveCallModal } from './ActiveCallModal';
import { IncomingCallModal } from './IncomingCallModal';
import { callSignalingService } from '../services/callSignalingService';
import { COLLECTIONS, subscribeToCollection } from '../services/firestoreService';

interface TeamCallsPanelProps {
  currentUser: AppUser | null;
  employees?: Employee[];
  users?: AppUser[];
  onlinePresences?: UserOnlinePresence[];
  callHistory?: VoIPCall[];
  onStartCall?: (target: { id: string; name: string; email?: string; avatarUrl?: string; role?: string }, type: CallType) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const TeamCallsPanel: React.FC<TeamCallsPanelProps> = ({
  currentUser,
  employees = [],
  users = [],
  onlinePresences: propOnlinePresences,
  callHistory: propCallHistory,
  onStartCall: propOnStartCall,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'history'>('directory');
  const [searchQuery, setSearchQuery] = useState('');

  // États pour la gestion active des appels WebRTC & VoIP
  const [activeCall, setActiveCall] = useState<VoIPCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<VoIPCall | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Synchronisation en temps réel des présences en ligne si non fournies par le parent
  const [livePresences, setLivePresences] = useState<UserOnlinePresence[]>([]);
  useEffect(() => {
    if (propOnlinePresences && propOnlinePresences.length > 0) return;
    const unsub = subscribeToCollection<UserOnlinePresence>(
      COLLECTIONS.USER_PRESENCES,
      (data) => setLivePresences(data || [])
    );
    return () => unsub();
  }, [propOnlinePresences]);

  // Synchronisation en temps réel de l'historique d'appels depuis Firestore
  const [liveCalls, setLiveCalls] = useState<VoIPCall[]>([]);
  useEffect(() => {
    if (propCallHistory && propCallHistory.length > 0) return;
    const unsub = subscribeToCollection<VoIPCall>(
      COLLECTIONS.CALLS,
      (data) => setLiveCalls(data || [])
    );
    return () => unsub();
  }, [propCallHistory]);

  const effectiveOnlinePresences = propOnlinePresences || livePresences;
  const effectiveCallHistory = (propCallHistory || liveCalls).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Écoute continue des appels entrants pour l'utilisateur actuel
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubscribe = callSignalingService.listenForIncomingCalls(
      currentUser.id,
      (call) => {
        setIncomingCall(call);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.id]);

  // Construction de l'annuaire de collègues combinant employés et comptes utilisateurs
  const colleagues = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string; avatarUrl?: string; role: string; department?: string }>();
    
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

  // Lancement direct d'un appel audio ou vidéo
  const handleStartCall = async (
    target: { id: string; name: string; email?: string; avatarUrl?: string; role?: string },
    type: CallType
  ) => {
    if (propOnStartCall) {
      propOnStartCall(target, type);
    }

    if (!currentUser) {
      if (showToast) showToast("Veuillez vous connecter pour lancer un appel d'équipe.", "error");
      return;
    }

    try {
      const callData = await callSignalingService.initiateCall({
        caller: currentUser,
        callee: target,
        type,
        callbacks: {
          onConnected: () => {
            setActiveCall((prev) => prev ? { ...prev, status: 'connected' } : null);
            if (showToast) showToast(`Connecté avec ${target.name}`, "success");
          },
          onRemoteStream: (stream) => {
            setRemoteStream(stream);
          },
          onEnded: (reason) => {
            setActiveCall(null);
            setRemoteStream(null);
            if (showToast) showToast(reason || "Appel terminé.", "info");
          },
        },
      });

      setActiveCall(callData);
    } catch (err: any) {
      const msg = err?.message || "Impossible d'accéder au micro ou à la caméra.";
      if (showToast) showToast(msg, "error");
    }
  };

  // Répondre à un appel entrant
  const handleAcceptIncomingCall = async (call: VoIPCall) => {
    setIncomingCall(null);
    setActiveCall(call);

    try {
      await callSignalingService.answerCall(call, {
        onConnected: () => {
          setActiveCall((prev) => prev ? { ...prev, status: 'connected' } : null);
        },
        onRemoteStream: (stream) => {
          setRemoteStream(stream);
        },
        onEnded: (reason) => {
          setActiveCall(null);
          setRemoteStream(null);
          if (showToast) showToast(reason || "Appel terminé.", "info");
        },
      });
    } catch (err: any) {
      if (showToast) showToast(err?.message || "Erreur lors de la prise d'appel.", "error");
    }
  };

  // Décliner un appel entrant
  const handleRejectIncomingCall = async (call: VoIPCall) => {
    setIncomingCall(null);
    await callSignalingService.rejectCall(call.id);
    if (showToast) showToast("Appel refusé.", "info");
  };

  // Raccrocher l'appel en cours
  const handleEndActiveCall = async (durationSeconds: number) => {
    if (activeCall) {
      await callSignalingService.endCall(activeCall.id, `Terminé (${durationSeconds}s)`);
    }
    setActiveCall(null);
    setRemoteStream(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-emerald-200" />
            <h2 className="font-serif font-bold text-xl">Appels d'Équipe & Visioconférence</h2>
          </div>
          <p className="text-xs text-emerald-100/90 mt-1">
            Communications internes sécurisées WebRTC · Audio HD & Visioconférence gratuites entre collaborateurs.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/20 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'directory' ? 'bg-white text-[#2A7B76] shadow-2xs' : 'text-white/80 hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Annuaire ({colleagues.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history' ? 'bg-white text-[#2A7B76] shadow-2xs' : 'text-white/80 hover:text-white'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Historique ({effectiveCallHistory.length})</span>
          </button>
        </div>
      </div>

      {/* Barre d'état & Recherche */}
      {activeTab === 'directory' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Rechercher un collègue par nom ou rôle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-stone-500 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Système WebRTC Actif</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-stone-400">
              <ShieldCheck className="h-3.5 w-3.5 text-[#2A7B76]" />
              <span>Chiffrement de bout en bout</span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'directory' ? (
        colleagues.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-stone-200 text-center text-stone-500 text-xs space-y-2">
            <Users className="h-8 w-8 text-stone-300 mx-auto" />
            <p className="font-semibold text-stone-700">Aucun autre collègue disponible dans l'annuaire.</p>
            <p className="text-[11px] text-stone-400">
              Ajoutez des collaborateurs dans la section Collaborateurs ou Utilisateurs pour passer des appels.
            </p>
          </div>
        ) : (
          <ColleaguesCallDirectory
            colleagues={colleagues}
            presenceMap={presenceMap}
            searchQuery={searchQuery}
            onStartCall={handleStartCall}
          />
        )
      ) : (
        <CallHistoryList 
          callHistory={effectiveCallHistory} 
          currentUserId={currentUser?.id} 
        />
      )}

      {/* Modal d'Appel Actif (En cours ou en sonnerie sortante) */}
      {activeCall && (
        <ActiveCallModal
          call={activeCall}
          currentUser={currentUser}
          employees={employees}
          users={users}
          onlinePresences={effectiveOnlinePresences}
          remoteStream={remoteStream}
          onEndCall={handleEndActiveCall}
          showToast={showToast}
        />
      )}

      {/* Modal d'Appel Entrant (Sonnerie & Réponse) */}
      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={handleAcceptIncomingCall}
          onReject={handleRejectIncomingCall}
        />
      )}
    </div>
  );
};
