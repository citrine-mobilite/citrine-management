import React from 'react';
import { Phone, Video, Wifi } from 'lucide-react';
import { CallType, UserOnlinePresence } from '../../types';

interface ColleaguesCallDirectoryProps {
  colleagues: Array<{ id: string; name: string; email: string; avatarUrl?: string; role: string; department?: string }>;
  presenceMap: Map<string, UserOnlinePresence>;
  searchQuery: string;
  onStartCall: (target: { id: string; name: string; email?: string; avatarUrl?: string; role?: string }, type: CallType) => void;
}

export const ColleaguesCallDirectory: React.FC<ColleaguesCallDirectoryProps> = ({
  colleagues,
  presenceMap,
  searchQuery,
  onStartCall,
}) => {
  const filtered = colleagues.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {filtered.map((c) => {
        const presence = presenceMap.get(c.id) || presenceMap.get(c.email.toLowerCase());
        const isOnline = presence?.state === 'online';

        return (
          <div
            key={c.id}
            className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs hover:shadow-md transition flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                {c.avatarUrl ? (
                  <img src={c.avatarUrl} alt="" className="w-11 h-11 rounded-xl object-cover" />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-[#2A7B76] text-white flex items-center justify-center font-bold text-sm">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                    isOnline ? 'bg-emerald-500' : 'bg-stone-300'
                  }`}
                  title={isOnline ? 'En ligne' : 'Hors ligne'}
                />
              </div>

              <div className="min-w-0">
                <h4 className="font-bold text-xs text-stone-900 truncate">{c.name}</h4>
                <p className="text-[10px] text-stone-500 truncate">{c.role}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Wifi className={`h-3 w-3 ${isOnline ? 'text-emerald-600' : 'text-stone-400'}`} />
                  <span className="text-[9px] font-semibold text-stone-500">{isOnline ? 'En ligne' : 'Hors-ligne'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onStartCall(c, 'audio')}
                className="p-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-[#2A7B76] hover:text-white transition cursor-pointer shadow-2xs"
                title="Appel Audio"
              >
                <Phone className="h-4 w-4" />
              </button>
              <button
                onClick={() => onStartCall(c, 'video')}
                className="p-2 rounded-xl bg-teal-50 text-[#2A7B76] hover:bg-[#2A7B76] hover:text-white transition cursor-pointer shadow-2xs"
                title="Visioconférence HD"
              >
                <Video className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
