import React from 'react';
import { Users, UserCheck, Clock, ListTodo } from 'lucide-react';
import { TabType } from '../Sidebar';

interface DashboardKPICardsProps {
  totalEmployees: number;
  presentCount: number;
  lateCount: number;
  pendingTasksCount: number;
  onSelectTab: (tab: TabType) => void;
}

export const DashboardKPICards: React.FC<DashboardKPICardsProps> = ({
  totalEmployees,
  presentCount,
  lateCount,
  pendingTasksCount,
  onSelectTab,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Total Collaborateurs */}
      <div
        onClick={() => onSelectTab('collaborators')}
        className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-3xs hover:border-[#2A7B76] hover:shadow-sm transition cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Équipe</span>
          <div className="w-7 h-7 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 group-hover:bg-[#2A7B76]/10 group-hover:text-[#2A7B76] transition">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-stone-900">{totalEmployees}</div>
        <span className="text-[11px] text-stone-500 font-medium">Collaborateurs enregistrés</span>
      </div>

      {/* Présents Aujourd'hui */}
      <div
        onClick={() => onSelectTab('presences')}
        className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-3xs hover:border-emerald-500 hover:shadow-sm transition cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Présents</span>
          <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
            <UserCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-emerald-700">{presentCount}</div>
        <span className="text-[11px] text-emerald-600 font-medium">Pointages validés ce jour</span>
      </div>

      {/* Retards Consignés */}
      <div
        onClick={() => onSelectTab('presences')}
        className="bg-white p-4 rounded-2xl border border-amber-100 shadow-3xs hover:border-amber-500 hover:shadow-sm transition cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Retards</span>
          <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-amber-600">{lateCount}</div>
        <span className="text-[11px] text-amber-700 font-medium">Arrivées tardives</span>
      </div>

      {/* Tâches En Cours */}
      <div
        onClick={() => onSelectTab('tasks')}
        className="bg-white p-4 rounded-2xl border border-teal-100 shadow-3xs hover:border-[#2A7B76] hover:shadow-sm transition cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-[#2A7B76] font-bold uppercase tracking-wider">Tâches</span>
          <div className="w-7 h-7 rounded-xl bg-teal-50 flex items-center justify-center text-[#2A7B76] group-hover:bg-[#2A7B76] group-hover:text-white transition">
            <ListTodo className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-[#2A7B76]">{pendingTasksCount}</div>
        <span className="text-[11px] text-stone-500 font-medium">Activités en cours</span>
      </div>
    </div>
  );
};
