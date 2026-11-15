import React from 'react';
import { Users, CheckSquare, Bell, AlertTriangle } from 'lucide-react';
import { TabType } from '../Sidebar';

interface AdminDashboardKpiGridProps {
  presentCount: number;
  employeesCount: number;
  attendanceRate: number;
  lateCount: number;
  pendingTasksCount: number;
  activeRemindersCount: number;
  totalRemindersCount: number;
  onSelectTab: (tab: TabType) => void;
}

export const AdminDashboardKpiGrid: React.FC<AdminDashboardKpiGridProps> = ({
  presentCount,
  employeesCount,
  attendanceRate,
  lateCount,
  pendingTasksCount,
  activeRemindersCount,
  totalRemindersCount,
  onSelectTab,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        onClick={() => onSelectTab('presences')}
        className="glass-card-interactive p-5 rounded-2xl cursor-pointer flex flex-col justify-between space-y-4 hover:border-emerald-300"
        title="Afficher le registre des présences et la feuille du jour"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wide">Présences du Jour</span>
          <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-700">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold text-stone-900">
            {presentCount} / {employeesCount}{' '}
            <span className="text-xs text-emerald-700 font-semibold">({attendanceRate}%)</span>
          </div>
          <div className="w-full bg-stone-200/60 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-[#2A7B76] h-full rounded-full transition-all duration-500"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>
      </div>

      <div
        onClick={() => onSelectTab('presences')}
        className="glass-card-interactive p-5 rounded-2xl cursor-pointer flex flex-col justify-between space-y-4 hover:border-amber-300"
        title="Consulter les anomalies et retards consignés"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wide">Anomalies & Retards</span>
          <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-700">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold text-stone-900">{lateCount}</div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectTab('statistics');
            }}
            className="text-[11px] text-[#2A7B76] font-bold hover:underline mt-2 inline-flex items-center gap-1 cursor-pointer"
            title="Voir l'analyse détaillée d'assiduité"
          >
            Analyse d&apos;assiduité &gt;
          </button>
        </div>
      </div>

      <div
        onClick={() => onSelectTab('tasks')}
        className="glass-card-interactive p-5 rounded-2xl cursor-pointer flex flex-col justify-between space-y-4 hover:border-blue-300"
        title="Ouvrir le module de gestion des tâches"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wide">Tâches en Cours</span>
          <div className="p-1.5 rounded-xl bg-blue-500/15 text-blue-700">
            <CheckSquare className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold text-stone-900">{pendingTasksCount}</div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectTab('tasks');
            }}
            className="text-[11px] text-[#2A7B76] font-bold hover:underline mt-2 inline-flex items-center gap-1 cursor-pointer"
          >
            Tableau des tâches &gt;
          </button>
        </div>
      </div>

      <div
        onClick={() => onSelectTab('reminders')}
        className={`glass-card-interactive p-5 rounded-2xl cursor-pointer flex flex-col justify-between space-y-4 ${
          activeRemindersCount > 0 ? 'hover:border-amber-300' : 'hover:border-emerald-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wide">
            Échéances à traiter
          </span>
          <div
            className={`p-1.5 rounded-xl ${
              activeRemindersCount > 0 ? 'bg-amber-500/15 text-amber-700' : 'bg-emerald-500/15 text-emerald-700'
            }`}
          >
            <Bell className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold font-mono tabular-nums text-stone-900">
            {activeRemindersCount}
            <span className="text-xs font-sans font-semibold text-stone-400 ml-1.5">
              / {totalRemindersCount} suivi{totalRemindersCount > 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectTab('reminders');
            }}
            className="text-[11px] text-[#2A7B76] font-bold hover:underline mt-2 inline-flex items-center gap-1 cursor-pointer"
          >
            Consulter les échéances &gt;
          </button>
        </div>
      </div>
    </div>
  );
};
