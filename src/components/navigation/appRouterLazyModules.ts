import { lazy } from 'react';
import { TabType } from '../Sidebar';
import {
  AppUser,
  Employee,
  Presence,
  Task,
  Reminder,
  NotificationLog,
  SalaryPayment,
  FinancialTransaction,
  EmployeeSalaryDebt,
  GeneratedDocument,
  DisciplinaryIncident,
  AttendanceIncident,
  InventoryItem,
  Partner,
  CompanyModuleConfig,
  LeaveRequest,
  StrategicProject,
} from '../../types';

export const LeaveManagementPanel = lazy(() => import('../LeaveManagementPanel'));
export const DisciplinaryPanel = lazy(() => import('../DisciplinaryPanel'));
export const DocumentGeneratorPanel = lazy(() => import('../DocumentGeneratorPanel'));
export const CommunicationPanel = lazy(() => import('../CommunicationPanel'));
export const FinancePanel = lazy(() => import('../FinancePanel'));
export const InventoryPanel = lazy(() => import('../InventoryPanel'));
export const PartnersPanel = lazy(() => import('../PartnersPanel'));
export const CompanySettingsPanel = lazy(() => import('../CompanySettingsPanel'));
export const TeamCallsPanel = lazy(() => import('../TeamCallsPanel'));
export const RecruitmentPanel = lazy(() => import('../recruitment/RecruitmentPanel'));
export const ExpenseClaimsPanel = lazy(() => import('../expenses/ExpenseClaimsPanel'));
export const HsePanel = lazy(() => import('../hse/HsePanel'));
export const VisitorsPanel = lazy(() => import('../visitors/VisitorsPanel'));
export const IdeasSurveysPanel = lazy(() => import('../ideas/IdeasSurveysPanel'));
export const StrategicProjectsPanel = lazy(() => import('../projects/StrategicProjectsPanel'));

export const VALID_ROUTER_TABS: TabType[] = [
  'dashboard', 'employee_portal', 'presences', 'leave_requests', 'statistics', 'projects', 'tasks',
  'reminders', 'logs', 'collaborators', 'discipline', 'documents',
  'communications', 'finances', 'inventory', 'partners', 'users',
  'settings', 'calls', 'recruitment', 'expense_claims', 'hse',
  'visitors', 'ideas_surveys', 'profile',
];

export interface AppTabRouterProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  currentUser: AppUser | null;
  employees: Employee[];
  presences: Presence[];
  tasks: Task[];
  reminders: Reminder[];
  notifications: NotificationLog[];
  salaryPayments: SalaryPayment[];
  financialTransactions: FinancialTransaction[];
  salaryDebts: EmployeeSalaryDebt[];
  documents: GeneratedDocument[];
  disciplinaryIncidents: DisciplinaryIncident[];
  attendanceIncidents?: AttendanceIncident[];
  inventoryItems: InventoryItem[];
  partners: Partner[];
  users: AppUser[];
  moduleConfig: CompanyModuleConfig;
  selectedEmployeeId: string;
  setSelectedEmployeeId: (id: string) => void;
  currentTime: string;
  employeeInitialSubTab?: string;
  onUpdatePresences: (p: Presence[]) => void;
  onUpdateTasks: (t: Task[]) => void;
  onUpdateReminders: (r: Reminder[]) => void;
  onAddNotification: (n: any) => void;
  onUpdateNotifications: (n: NotificationLog[]) => void;
  onUpdateEmployees: (e: Employee[]) => void;
  onUpdateSalaryDebts: (d: EmployeeSalaryDebt[]) => void;
  onUpdateSalaryPayments: (p: SalaryPayment[]) => void;
  onUpdateFinancialTransactions: (t: FinancialTransaction[]) => void;
  onUpdateDocuments: (d: GeneratedDocument[]) => void;
  onUpdateDisciplinaryIncidents: (i: DisciplinaryIncident[]) => void;
  onUpdateAttendanceIncidents?: (i: AttendanceIncident[]) => void;
  onAddAttendanceIncident?: (i: AttendanceIncident) => void;
  onUpdateInventoryItems: (i: InventoryItem[]) => void;
  onUpdatePartners: (p: Partner[]) => void;
  onUpdateUsers: (u: AppUser[]) => void;
  onUpdateModuleConfig: (c: CompanyModuleConfig) => Promise<void> | void;
  onOpenProfileModal: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  handleSetCurrentUser: (u: AppUser | null) => void;
  onLogout: () => void;
  onUpdateUser?: (updated: AppUser) => void;
  leaveRequests?: LeaveRequest[];
  onUpdateLeaveRequests?: (leaves: LeaveRequest[]) => void;
  strategicProjects?: StrategicProject[];
  onUpdateStrategicProjects?: (projects: StrategicProject[]) => void;
  todayTasksCount?: number;
  todayProjectsCount?: number;
  pendingDisciplineCount?: number;
  pendingLeavesCount?: number;
  unreadNotificationsCount?: number;
  pendingPresencesRequestsCount?: number;
}
