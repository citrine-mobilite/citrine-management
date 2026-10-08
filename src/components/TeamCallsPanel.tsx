import React, { useState, useMemo } from 'react';
import { PhoneCall, History, Users, Search } from 'lucide-react';
import { Employee, AppUser, VoIPCall, UserOnlinePresence, CallType } from '../types';
import { ColleaguesCallDirectory } from './calls/ColleaguesCallDirectory';
import { CallHistoryList } from './calls/CallHistoryList';

interface TeamCallsPanelProps {
  currentUser: AppUser | null;
  employees: Employee[];
  users: AppUser[];
  onlinePresences: UserOnlinePresence[];
  callHistory: VoIPCall[];
  onStartCall: (target: { id: string; name: string; email?: string; avatarUrl?: string; role?: string }, type: CallType) => void;
}

export const TeamCallsPanel: React.FC<TeamCallsPanelProps> = ({
  currentUser,
  employees,
  users,
  onlinePresences,
  callHistory,
  onStartCall,
}) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'history'>('directory');
  const [searchQuery, setSearchQuery] = useState('');

  const colleagues = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string; avatarUrl?: string; role: string; department?: string }>();
    employees.forEach((emp) => {
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
    users.forEach((u) => {
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
    if (currentUser?.id) map.delete(currentUser.id);
    return Array.from(map.values());
  }, [employees, users, currentUser]);

  const presenceMap = useMemo(() => {
    const pMap = new Map<string, UserOnlinePresence>();
    onlinePresences.forEach((p) => {
      pMap.set(p.userId, p);
      if (p.userEmail) pMap.set(p.userEmail.toLowerCase(), p);
    });
    return pMap;
  }, [onlinePresences]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-emerald-200" />
            <h2 className="font-serif font-bold text-xl">Appels d'Équipe & Visioconférence</h2>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/20 shrink-0">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'directory' ? 'bg-white text-[#2A7B76] shadow-2xs' : 'text-white/80 hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Annuaire ({colleagues.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history' ? 'bg-white text-[#2A7B76] shadow-2xs' : 'text-white/80 hover:text-white'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Historique</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      {activeTab === 'directory' && (
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher un collègue par nom ou rôle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white rounded-2xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
          />
        </div>
      )}

      {/* Content */}
      {activeTab === 'directory' ? (
        <ColleaguesCallDirectory
          colleagues={colleagues}
          presenceMap={presenceMap}
          searchQuery={searchQuery}
          onStartCall={onStartCall}
        />
      ) : (
        <CallHistoryList callHistory={callHistory} currentUserId={currentUser?.id} />
      )}
    </div>
  );
};
