import React from 'react';
import { UserCheck, Clock, AlertCircle, Calendar } from 'lucide-react';
import { Presence } from '../../types';

interface PresenceStatsCardsProps {
  presences: Presence[];
}

export const PresenceStatsCards: React.FC<PresenceStatsCardsProps> = ({ presences }) => {
  const total = presences.length;
  const present = presences.filter((p) => p.status === 'present').length;
  const late = presences.filter((p) => p.status === 'late').length;
  const absent = presences.filter((p) => p.status === 'absent').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Total Enregistrements</span>
          <Calendar className="h-4 w-4 text-[#2A7B76]" />
        </div>
        <p className="text-xl font-bold text-stone-900 mt-1">{total}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Presents & Ponctuels</span>
          <UserCheck className="h-4 w-4 text-emerald-600" />
        </div>
        <p className="text-xl font-bold text-emerald-700 mt-1">{present}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Retards</span>
          <Clock className="h-4 w-4 text-amber-600" />
        </div>
        <p className="text-xl font-bold text-amber-700 mt-1">{late}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Absences</span>
          <AlertCircle className="h-4 w-4 text-rose-600" />
        </div>
        <p className="text-xl font-bold text-rose-700 mt-1">{absent}</p>
      </div>
    </div>
  );
};
