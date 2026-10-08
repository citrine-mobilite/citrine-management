import React from 'react';
import { Play, Coffee, RotateCcw, Home, CheckCircle2 } from 'lucide-react';
import { Employee, Presence } from '../../types';

interface KioskEmployeeCardProps {
  emp: Employee;
  todayPresence?: Presence;
  onClockAction: (emp: Employee, action: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure') => void;
}

export const KioskEmployeeCard: React.FC<KioskEmployeeCardProps> = ({
  emp,
  todayPresence,
  onClockAction,
}) => {
  return (
    <div className="p-3.5 bg-white rounded-2xl border border-stone-200 hover:border-[#2A7B76] transition shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-[#2A7B76]/10 text-[#2A7B76] font-bold text-sm flex items-center justify-center shrink-0 border border-[#2A7B76]/20 overflow-hidden">
          {emp.avatarUrl ? (
            <img src={emp.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>{emp.name.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-xs text-stone-900 truncate">{emp.name}</h4>
          <p className="text-[10px] text-stone-500 truncate">
            {emp.department || 'Général'} • {emp.roleType || 'Employé'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
        {/* Arrivée */}
        <button
          onClick={() => onClockAction(emp, 'arrival')}
          disabled={Boolean(todayPresence?.arrivalTime)}
          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 transition cursor-pointer ${
            todayPresence?.arrivalTime
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
          }`}
        >
          {todayPresence?.arrivalTime ? <CheckCircle2 className="h-3 w-3" /> : <Play className="h-3 w-3 fill-white" />}
          <span>{todayPresence?.arrivalTime || 'Arrivée'}</span>
        </button>

        {/* Pause */}
        <button
          onClick={() => onClockAction(emp, 'pauseStart')}
          disabled={Boolean(todayPresence?.pauseStart)}
          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 transition cursor-pointer ${
            todayPresence?.pauseStart
              ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed'
              : 'bg-amber-600 hover:bg-amber-700 text-white shadow-2xs'
          }`}
        >
          {todayPresence?.pauseStart ? <CheckCircle2 className="h-3 w-3" /> : <Coffee className="h-3 w-3" />}
          <span>{todayPresence?.pauseStart || 'Pause'}</span>
        </button>

        {/* Reprise */}
        <button
          onClick={() => onClockAction(emp, 'pauseEnd')}
          disabled={Boolean(todayPresence?.pauseEnd)}
          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 transition cursor-pointer ${
            todayPresence?.pauseEnd
              ? 'bg-teal-50 text-teal-700 border border-teal-200 cursor-not-allowed'
              : 'bg-teal-600 hover:bg-teal-700 text-white shadow-2xs'
          }`}
        >
          {todayPresence?.pauseEnd ? <CheckCircle2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}
          <span>{todayPresence?.pauseEnd || 'Reprise'}</span>
        </button>

        {/* Départ */}
        <button
          onClick={() => onClockAction(emp, 'departure')}
          disabled={Boolean(todayPresence?.departureTime)}
          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 transition cursor-pointer ${
            todayPresence?.departureTime
              ? 'bg-[#2A7B76]/10 text-[#2A7B76] border border-[#2A7B76]/30 cursor-not-allowed'
              : 'bg-[#2A7B76] hover:bg-[#20635F] text-white shadow-2xs'
          }`}
        >
          {todayPresence?.departureTime ? <CheckCircle2 className="h-3 w-3" /> : <Home className="h-3 w-3" />}
          <span>{todayPresence?.departureTime || 'Départ'}</span>
        </button>
      </div>
    </div>
  );
};
