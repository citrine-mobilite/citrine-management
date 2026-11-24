import React from 'react';
import {
  AppUser,
  Employee,
  Presence,
  Task,
  NotificationLog,
  CompanyModuleConfig,
  AttendanceIncident,
  LeaveRequest,
  Reminder,
  StrategicProject,
} from '../../types';
import { EmployeeDailyClockingWidget } from './EmployeeDailyClockingWidget';
import { EmployeePresencesHistorySection } from './EmployeePresencesHistorySection';
import { EmployeeIncidentsTab } from './EmployeeIncidentsTab';
import { EmployeeLeaveTab } from './EmployeeLeaveTab';
import TaskPanel from '../TaskPanel';
import { EmployeeAlertsTab } from './EmployeeAlertsTab';
import { ProjectMilestonesWidget } from '../projects/ProjectMilestonesWidget';
import { HomeExpirationAlertsBanner } from '../reminders';

interface EmployeePortalTabContentProps {
  logic: any;
  currentUser: AppUser | null;
  employees: Employee[];
  presences: Presence[];
  tasks: Task[];
  onUpdateTasks: (updated: Task[]) => void;
  onAddNotification: (log: NotificationLog) => void;
  moduleConfig?: CompanyModuleConfig;
  attendanceIncidents?: AttendanceIncident[];
  notifications?: NotificationLog[];
  onUpdateNotifications?: (logs: NotificationLog[]) => void;
  reminders?: Reminder[];
  onUpdateReminders?: (updated: Reminder[]) => void;
  leaveRequests?: LeaveRequest[];
  onUpdateLeaveRequests?: (leaves: LeaveRequest[]) => void;
  onUpdateEmployees?: (employees: Employee[]) => void;
  onUpdateUsers?: (users: AppUser[]) => void;
  users?: AppUser[];
  showToast?: (titleOrMessage: string, descOrType?: any, type?: any) => void;
  strategicProjects?: StrategicProject[];
  onUpdateStrategicProjects?: (projects: StrategicProject[]) => void;
}

export const EmployeePortalTabContent: React.FC<EmployeePortalTabContentProps> = ({
  logic,
  currentUser,
  employees,
  presences,
  tasks,
  onUpdateTasks,
  onAddNotification,
  moduleConfig,
  attendanceIncidents,
  notifications,
  onUpdateNotifications,
  reminders,
  onUpdateReminders,
  leaveRequests,
  onUpdateLeaveRequests,
  onUpdateEmployees,
  onUpdateUsers,
  users,
  showToast,
  strategicProjects,
  onUpdateStrategicProjects,
}) => {
  return (
    <>
      {logic.activeTab === 'clocking' && (
        <div className="space-y-6">
          <EmployeeDailyClockingWidget
            currentUser={currentUser}
            employeeProfile={logic.employeeProfile}
            todayPresence={logic.todayPresence}
            todayStr={logic.todayStr}
            currentDateStr={logic.currentDateStr}
            liveTimeString={logic.liveTimeString}
            isLocating={logic.isLocating}
            sensorsDiagnostic={logic.sensorsDiagnostic}
            runSensorsDiagnostic={logic.runSensorsDiagnostic}
            setShowOfficeQRModal={logic.setShowOfficeQRModal}
            setShowClockingModal={logic.setShowClockingModal}
            setPendingClockAction={logic.setPendingClockAction}
            setSelectedClockMethod={logic.setSelectedClockMethod}
            setQrCodeError={logic.setQrCodeError}
            startCameraScan={logic.startCameraScan}
            setEmergencyType={logic.setEmergencyType}
            setEmergencyReason={logic.setEmergencyReason}
            setShowEmergencyModal={logic.setShowEmergencyModal}
            setCustomClockReason={logic.setCustomClockReason}
            setCustomClockError={logic.setCustomClockError}
            setShowCustomClockModal={logic.setShowCustomClockModal}
            moduleConfig={moduleConfig}
          />
          {moduleConfig?.enableReminders !== false && (
            <HomeExpirationAlertsBanner
              reminders={reminders || []}
              employees={employees}
              filterForUser={currentUser}
              onOpenRemindersModule={() => logic.setActiveTab('alerts')}
              onRenewOrResolve={
                onUpdateReminders
                  ? (updatedRem) =>
                      onUpdateReminders(
                        (reminders || []).map((r) => (r.id === updatedRem.id ? updatedRem : r))
                      )
                  : undefined
              }
            />
          )}
          {moduleConfig?.enableStrategicProjects !== false && (
            <ProjectMilestonesWidget
              projects={strategicProjects || []}
              onUpdateProjects={onUpdateStrategicProjects}
              currentUser={currentUser}
              employees={employees}
              showToast={
                showToast
                  ? (msg, type) => showToast?.(msg, type === 'error' ? 'error' : 'success')
                  : undefined
              }
            />
          )}
        </div>
      )}

      {logic.activeTab === 'presences' && (
        <EmployeePresencesHistorySection
          myPresences={logic.myPresences}
          displayedPresences={logic.displayedPresences}
          employeeClockingStats={logic.employeeClockingStats}
          portalReportMonth={logic.portalReportMonth}
          setPortalReportMonth={logic.setPortalReportMonth}
          handleGeneratePortalReport={logic.handleGeneratePortalReport}
          isGeneratingReport={logic.isGeneratingReport}
          paginationMode={logic.paginationMode}
          setPaginationMode={logic.setPaginationMode}
          pageSize={logic.pageSize}
          setPageSize={logic.setPageSize}
          presencePage={logic.presencePage}
          setPresencePage={logic.setPresencePage}
          totalPages={logic.totalPages}
          infiniteCount={logic.infiniteCount}
          setInfiniteCount={logic.setInfiniteCount}
        />
      )}

      {logic.activeTab === 'incidents' && (
        <EmployeeIncidentsTab
          employeeProfile={logic.employeeProfile}
          myIncidents={logic.myIncidents}
          onOpenDeclareIncidentModal={() => logic.setShowEmergencyModal(true)}
        />
      )}

      {logic.activeTab === 'leaves' && (
        <EmployeeLeaveTab
          employeeProfile={logic.employeeProfile}
          currentUser={currentUser}
          leaveRequests={leaveRequests || []}
          onAddNotification={onAddNotification}
          showToast={logic.showToast}
          onUpdateLeaveRequests={onUpdateLeaveRequests}
          onUpdateEmployees={onUpdateEmployees}
          onUpdateUsers={onUpdateUsers}
          employees={employees}
          users={users}
        />
      )}

      {logic.activeTab === 'tasks' && (
        <TaskPanel
          tasks={tasks}
          onUpdateTasks={onUpdateTasks}
          onAddNotification={onAddNotification}
          currentRole="employé"
          employees={employees}
          reminders={reminders || []}
          strategicProjects={strategicProjects || []}
          notifications={notifications || []}
          currentUser={currentUser}
          showToast={(msg, type) => logic.showToast('Tâches', msg, type === 'error' ? 'warning' : 'success')}
        />
      )}

      {logic.activeTab === 'alerts' && (
        <EmployeeAlertsTab
          employeeProfile={logic.employeeProfile}
          currentUser={currentUser}
          tasks={tasks}
          onUpdateTasks={onUpdateTasks}
          employees={employees}
          incidents={attendanceIncidents || []}
          notifications={notifications || []}
          presences={presences || []}
          reminders={reminders || []}
          onUpdateReminders={onUpdateReminders}
          onAddNotification={onAddNotification}
          onUpdateNotifications={onUpdateNotifications}
        />
      )}
    </>
  );
};
