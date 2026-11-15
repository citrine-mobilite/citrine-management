import React, { useEffect } from 'react';
import { Clock, Calendar, CheckSquare, AlertTriangle, Bell, Compass } from 'lucide-react';
import {
  AppUser,
  Employee,
  Presence,
  Task,
  SalaryPayment,
  FinancialTransaction,
  EmployeeSalaryDebt,
  NotificationLog,
  CompanyModuleConfig,
  AttendanceIncident,
  LeaveRequest,
  Reminder,
  StrategicProject,
} from '../types';
import { useEmployeePortalLogic } from './employee/useEmployeePortalLogic';
import { appBadgeService } from '../utils/appBadgeService';
import { EmployeeHeroBanner } from './employee/EmployeeHeroBanner';
import { EmployeePortalTabContent } from './employee/EmployeePortalTabContent';
import { EmployeePortalModals } from './employee/EmployeePortalModals';

interface EmployeePortalProps {
  currentUser: AppUser | null;
  employees: Employee[];
  presences: Presence[];
  tasks: Task[];
  salaryPayments: SalaryPayment[];
  financialTransactions: FinancialTransaction[];
  salaryDebts?: EmployeeSalaryDebt[];
  onUpdatePresences: (updated: Presence[]) => void;
  onUpdateTasks: (updated: Task[]) => void;
  onAddNotification: (log: NotificationLog) => void;
  currentTime: string;
  onOpenProfileModal?: () => void;
  moduleConfig?: CompanyModuleConfig;
  attendanceIncidents?: AttendanceIncident[];
  onAddAttendanceIncident?: (incident: AttendanceIncident) => void;
  notifications?: NotificationLog[];
  onUpdateNotifications?: (logs: NotificationLog[]) => void;
  reminders?: Reminder[];
  onUpdateReminders?: (updated: Reminder[]) => void;
  leaveRequests?: LeaveRequest[];
  onUpdateLeaveRequests?: (leaves: LeaveRequest[]) => void;
  onUpdateEmployees?: (employees: Employee[]) => void;
  onUpdateUsers?: (users: AppUser[]) => void;
  users?: AppUser[];
  initialSubTab?: string;
  onUpdateUser?: (updated: AppUser) => void;
  onLogout?: () => void;
  showToast?: (titleOrMessage: string, descOrType?: any, type?: any) => void;
  strategicProjects?: StrategicProject[];
  onUpdateStrategicProjects?: (projects: StrategicProject[]) => void;
}

const formatXAF = (amount: number = 0) => `${amount.toLocaleString('fr-FR')} FCFA`;

export default function EmployeePortal(props: EmployeePortalProps) {
  const {
    currentUser,
    tasks,
    onUpdateTasks,
    onAddNotification,
    onOpenProfileModal,
    moduleConfig,
  } = props;

  const logic = useEmployeePortalLogic(props);

  const isAssignedToMe = (t: Task) => {
    const assignedField = (t.assignedTo || '').toLowerCase();
    const myName = (logic.employeeProfile.name || '').toLowerCase();
    const myId = (logic.employeeProfile.id || '').toLowerCase();
    const myEmail = (logic.employeeProfile.email || '').toLowerCase();
    const currentName = (currentUser?.name || '').toLowerCase();
    const currentId = (currentUser?.id || '').toLowerCase();
    if (assignedField.includes('équipe') || assignedField.includes('equipe') || assignedField.includes('tous')) {
      return true;
    }
    const parts = assignedField.split(',').map((p) => p.trim());
    return (
      parts.some(
        (p) =>
          (myName && p === myName) ||
          (myId && p === myId) ||
          (myEmail && p === myEmail) ||
          (currentName && p === currentName) ||
          (currentId && p === currentId)
      ) ||
      Boolean(t.employeeId && (t.employeeId === logic.employeeProfile.id || t.employeeId === currentUser?.id))
    );
  };

  const pendingTasksCount = tasks.filter((t) => isAssignedToMe(t) && t.status !== 'completed').length;
  const totalBadgeCount = (logic.unreadAlertsCount || 0) + pendingTasksCount;

  useEffect(() => {
    appBadgeService.updateBadge(totalBadgeCount);
  }, [totalBadgeCount]);

  const tabs = [
    moduleConfig?.enablePresences !== false && { id: 'clocking', label: 'Pointage Direct', icon: Clock, badge: undefined },
    moduleConfig?.enablePresences !== false && { id: 'presences', label: 'Mes Pointages', icon: Calendar, badge: undefined },
    moduleConfig?.enablePresences !== false && {
      id: 'leaves',
      label: 'Missions & Congés',
      icon: Compass,
      badge:
        (props.leaveRequests || []).filter(
          (l) =>
            (l.employeeId === logic.employeeProfile.id || l.employeeEmail === logic.employeeProfile.email) &&
            l.status === 'pending'
        ).length || undefined,
    },
    moduleConfig?.enablePresences !== false && { id: 'incidents', label: 'Signalements', icon: AlertTriangle, badge: logic.myIncidents.length },
    moduleConfig?.enableTasks !== false && { id: 'tasks', label: 'Mes Tâches', icon: CheckSquare, badge: pendingTasksCount || undefined },
    moduleConfig?.enableReminders !== false && {
      id: 'alerts',
      label: 'Mes Alertes',
      icon: Bell,
      badge: logic.unreadAlertsCount > 0 ? logic.unreadAlertsCount : undefined,
    },
  ].filter(Boolean);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <EmployeeHeroBanner
        employeeProfile={logic.employeeProfile}
        currentUser={currentUser}
        todayPresence={logic.todayPresence}
        onOpenProfileModal={onOpenProfileModal}
        calculateTenure={logic.calculateTenure}
      />

      <div className="flex items-center gap-2 overflow-x-auto p-1.5 glass-card rounded-2xl">
        {tabs.map((tab: any) => {
          const TabIcon = tab.icon;
          const isActive = logic.activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => logic.setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-98 ${
                isActive
                  ? 'bg-[#2A7B76] text-white shadow-xs ring-2 ring-emerald-200/50'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
              }`}
              title={`Accéder à l'onglet ${tab.label}`}
            >
              <TabIcon className={`h-4 w-4 ${isActive ? 'text-emerald-200' : 'text-stone-400'}`} />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-white text-[#2A7B76]'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <EmployeePortalTabContent
        logic={logic}
        currentUser={currentUser}
        employees={props.employees}
        presences={props.presences}
        tasks={tasks}
        onUpdateTasks={onUpdateTasks}
        onAddNotification={onAddNotification}
        moduleConfig={moduleConfig}
        attendanceIncidents={props.attendanceIncidents}
        notifications={props.notifications}
        onUpdateNotifications={props.onUpdateNotifications}
        reminders={props.reminders}
        onUpdateReminders={props.onUpdateReminders}
        leaveRequests={props.leaveRequests}
        onUpdateLeaveRequests={props.onUpdateLeaveRequests}
        onUpdateEmployees={props.onUpdateEmployees}
        onUpdateUsers={props.onUpdateUsers}
        users={props.users}
        showToast={props.showToast}
        strategicProjects={props.strategicProjects}
        onUpdateStrategicProjects={props.onUpdateStrategicProjects}
      />

      <EmployeePortalModals
        logic={logic}
        currentUser={currentUser}
        moduleConfig={moduleConfig}
        formatXAF={formatXAF}
      />
    </div>
  );
}
