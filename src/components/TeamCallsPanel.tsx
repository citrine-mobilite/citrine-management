import React, { useState } from 'react';
import { PhoneCall, History, Users, Search, ShieldCheck } from 'lucide-react';
import { Employee, AppUser, VoIPCall, UserOnlinePresence, CallType } from '../types';
import { ColleaguesCallDirectory } from './calls/ColleaguesCallDirectory';
import { CallHistoryList } from './calls/CallHistoryList';
import { ActiveCallModal } from './ActiveCallModal';
import { IncomingCallModal } from './IncomingCallModal';
import { useTeamCallsLogic } from './calls/useTeamCallsLogic';

interface TeamCallsPanelProps {
  currentUser: AppUser | null;
  employees?: Employee[];
  users?: AppUser[];
  onlinePresences?: UserOnlinePresence[];
  callHistory?: VoIPCall[];
  onStartCall?: (
    target: { id: string; name: string; email?: string; avatarUrl?: string; role?: string },
    type: CallType
  ) => void;
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

  const {
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
  } = useTeamCallsLogic({
    currentUser,
    employees,
    users,
    propOnlinePresences,
    propCallHistory,
    propOnStartCall,
    showToast,
  });

  return (
    <div className="space-y-6">
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

export default TeamCallsPanel;
