import React, { Suspense, lazy } from 'react';
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
  CompanyModuleConfig 
} from '../../types';
import ModuleSkeletonLoader from '../ModuleSkeletonLoader';

import AdminDashboardOverview from '../AdminDashboardOverview';
import EmployeePortal from '../EmployeePortal';
import PresencePanel from '../PresencePanel';
import PresenceStatisticsView from '../PresenceStatisticsView';
import TaskPanel from '../TaskPanel';
import ReminderPanel from '../ReminderPanel';
import SystemLogsPanel from '../SystemLogsPanel';
import CollaboratorPanel from '../CollaboratorPanel';
import ProfilePage from '../ProfilePage';

const DisciplinaryPanel = lazy(() => import('../DisciplinaryPanel'));
const DocumentGeneratorPanel = lazy(() => import('../DocumentGeneratorPanel'));
const CommunicationPanel = lazy(() => import('../CommunicationPanel'));
const FinancePanel = lazy(() => import('../FinancePanel'));
const InventoryPanel = lazy(() => import('../InventoryPanel'));
const PartnersPanel = lazy(() => import('../PartnersPanel'));
const UserManagementPanel = lazy(() => import('../UserManagementPanel'));
const CompanySettingsPanel = lazy(() => import('../CompanySettingsPanel'));
const TeamCallsPanel = lazy(() => import('../TeamCallsPanel').then((m) => ({ default: m.TeamCallsPanel })));
const RecruitmentPanel = lazy(() => import('../recruitment/RecruitmentPanel'));
const ExpenseClaimsPanel = lazy(() => import('../expenses/ExpenseClaimsPanel'));
const HsePanel = lazy(() => import('../hse/HsePanel'));
const VisitorsPanel = lazy(() => import('../visitors/VisitorsPanel'));
const IdeasSurveysPanel = lazy(() => import('../ideas/IdeasSurveysPanel'));

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
  onUpdateModuleConfig: (c: CompanyModuleConfig) => void;
  onOpenProfileModal: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  handleSetCurrentUser: (u: AppUser | null) => void;
}

export const AppTabRouter: React.FC<AppTabRouterProps> = (props) => {
  const {
    activeTab, setActiveTab, currentUser, employees, presences, tasks, reminders, notifications,
    salaryPayments, financialTransactions, salaryDebts, documents, disciplinaryIncidents,
    attendanceIncidents = [], onUpdateAttendanceIncidents, onAddAttendanceIncident,
    inventoryItems, partners, users, moduleConfig, selectedEmployeeId, setSelectedEmployeeId,
    currentTime, onUpdatePresences, onUpdateTasks, onUpdateReminders, onAddNotification,
    onUpdateNotifications, onUpdateEmployees, onUpdateSalaryDebts, onUpdateSalaryPayments,
    onUpdateFinancialTransactions, onUpdateDocuments, onUpdateDisciplinaryIncidents,
    onUpdateInventoryItems, onUpdatePartners, onUpdateUsers, onUpdateModuleConfig,
    onOpenProfileModal, showToast, handleSetCurrentUser,
  } = props;

  return (
    <Suspense fallback={<ModuleSkeletonLoader title={activeTab || 'Chargement...'} />}>
      {activeTab === 'dashboard' && (
        <AdminDashboardOverview
          currentUser={currentUser} employees={employees} presences={presences} tasks={tasks}
          reminders={reminders} currentTime={currentTime} onSelectTab={setActiveTab}
          onSelectEmployee={(id) => { setSelectedEmployeeId(id); setActiveTab('collaborators'); }}
        />
      )}
      {activeTab === 'employee_portal' && (
        <EmployeePortal
          currentUser={currentUser} employees={employees} presences={presences} tasks={tasks}
          salaryPayments={salaryPayments} financialTransactions={financialTransactions}
          salaryDebts={salaryDebts} onUpdatePresences={onUpdatePresences} onUpdateTasks={onUpdateTasks}
          onAddNotification={onAddNotification} currentTime={currentTime}
          onOpenProfileModal={onOpenProfileModal} moduleConfig={moduleConfig}
          attendanceIncidents={attendanceIncidents}
          onAddAttendanceIncident={onAddAttendanceIncident}
        />
      )}
      {activeTab === 'presences' && (
        <PresencePanel
          employees={employees} presences={presences} onUpdatePresences={onUpdatePresences}
          onAddNotification={onAddNotification}
          currentRole={currentUser?.role || 'Administrateur'}
          selectedEmployeeId={selectedEmployeeId}
          currentTime={currentTime}
          onSelectEmployee={(id) => { setSelectedEmployeeId(id); setActiveTab('collaborators'); }}
          onSelectTab={setActiveTab}
          currentUser={currentUser}
          showToast={showToast}
          moduleConfig={moduleConfig}
          attendanceIncidents={attendanceIncidents}
          onUpdateAttendanceIncidents={onUpdateAttendanceIncidents}
          onAddAttendanceIncident={onAddAttendanceIncident}
        />
      )}
      {activeTab === 'statistics' && (
        <PresenceStatisticsView
          employees={employees} presences={presences}
          onSelectEmployee={(id) => { setSelectedEmployeeId(id); setActiveTab('collaborators'); }}
        />
      )}
      {activeTab === 'tasks' && (
        <TaskPanel
          tasks={tasks}
          onUpdateTasks={onUpdateTasks}
          onAddNotification={onAddNotification}
          currentRole={currentUser?.role || 'Administrateur'}
          employees={employees}
          selectedEmployeeId={selectedEmployeeId}
          showToast={showToast}
          currentUser={currentUser}
        />
      )}
      {activeTab === 'reminders' && (
        <ReminderPanel
          reminders={reminders}
          onUpdateReminders={onUpdateReminders}
          currentTime={currentTime}
          employees={employees}
          currentRole={currentUser?.role}
          showToast={showToast}
        />
      )}
      {activeTab === 'logs' && (
        <SystemLogsPanel
          notifications={notifications}
          onUpdateNotifications={onUpdateNotifications}
          onAddNotification={onAddNotification}
          currentUser={currentUser!}
          employees={employees}
          users={users}
        />
      )}
      {activeTab === 'collaborators' && (
        <CollaboratorPanel
          employees={employees}
          presences={presences}
          tasks={tasks}
          salaryPayments={salaryPayments}
          salaryDebts={salaryDebts}
          onUpdateEmployees={onUpdateEmployees}
          onUpdatePresences={onUpdatePresences}
          onUpdateTasks={onUpdateTasks}
          onUpdateSalaryPayments={onUpdateSalaryPayments}
          onAddNotification={onAddNotification}
          showToast={showToast}
          users={users}
          onUpdateUsers={onUpdateUsers}
        />
      )}
      {activeTab === 'discipline' && (
        <DisciplinaryPanel
          incidents={disciplinaryIncidents}
          employees={employees}
          onUpdateIncidents={onUpdateDisciplinaryIncidents}
          onAddNotification={onAddNotification}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}
      {activeTab === 'documents' && (
        <DocumentGeneratorPanel
          employees={employees}
          documents={documents}
          onUpdateDocuments={onUpdateDocuments}
          setDocuments={onUpdateDocuments}
          onAddNotification={onAddNotification}
          showToast={showToast}
          currentUser={currentUser}
          currentRole={currentUser?.role || 'admin'}
          moduleConfig={moduleConfig}
        />
      )}
      {activeTab === 'communications' && (
        <CommunicationPanel employees={employees} onAddNotification={onAddNotification} showToast={showToast} />
      )}
      {activeTab === 'finances' && (
        <FinancePanel
          employees={employees} salaryPayments={salaryPayments} financialTransactions={financialTransactions}
          salaryDebts={salaryDebts} onUpdateSalaryPayments={onUpdateSalaryPayments} onUpdateFinancialTransactions={onUpdateFinancialTransactions}
          onUpdateSalaryDebts={onUpdateSalaryDebts} onAddNotification={onAddNotification} onSelectTab={setActiveTab} currentUser={currentUser}
        />
      )}
      {activeTab === 'inventory' && (
        <InventoryPanel inventoryItems={inventoryItems} employees={employees} onUpdateInventoryItems={onUpdateInventoryItems} onAddNotification={onAddNotification} showToast={showToast} />
      )}
      {activeTab === 'partners' && (
        <PartnersPanel partners={partners} onUpdatePartners={onUpdatePartners} onAddNotification={onAddNotification} showToast={showToast} />
      )}
      {activeTab === 'users' && (
        <UserManagementPanel users={users} onAddNotification={onAddNotification} currentUser={currentUser!} onUpdateUsers={onUpdateUsers} showToast={showToast} />
      )}
      {activeTab === 'settings' && (
        <CompanySettingsPanel moduleConfig={moduleConfig} onUpdateModuleConfig={onUpdateModuleConfig} onAddNotification={onAddNotification} showToast={showToast} />
      )}
      {activeTab === 'calls' && (
        <TeamCallsPanel
          employees={employees}
          users={users}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}
      {activeTab === 'recruitment' && (
        <RecruitmentPanel
          currentUser={currentUser}
          employees={employees}
          onAddNotification={onAddNotification}
          showToast={showToast}
          onUpdateEmployees={onUpdateEmployees}
        />
      )}
      {activeTab === 'expense_claims' && (
        <ExpenseClaimsPanel
          currentUser={currentUser}
          employees={employees}
          onAddNotification={onAddNotification}
          showToast={showToast}
        />
      )}
      {activeTab === 'hse' && (
        <HsePanel
          currentUser={currentUser}
          employees={employees}
          onAddNotification={onAddNotification}
          showToast={showToast}
        />
      )}
      {activeTab === 'visitors' && (
        <VisitorsPanel
          currentUser={currentUser}
          employees={employees}
          onAddNotification={onAddNotification}
          showToast={showToast}
        />
      )}
      {activeTab === 'ideas_surveys' && (
        <IdeasSurveysPanel
          currentUser={currentUser}
          employees={employees}
          onAddNotification={onAddNotification}
          showToast={showToast}
        />
      )}
      {activeTab === 'profile' && currentUser && (
        <ProfilePage
          currentUser={currentUser}
          onBackToDashboard={() => setActiveTab(currentUser.role === 'employé' ? 'employee_portal' : 'dashboard')}
          onLogout={() => handleSetCurrentUser(null)} onAddNotification={onAddNotification} showToast={showToast}
        />
      )}
    </Suspense>
  );
};
