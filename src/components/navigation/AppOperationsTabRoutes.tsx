import React from 'react';
import { DEFAULT_MODULE_CONFIG } from '../../types';
import ErrorBoundary from '../ErrorBoundary';
import ReminderPanel from '../ReminderPanel';
import SystemLogsPanel from '../SystemLogsPanel';
import CollaboratorPanel from '../CollaboratorPanel';
import UserManagementPanel from '../UserManagementPanel';
import ProfilePage from '../ProfilePage';
import {
  AppTabRouterProps,
  DisciplinaryPanel,
  DocumentGeneratorPanel,
  CommunicationPanel,
  FinancePanel,
  InventoryPanel,
  PartnersPanel,
  CompanySettingsPanel,
  TeamCallsPanel,
  RecruitmentPanel,
  ExpenseClaimsPanel,
  HsePanel,
  VisitorsPanel,
  IdeasSurveysPanel,
} from './appRouterLazyModules';

export const AppOperationsTabRoutes: React.FC<AppTabRouterProps> = ({
  activeTab, setActiveTab, currentUser, employees, presences, tasks, reminders, notifications,
  salaryPayments, financialTransactions, salaryDebts, documents, disciplinaryIncidents,
  inventoryItems, partners, users, moduleConfig, selectedEmployeeId,
  currentTime, onUpdatePresences, onUpdateTasks, onUpdateReminders, onAddNotification,
  onUpdateNotifications, onUpdateEmployees, onUpdateSalaryDebts, onUpdateSalaryPayments,
  onUpdateFinancialTransactions, onUpdateDocuments, onUpdateDisciplinaryIncidents,
  onUpdateInventoryItems, onUpdatePartners, onUpdateUsers, onUpdateModuleConfig,
  showToast, onUpdateUser, onLogout,
}) => {
  return (
    <>
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
          moduleConfig={moduleConfig}
          selectedEmployeeId={selectedEmployeeId}
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
          currentRole={(currentUser?.role || 'admin') as any}
          moduleConfig={moduleConfig}
        />
      )}
      {activeTab === 'communications' && (
        <CommunicationPanel employees={employees} currentRole={(currentUser?.role || 'admin') as any} onAddNotification={onAddNotification} showToast={showToast} />
      )}
      {activeTab === 'finances' && (
        <FinancePanel
          employees={employees} salaryPayments={salaryPayments} financialTransactions={financialTransactions}
          salaryDebts={salaryDebts} onUpdateSalaryPayments={onUpdateSalaryPayments} onUpdateFinancialTransactions={onUpdateFinancialTransactions}
          onUpdateSalaryDebts={onUpdateSalaryDebts} onAddNotification={onAddNotification} currentRole={(currentUser?.role || 'admin') as any} showToast={showToast}
        />
      )}
      {activeTab === 'inventory' && (
        <InventoryPanel inventoryItems={inventoryItems} employees={employees} onUpdateInventoryItems={onUpdateInventoryItems} onAddNotification={onAddNotification} showToast={showToast} />
      )}
      {activeTab === 'partners' && (
        <PartnersPanel partners={partners} onUpdatePartners={onUpdatePartners} onAddNotification={onAddNotification} showToast={showToast} currentRole={(currentUser?.role || 'admin') as any} />
      )}
      {activeTab === 'users' && (
        <UserManagementPanel
          users={users}
          onAddNotification={onAddNotification}
          currentUser={currentUser!}
          onUpdateUsers={onUpdateUsers}
          employees={employees}
          onUpdateEmployees={onUpdateEmployees}
          showToast={showToast}
        />
      )}
      {activeTab === 'settings' && (
        <ErrorBoundary>
          <CompanySettingsPanel moduleConfig={moduleConfig || DEFAULT_MODULE_CONFIG} onUpdateModuleConfig={onUpdateModuleConfig} onAddNotification={onAddNotification} showToast={showToast} />
        </ErrorBoundary>
      )}
      {activeTab === 'calls' && (
        <TeamCallsPanel employees={employees} users={users} currentUser={currentUser} showToast={showToast} />
      )}
      {activeTab === 'recruitment' && (
        <RecruitmentPanel currentUser={currentUser} employees={employees} onAddNotification={onAddNotification} showToast={showToast} onUpdateEmployees={onUpdateEmployees} />
      )}
      {activeTab === 'expense_claims' && (
        <ExpenseClaimsPanel currentUser={currentUser} employees={employees} onAddNotification={onAddNotification} showToast={showToast} />
      )}
      {activeTab === 'hse' && (
        <HsePanel currentUser={currentUser} employees={employees} onAddNotification={onAddNotification} showToast={showToast} />
      )}
      {activeTab === 'visitors' && (
        <VisitorsPanel currentUser={currentUser} employees={employees} onAddNotification={onAddNotification} showToast={showToast} />
      )}
      {activeTab === 'ideas_surveys' && (
        <IdeasSurveysPanel currentUser={currentUser} employees={employees} onAddNotification={onAddNotification} showToast={showToast} />
      )}
      {activeTab === 'profile' && currentUser && (
        <ProfilePage
          currentUser={currentUser}
          onBackToDashboard={() => setActiveTab(currentUser.role === 'employé' ? 'employee_portal' : 'dashboard')}
          onLogout={onLogout} onAddNotification={onAddNotification} showToast={showToast}
          onUpdateUser={onUpdateUser}
        />
      )}
    </>
  );
};
