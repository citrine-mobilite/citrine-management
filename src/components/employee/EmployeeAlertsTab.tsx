import React from 'react';
import { Employee, AppUser, Task, AttendanceIncident, NotificationLog, Presence, Reminder } from '../../types';
import { AlertCreateModal } from './AlertCreateModal';
import type { PersonalAlert } from './alerts/employeeAlertsTypes';
import { useEmployeeAlertsLogic } from './alerts/useEmployeeAlertsLogic';
import { EmployeeAlertsToolbar } from './alerts/EmployeeAlertsToolbar';
import { EmployeeAlertsListView } from './alerts/EmployeeAlertsListView';
import { EmployeeAlertDetailModal } from './alerts/EmployeeAlertDetailModal';

export type { PersonalAlert };

interface EmployeeAlertsTabProps {
  employeeProfile: Employee;
  currentUser?: AppUser | null;
  tasks: Task[];
  onUpdateTasks?: (tasks: Task[]) => void;
  employees?: Employee[];
  incidents: AttendanceIncident[];
  notifications?: NotificationLog[];
  presences?: Presence[];
  reminders?: Reminder[];
  onUpdateReminders?: (reminders: Reminder[]) => void;
  onAddNotification?: (log: NotificationLog) => void;
  onUpdateNotifications?: (logs: NotificationLog[]) => void;
  onAlertsReadChange?: (unreadCount: number) => void;
}

export const EmployeeAlertsTab: React.FC<EmployeeAlertsTabProps> = ({
  employeeProfile,
  currentUser,
  notifications = [],
  reminders = [],
  onUpdateReminders,
  onAddNotification,
  onUpdateNotifications,
  onAlertsReadChange,
}) => {
  const logic = useEmployeeAlertsLogic({
    employeeProfile,
    currentUser,
    notifications,
    reminders,
    onUpdateReminders,
    onAddNotification,
    onUpdateNotifications,
    onAlertsReadChange,
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-300 max-w-5xl mx-auto pb-10">
      <EmployeeAlertsToolbar
        allAlerts={logic.allAlerts}
        unreadCount={logic.unreadCount}
        filter={logic.filter}
        setFilter={logic.setFilter}
        searchQuery={logic.searchQuery}
        setSearchQuery={logic.setSearchQuery}
        viewDensity={logic.viewDensity}
        setViewDensity={logic.setViewDensity}
        isRinging={logic.isRinging}
        onMarkAllAsRead={logic.handleMarkAllAsRead}
        onToggleRingtone={logic.toggleRingtone}
        onOpenCreateModal={() => logic.setShowCreateModal(true)}
      />

      <EmployeeAlertsListView
        filteredAlerts={logic.filteredAlerts}
        searchQuery={logic.searchQuery}
        viewDensity={logic.viewDensity}
        expandedAlertId={logic.expandedAlertId}
        onSelectAlert={logic.handleSelectAlert}
      />

      <AlertCreateModal
        isOpen={logic.showCreateModal}
        onClose={() => logic.setShowCreateModal(false)}
        employeeProfile={employeeProfile}
        currentUser={currentUser}
        onCreateAlert={logic.handleCreateAlertFromModal}
      />

      <EmployeeAlertDetailModal
        alert={logic.selectedAlertModal}
        onClose={() => logic.setSelectedAlertModal(null)}
        onDelete={logic.handleDeleteAlert}
      />
    </div>
  );
};
