import React from 'react';
import { Users, CheckSquare, Bell, AlertTriangle, Flag, Scale, CalendarDays, ShieldAlert } from 'lucide-react';
import { TabType } from '../Sidebar';

interface AdminDashboardKpiGridProps {
  presentCount: number;
  employeesCount: number;
  attendanceRate: number;
  lateCount: number;
  pendingTasksCount: number;
  activeProjectsCount: number;
  activeRemindersCount: number;
  pendingDisciplineCount: number;
  pendingLeavesCount: number;
  unreadNotificationsCount: number;
  onSelectTab: (tab: TabType) => void;
}

export const AdminDashboardKpiGrid: React.FC<AdminDashboardKpiGridProps> = ({
  presentCount,
  employeesCount,
  attendanceRate,
  lateCount,
  pendingTasksCount,
  activeProjectsCount,
  activeRemindersCount,
  pendingDisciplineCount,
  pendingLeavesCount,
  unreadNotificationsCount,
  onSelectTab,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Présences */}
      <div
        onClick={() => onSelectTab('presences')}
        className="glass-card-interactive p-5 rounded-2xl cursor-pointer flex flex-col justify-between space-y-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-300/60 hover:border-emerald-500 transition shadow-xs"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-emerald-900 font-extrabold uppercase tracking-wide">Présences du Jour</span>
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-800">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-stone-900">
            {presentCount} / {employeesCount}{' '}
            <span className="text-xs text-emerald-800 font-semibold font-sans">({attendanceRate}%)</span>
          </div>
        </div>
      </div>

      {/* 2. Anomalies & Retards */}
      <div
        onClick={() => onSelectTab('presences')}
        className="glass-card-interactive p-5 rounded-2xl cursor-pointer flex flex-col justify-between space-y-4 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-300/60 hover:border-amber-500 transition shadow-xs"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-amber-900 font-extrabold uppercase tracking-wide">Anomalies & Retards</span>
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-stone-900">{lateCount}</div>
        </div>
      </div>

      {/* 3. Tâches en Cours */}
      <div
        onClick={() => onSelectTab('tasks')}
        className="glass-card-interactive p-5 rounded-2xl cursor-pointer flex flex-col justify-between space-y-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-300/60 hover:border-blue-500 transition shadow-xs"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-blue-900 font-extrabold uppercase tracking-wide">Tâches en Cours</span>
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-800">
            <CheckSquare className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-stone-900">{pendingTasksCount}</div>
        </div>
      </div>

      {/* 4. Projets Stratégiques */}
      <div
        onClick={() => onSelectTab('projects')}
        className="glass-card-interactive p-5 rounded-2xl cursor-pointer flex flex-col justify-between space-y-4 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border border-indigo-300/60 hover:border-indigo-500 transition shadow-xs"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-indigo-900 font-extrabold uppercase tracking-wide">Projets Stratégiques</span>
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-800">
            <Flag className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-stone-900">{activeProjectsCount}</div>
        </div>
      </div>

      {/* 5. Alertes & Rappels */}
      <div
        onClick={() => onSelectTab('reminders')}
        className="glass-card-interactive p-5 rounded-2xl cursor-pointer flex flex-col justify-between space-y-4 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-300/60 hover:border-orange-500 transition shadow-xs"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-orange-900 font-extrabold uppercase tracking-wide">Alertes & Rappels</span>
          <div className="p-2 rounded-xl bg-orange-500/20 text-orange-800">
            <Bell className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-stone-900">{activeRemindersCount}</div>
        </div>
      </div>

      {/* 6. Conseil de Discipline */}
      <div
        onClick={() => onSelectTab('discipline')}
        className="glass-card-interactive p-5 rounded-2xl cursor-pointer flex flex-col justify-between space-y-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-300/60 hover:border-purple-500 transition shadow-xs"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-purple-900 font-extrabold uppercase tracking-wide">Conseil de Discipline</span>
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-800">
            <Scale className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-stone-900">{pendingDisciplineCount}</div>
        </div>
      </div>

      {/* 7. Congés & Permissions */}
      <div
        onClick={() => onSelectTab('leave_requests')}
        className="glass-card-interactive p-5 rounded-2xl cursor-pointer flex flex-col justify-between space-y-4 bg-gradient-to-br from-teal-500/10 to-teal-600/5 border border-teal-300/60 hover:border-teal-500 transition shadow-xs"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-teal-900 font-extrabold uppercase tracking-wide">Congés & Permissions</span>
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-800">
            <CalendarDays className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-stone-900">{pendingLeavesCount}</div>
        </div>
      </div>

      {/* 8. Notifications & Logs */}
      <div
        onClick={() => onSelectTab('logs')}
        className="glass-card-interactive p-5 rounded-2xl cursor-pointer flex flex-col justify-between space-y-4 bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-300/60 hover:border-rose-500 transition shadow-xs"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-rose-900 font-extrabold uppercase tracking-wide">Notifications</span>
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-800">
            <ShieldAlert className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-stone-900">{unreadNotificationsCount}</div>
        </div>
      </div>
    </div>
  );
};
