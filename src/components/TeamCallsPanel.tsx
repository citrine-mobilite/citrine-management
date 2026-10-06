import React, { useState, useMemo } from 'react';
import { 
  Phone, 
  Video, 
  Search, 
  Users, 
  History, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  Wifi,
  PhoneCall,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import { Employee, AppUser, VoIPCall, UserOnlinePresence, CallType } from '../types';

interface TeamCallsPanelProps {
  currentUser: AppUser | null;
  employees: Employee[];
  users: AppUser[];
  onlinePresences: UserOnlinePresence[];
  callHistory: VoIPCall[];
  onStartCall: (target: { id: string; name: string; email?: string; avatarUrl?: string; role?: string }, type: CallType) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const TeamCallsPanel: React.FC<TeamCallsPanelProps> = ({
  currentUser,
  employees,
  users,
  onlinePresences,
  callHistory,
  onStartCall
}) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'history'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Build a unified colleagues list combining Employees and AppUsers, excluding current user
  const colleagues = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string; avatarUrl?: string; role: string; department?: string }>();

    // Add employees
    employees.forEach(emp => {
      if (emp.id && emp.name) {
        map.set(emp.id, {
          id: emp.id,
          name: emp.name,
          email: emp.email || '',
          avatarUrl: emp.avatarUrl,
          role: emp.roleType || 'Employé',
          department: 'Opérations'
        });
      }
    });

    // Add app users if missing
    users.forEach(u => {
      if (u.id && !map.has(u.id)) {
        map.set(u.id, {
          id: u.id,
          name: u.name,
          email: u.email,
          avatarUrl: u.avatarUrl,
          role: u.role,
          department: u.department || 'Administration'
        });
      }
    });

    // Filter out current user
    if (currentUser?.id) {
      map.delete(currentUser.id);
    }
    if (currentUser?.email) {
      for (const [id, c] of map.entries()) {
        if (c.email && c.email.toLowerCase() === currentUser.email.toLowerCase()) {
          map.delete(id);
        }
      }
    }

    return Array.from(map.values());
  }, [employees, users, currentUser]);

  // Online presence map
  const presenceMap = useMemo(() => {
    const pMap = new Map<string, UserOnlinePresence>();
    onlinePresences.forEach(p => {
      pMap.set(p.userId, p);
      if (p.userEmail) pMap.set(p.userEmail.toLowerCase(), p);
    });
    return pMap;
  }, [onlinePresences]);

  // Filter colleagues
  const filteredColleagues = useMemo(() => {
    return colleagues.filter(c => {
      const matchSearch = 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.role.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchRole = roleFilter === 'all' || c.role.toLowerCase().includes(roleFilter.toLowerCase());

      return matchSearch && matchRole;
    });
  }, [colleagues, searchQuery, roleFilter]);

  // Calculate statistics
  const onlineCount = useMemo(() => {
    return colleagues.filter(c => {
      const p = presenceMap.get(c.id) || (c.email ? presenceMap.get(c.email.toLowerCase()) : null);
      if (!p) return false;
      const lastSeenTime = new Date(p.lastSeen).getTime();
      return (Date.now() - lastSeenTime) < 120000; // active within last 2 minutes
    }).length;
  }, [colleagues, presenceMap]);

  const totalCallSeconds = useMemo(() => {
    return callHistory.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
  }, [callHistory]);

  const formatDuration = (secs: number) => {
    if (!secs) return '0s';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-[#F0FAFA] rounded-3xl p-6 text-stone-900 border border-cyan-200/90 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-serif">
              Appels Directs entre Collègues
            </h2>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-3 text-center border border-cyan-200/70 shadow-2xs">
              <p className="text-xs text-stone-500 font-medium">En ligne</p>
              <p className="text-2xl font-bold text-emerald-700 mt-0.5">{onlineCount}</p>
            </div>
            <div className="bg-white rounded-2xl p-3 text-center border border-cyan-200/70 shadow-2xs">
              <p className="text-xs text-stone-500 font-medium">Historique</p>
              <p className="text-2xl font-bold text-stone-800 mt-0.5">{callHistory.length}</p>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-3 text-center border border-cyan-200/70 shadow-2xs">
              <p className="text-xs text-stone-500 font-medium">Temps d'appel</p>
              <p className="text-2xl font-bold text-stone-800 mt-0.5">{formatDuration(totalCallSeconds)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Search Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tab Buttons */}
        <div className="flex items-center p-1 bg-stone-200/80 rounded-2xl w-fit">
          <button
            id="tab-btn-directory"
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
              activeTab === 'directory'
                ? 'bg-white text-stone-900 shadow-md'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Annuaire des Collègues</span>
            <span className="ml-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
              {colleagues.length}
            </span>
          </button>

          <button
            id="tab-btn-history"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
              activeTab === 'history'
                ? 'bg-white text-stone-900 shadow-md'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historique des Appels</span>
            {callHistory.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-stone-200 text-stone-700 rounded-full text-xs font-bold">
                {callHistory.length}
              </span>
            )}
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            id="input-search-colleagues"
            type="text"
            placeholder="Rechercher un collègue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>
      </div>

      {/* Tab 1: Directory of Colleagues */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {filteredColleagues.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-sm space-y-3">
              <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-stone-800">Aucun collègue trouvé</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Essayez d'ajuster votre terme de recherche ou ajoutez de nouveaux collaborateurs dans le panneau Collaborateurs.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-4">Collaborateur</th>
                      <th className="py-3.5 px-4">Rôle & Département</th>
                      <th className="py-3.5 px-4">Disponibilité VoIP</th>
                      <th className="py-3.5 px-4 text-right">Lancer un Appel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredColleagues.map((colleague) => {
                      const presence = presenceMap.get(colleague.id) || (colleague.email ? presenceMap.get(colleague.email.toLowerCase()) : null);
                      const isOnline = presence && (Date.now() - new Date(presence.lastSeen).getTime()) < 180000;
                      const isInCall = presence?.status === 'in_call';

                      return (
                        <tr key={colleague.id} className="hover:bg-stone-50/80 transition group">
                          {/* Colleague Info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative shrink-0">
                                {colleague.avatarUrl ? (
                                  <img
                                    src={colleague.avatarUrl}
                                    alt={colleague.name}
                                    className="w-10 h-10 rounded-xl object-cover border border-stone-200 shadow-2xs"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-2xs">
                                    {colleague.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span
                                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                    isInCall ? 'bg-amber-500' : isOnline ? 'bg-emerald-500' : 'bg-stone-300'
                                  }`}
                                />
                              </div>
                              <div>
                                <div className="font-bold text-stone-900 text-xs sm:text-sm group-hover:text-emerald-700 transition">
                                  {colleague.name}
                                </div>
                                <div className="text-[11px] text-stone-500 font-mono">
                                  {colleague.email || 'Email non renseigné'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role & Dept */}
                          <td className="py-3 px-4">
                            <span className="font-semibold text-stone-800 capitalize text-xs block">
                              {colleague.role}
                            </span>
                            <span className="text-[10px] text-stone-400 uppercase tracking-wider block mt-0.5">
                              {colleague.department || 'Citrine Management'}
                            </span>
                          </td>

                          {/* Availability Status Badge */}
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                              isInCall
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : isOnline
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-stone-100 text-stone-600'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${
                                isInCall ? 'bg-amber-500 animate-pulse' : isOnline ? 'bg-emerald-500' : 'bg-stone-400'
                              }`} />
                              <span>{isInCall ? 'En communication' : isOnline ? 'En ligne' : 'Hors ligne'}</span>
                            </span>
                          </td>

                          {/* Direct Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                id={`btn-call-audio-${colleague.id}`}
                                onClick={() => onStartCall(colleague, 'audio')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white rounded-xl text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer"
                                title="Lancer un appel audio instantané"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>Audio</span>
                              </button>

                              <button
                                id={`btn-call-video-${colleague.id}`}
                                onClick={() => onStartCall(colleague, 'video')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-900 text-stone-700 hover:text-white rounded-xl text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer"
                                title="Lancer une visioconférence"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Vidéo</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Call History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden">
          {callHistory.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                <History className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-stone-800">Aucun appel récent</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Vos futurs appels audio et vidéo avec vos collègues apparaîtront ici avec leur durée et le statut.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {callHistory.map((call) => {
                const isOutgoing = call.callerId === currentUser?.id;
                const otherPartyName = isOutgoing ? call.calleeName : call.callerName;
                const otherPartyAvatar = isOutgoing ? call.calleeAvatar : call.callerAvatar;
                const otherPartyRole = isOutgoing ? call.calleeRole : call.callerRole;
                const otherPartyId = isOutgoing ? call.calleeId : call.callerId;

                const isMissed = call.status === 'missed' || call.status === 'rejected';

                return (
                  <div
                    key={call.id}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-stone-50 transition"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Call direction icon */}
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        isMissed 
                          ? 'bg-red-100 text-red-600'
                          : isOutgoing
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {isMissed ? (
                          <PhoneMissed className="w-5 h-5" />
                        ) : isOutgoing ? (
                          <PhoneOutgoing className="w-5 h-5" />
                        ) : (
                          <PhoneIncoming className="w-5 h-5" />
                        )}
                      </div>

                      {/* Avatar */}
                      {otherPartyAvatar ? (
                        <img
                          src={otherPartyAvatar}
                          alt={otherPartyName}
                          className="w-10 h-10 rounded-xl object-cover border border-stone-200 hidden sm:block"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-stone-200 text-stone-700 font-bold text-sm items-center justify-center hidden sm:flex">
                          {otherPartyName.charAt(0)}
                        </div>
                      )}

                      {/* Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-stone-900 text-sm truncate">{otherPartyName}</h4>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            call.type === 'video' 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {call.type === 'video' ? 'Vidéo' : 'Audio'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                          <span>{formatDate(call.createdAt)}</span>
                          {call.durationSeconds ? (
                            <>
                              <span>•</span>
                              <span className="font-medium text-stone-700">{formatDuration(call.durationSeconds)}</span>
                            </>
                          ) : (
                            <>
                              <span>•</span>
                              <span className={isMissed ? 'text-red-500 font-semibold' : 'text-stone-500'}>
                                {call.status === 'rejected' ? 'Refusé' : call.status === 'missed' ? 'Manqué' : 'Terminé'}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Fast Redial / Call Back button */}
                    <button
                      id={`btn-redial-${call.id}`}
                      onClick={() => onStartCall({
                        id: otherPartyId,
                        name: otherPartyName,
                        avatarUrl: otherPartyAvatar,
                        role: otherPartyRole
                      }, call.type)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-emerald-600 hover:text-white text-stone-700 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 flex-shrink-0"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Rappeler</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
