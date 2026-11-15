import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import {
  Employee,
  Presence,
  Task,
  Reminder,
  AppUser,
  StrategicProject,
  CompanyModuleConfig,
} from '../types';
import { TabType } from './Sidebar';
import { HumaanDashboardHero } from './illustrations/HumaanIllustrations';
import { ProjectMilestonesWidget } from './projects/ProjectMilestonesWidget';
import { HomeExpirationAlertsBanner } from './reminders';
import { useAdminDashboardLogic } from './dashboard/useAdminDashboardLogic';
import { AdminDashboardKpiGrid } from './dashboard/AdminDashboardKpiGrid';
import { AdminDashboardTodayClockingsCard } from './dashboard/AdminDashboardTodayClockingsCard';
import { AdminDashboardBottomWidgets } from './dashboard/AdminDashboardBottomWidgets';

interface AdminDashboardOverviewProps {
  currentUser: AppUser | null;
  employees: Employee[];
  presences: Presence[];
  tasks: Task[];
  reminders: Reminder[];
  onUpdateReminders?: (updated: Reminder[]) => void;
  currentTime?: string;
  onSelectTab: (tab: TabType) => void;
  onSelectEmployee: (id: string) => void;
  strategicProjects?: StrategicProject[];
  onUpdateStrategicProjects?: (projects: StrategicProject[]) => void;
  moduleConfig?: CompanyModuleConfig;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

export default function AdminDashboardOverview({
  currentUser,
  employees = [],
  presences = [],
  tasks = [],
  reminders = [],
  onUpdateReminders,
  onSelectTab,
  onSelectEmployee,
  strategicProjects = [],
  onUpdateStrategicProjects,
  moduleConfig,
  showToast,
}: AdminDashboardOverviewProps) {
  const logic = useAdminDashboardLogic({
    employees,
    presences,
    tasks,
    reminders,
    onUpdateReminders,
    showToast,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-[#2A7B76] via-[#216762] to-[#164844] rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-emerald-600/30 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-1/4 -mt-12 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs text-emerald-100 font-semibold shadow-2xs">
            <LayoutDashboard className="h-3.5 w-3.5 text-[#F3D079]" />
            <span>Espace Direction & Pilotage Opérationnel</span>
          </div>
          <div>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-tight">
              Bonjour, {currentUser?.name || 'Administrateur'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="inline-flex items-center gap-3 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-xs font-mono font-bold shadow-2xs">
              <span className="text-emerald-200">🕒 {logic.realTime}</span>
              <span className="text-white/40">|</span>
              <span className="text-emerald-100 font-sans font-semibold text-[11px]">
                {logic.presentCount} collaborateur{logic.presentCount > 1 ? 's' : ''} en poste
              </span>
            </div>
            <button
              onClick={() => onSelectTab('presences')}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold backdrop-blur-md border border-white/20 transition cursor-pointer active:scale-95"
            >
              Voir les Présences
            </button>
            <button
              onClick={() => onSelectTab('tasks')}
              className="px-3 py-1.5 bg-[#D4A82F] hover:bg-[#c49826] text-stone-900 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
            >
              Gérer les Tâches
            </button>
          </div>
        </div>

        <div className="shrink-0 z-10 flex items-center justify-center">
          <HumaanDashboardHero className="w-56 h-36 sm:w-64 sm:h-40 drop-shadow-md" />
        </div>
      </div>

      {moduleConfig?.enableReminders !== false && (
        <HomeExpirationAlertsBanner
          reminders={reminders}
          employees={employees}
          onRenewOrResolve={onUpdateReminders ? logic.handleRenewOrResolveFromHome : undefined}
          onOpenRemindersModule={() => onSelectTab('reminders')}
        />
      )}

      <AdminDashboardKpiGrid
        presentCount={logic.presentCount}
        employeesCount={employees.length}
        attendanceRate={logic.attendanceRate}
        lateCount={logic.lateCount}
        pendingTasksCount={logic.pendingTasks.length}
        activeRemindersCount={logic.activeRemindersCount}
        totalRemindersCount={reminders.length}
        onSelectTab={onSelectTab}
      />

      {moduleConfig?.enableStrategicProjects !== false && (
        <ProjectMilestonesWidget
          projects={strategicProjects}
          onUpdateProjects={onUpdateStrategicProjects}
          currentUser={currentUser}
          employees={employees}
          showToast={showToast ? (msg, type) => showToast(msg, type === 'error' ? 'error' : 'success') : undefined}
        />
      )}

      <div className="space-y-6">
        <AdminDashboardTodayClockingsCard
          clockableEmployees={logic.clockableEmployees}
          todayPresences={logic.todayPresences}
          onSelectTab={onSelectTab}
          onSelectEmployee={onSelectEmployee}
        />

        <AdminDashboardBottomWidgets
          sortedReminders={logic.sortedReminders}
          activeRemindersCount={logic.activeRemindersCount}
          pendingTasks={logic.pendingTasks}
          onSelectTab={onSelectTab}
        />
      </div>
    </div>
  );
}
