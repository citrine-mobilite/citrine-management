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
        onToggleMovementForm={() => logic.setShowMovementForm(!logic.showMovementForm)}
      />

      {logic.showMovementForm && (
        <form
          onSubmit={logic.handleCreateQuickMovement}
          className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2.5 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-amber-950">
              Enregistrer un Petit mouvement (Point important · Hors tâches)
            </span>
            <button
              type="button"
              onClick={() => logic.setShowMovementForm(false)}
              className="text-[11px] font-semibold text-stone-500 hover:text-stone-800 cursor-pointer"
            >
              Fermer
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <input
              type="text"
              required
              value={logic.movementTitle}
              onChange={(e) => logic.setMovementTitle(e.target.value)}
              placeholder="Ex: Course administrative / Vérification / Accueil visiteur..."
              className="sm:col-span-5 px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <div className="sm:col-span-2 flex items-center gap-1 bg-white border border-amber-200 rounded-xl px-2">
              <input
                type="number"
                min={5}
                max={480}
                step={5}
                value={logic.movementDuration}
                onChange={(e) => logic.setMovementDuration(Number(e.target.value) || 15)}
                className="w-full py-1.5 text-xs font-mono text-stone-900 focus:outline-none"
              />
              <span className="text-[10px] text-stone-500">min</span>
            </div>
            <input
              type="text"
              value={logic.movementLocation}
              onChange={(e) => logic.setMovementLocation(e.target.value)}
              placeholder="Lieu (optionnel)"
              className="sm:col-span-3 px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none"
            />
            <button
              type="submit"
              className="sm:col-span-2 px-3 py-1.5 bg-[#164e4b] hover:bg-[#113d3a] text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Enregistrer
            </button>
          </div>
          <input
            type="text"
            value={logic.movementNote}
            onChange={(e) => logic.setMovementNote(e.target.value)}
            placeholder="Note / détail rapide (optionnel)"
            className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none"
          />
        </form>
      )}

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
