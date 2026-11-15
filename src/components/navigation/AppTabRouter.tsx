import React, { Suspense } from 'react';
import ModuleSkeletonLoader from '../ModuleSkeletonLoader';
import AdminDashboardOverview from '../AdminDashboardOverview';
import EmployeePortal from '../EmployeePortal';
import PresencePanel from '../PresencePanel';
import PresenceStatisticsView from '../PresenceStatisticsView';
import TaskPanel from '../TaskPanel';
import { Error404Page, Error403Page } from '../errors';
import { canAccessTab } from '../../services/sessionService';
import { taskService } from '../../services/taskService';
import {
  AppTabRouterProps,
  VALID_ROUTER_TABS,
  LeaveManagementPanel,
  StrategicProjectsPanel,
} from './appRouterLazyModules';
import { AppOperationsTabRoutes } from './AppOperationsTabRoutes';

export type { AppTabRouterProps };

export const AppTabRouter: React.FC<AppTabRouterProps> = (props) => {
  const {
    activeTab, setActiveTab, currentUser, employees, presences, tasks, reminders,
    salaryPayments, financialTransactions, salaryDebts,
    attendanceIncidents = [], onUpdateAttendanceIncidents, onAddAttendanceIncident,
    users, moduleConfig, selectedEmployeeId, setSelectedEmployeeId,
    currentTime, employeeInitialSubTab, onUpdatePresences, onUpdateTasks, onUpdateReminders, onAddNotification,
    onUpdateNotifications, onUpdateEmployees, onUpdateUsers, onUpdateModuleConfig,
    onOpenProfileModal, showToast, onUpdateUser, onLogout,
    leaveRequests = [], onUpdateLeaveRequests,
    strategicProjects = [], onUpdateStrategicProjects, notifications,
  } = props;

  const isUnauthorized = Boolean(
    currentUser &&
      activeTab &&
      activeTab !== 'profile' &&
      activeTab !== 'employee_portal' &&
      VALID_ROUTER_TABS.includes(activeTab) &&
      !canAccessTab(currentUser.role, activeTab)
  );

  const isNotFound = Boolean(activeTab && !VALID_ROUTER_TABS.includes(activeTab));

  return (
    <Suspense fallback={<ModuleSkeletonLoader title={activeTab || 'Chargement...'} />}>
      {isUnauthorized && (
        <Error403Page
          currentUser={currentUser}
          onNavigate={setActiveTab}
          attemptedTab={activeTab}
          requiredRole="Administrateur ou Responsable"
        />
      )}

      {isNotFound && !isUnauthorized && (
        <Error404Page
          currentUser={currentUser}
          onNavigate={setActiveTab}
          attemptedTab={activeTab}
        />
      )}

      {!isUnauthorized && !isNotFound && activeTab === 'dashboard' && (
        <AdminDashboardOverview
          currentUser={currentUser} employees={employees} presences={presences} tasks={tasks}
          reminders={reminders} currentTime={currentTime} onSelectTab={setActiveTab}
          onSelectEmployee={(id) => { setSelectedEmployeeId(id); setActiveTab('collaborators'); }}
          onUpdateReminders={onUpdateReminders}
          strategicProjects={strategicProjects}
          onUpdateStrategicProjects={onUpdateStrategicProjects}
          moduleConfig={moduleConfig}
          showToast={showToast}
        />
      )}

      {activeTab === 'leave_requests' && (
        <LeaveManagementPanel
          leaveRequests={leaveRequests}
          employees={employees}
          currentUser={currentUser}
          users={users}
          onUpdateLeaveRequests={onUpdateLeaveRequests}
          onUpdateEmployees={onUpdateEmployees}
          onUpdateUsers={onUpdateUsers}
          onAddNotification={onAddNotification}
          showToast={(title, desc, type) => showToast(`${title} : ${desc}`, type === 'warning' ? 'error' : 'success')}
          moduleConfig={moduleConfig}
        />
      )}

      {activeTab === 'employee_portal' && (
        <EmployeePortal
          currentUser={currentUser} employees={employees} presences={presences} tasks={tasks}
          salaryPayments={salaryPayments} financialTransactions={financialTransactions}
          salaryDebts={salaryDebts} onUpdatePresences={onUpdatePresences} onUpdateTasks={onUpdateTasks}
          onAddNotification={onAddNotification} currentTime={currentTime}
          reminders={reminders}
          onUpdateReminders={onUpdateReminders}
          notifications={notifications}
          onUpdateNotifications={onUpdateNotifications}
          onOpenProfileModal={onOpenProfileModal} moduleConfig={moduleConfig}
          attendanceIncidents={attendanceIncidents}
          onAddAttendanceIncident={onAddAttendanceIncident}
          initialSubTab={employeeInitialSubTab}
          leaveRequests={leaveRequests}
          onUpdateLeaveRequests={onUpdateLeaveRequests}
          onUpdateEmployees={onUpdateEmployees}
          onUpdateUsers={onUpdateUsers}
          users={users}
          onUpdateUser={onUpdateUser}
          onLogout={onLogout}
          showToast={showToast}
          strategicProjects={strategicProjects}
          onUpdateStrategicProjects={onUpdateStrategicProjects}
        />
      )}

      {activeTab === 'presences' && (
        <PresencePanel
          employees={employees} presences={presences} onUpdatePresences={onUpdatePresences}
          onAddNotification={onAddNotification}
          currentRole={(currentUser?.role || 'Administrateur') as any}
          selectedEmployeeId={selectedEmployeeId}
          currentTime={currentTime}
          onSelectEmployee={(id) => { setSelectedEmployeeId(id); setActiveTab('collaborators'); }}
          onSelectTab={setActiveTab}
          currentUser={currentUser}
          showToast={showToast}
          moduleConfig={moduleConfig}
          onUpdateModuleConfig={onUpdateModuleConfig}
          attendanceIncidents={attendanceIncidents}
          onUpdateAttendanceIncidents={onUpdateAttendanceIncidents}
          onAddAttendanceIncident={onAddAttendanceIncident}
        />
      )}

      {activeTab === 'statistics' && (
        <PresenceStatisticsView
          employees={employees}
          presences={presences}
          tasks={tasks}
          incidents={attendanceIncidents}
          currentUser={currentUser}
          currentRole={currentUser?.role}
          onSelectEmployee={(id) => { setSelectedEmployeeId(id); setActiveTab('collaborators'); }}
          onUpdateTask={async (updatedTask) => {
            await taskService.saveTask(updatedTask);
            const updated = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
            onUpdateTasks(updated);
          }}
          showToast={showToast}
        />
      )}

      {activeTab === 'projects' && (
        <StrategicProjectsPanel
          projects={strategicProjects}
          onUpdateProjects={onUpdateStrategicProjects}
          currentUser={currentUser}
          employees={employees}
          showToast={(msg, type) => showToast(msg, type === 'error' ? 'error' : 'success')}
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

      <AppOperationsTabRoutes {...props} />

      {!activeTab && (
        currentUser?.role === 'employé' ? (
          <EmployeePortal
            currentUser={currentUser} employees={employees} presences={presences} tasks={tasks}
            salaryPayments={salaryPayments} financialTransactions={financialTransactions}
            salaryDebts={salaryDebts} onUpdatePresences={onUpdatePresences} onUpdateTasks={onUpdateTasks}
            onAddNotification={onAddNotification} currentTime={currentTime}
            onOpenProfileModal={onOpenProfileModal} moduleConfig={moduleConfig}
            attendanceIncidents={attendanceIncidents}
            onAddAttendanceIncident={onAddAttendanceIncident}
            initialSubTab={employeeInitialSubTab}
            showToast={showToast}
            onUpdateUser={onUpdateUser}
            onLogout={onLogout}
            strategicProjects={strategicProjects}
            onUpdateStrategicProjects={onUpdateStrategicProjects}
          />
        ) : (
          <AdminDashboardOverview
            currentUser={currentUser} employees={employees} presences={presences} tasks={tasks}
            reminders={reminders} currentTime={currentTime} onSelectTab={setActiveTab}
            onSelectEmployee={(id) => { setSelectedEmployeeId(id); setActiveTab('collaborators'); }}
            onUpdateReminders={onUpdateReminders}
            strategicProjects={strategicProjects}
            onUpdateStrategicProjects={onUpdateStrategicProjects}
            moduleConfig={moduleConfig}
            showToast={showToast}
          />
        )
      )}
    </Suspense>
  );
};
