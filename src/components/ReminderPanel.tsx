import React, { useState, useMemo } from 'react';
import {
  Reminder,
  Employee,
  ReminderCategory,
  ReminderRoutineType,
} from '../types';
import {
  computeReminderUrgency,
  isRoutineReminder,
  renewOrResolveReminder,
  sortRemindersByUrgency,
} from '../services/reminderService';
import {
  ReminderToolbarAndHeader,
  ReminderItemCard,
  ReminderTableView,
  ReminderModal,
  ActiveAlarmBanner,
  RoutineReminderCard,
  RoutineStatsCards,
  HomeExpirationAlertsBanner,
  useReminderAlarmScheduler,
} from './reminders';

interface ExternalAlarmControls {
  activeRingingReminder: Reminder | null;
  onStartAlarm: (reminder: Reminder) => void;
  onStopAlarm: () => void;
  onSnooze5m: () => void;
}

interface ReminderPanelProps {
  reminders: Reminder[];
  onUpdateReminders: (updated: Reminder[]) => void;
  currentTime: string;
  employees?: Employee[];
  currentRole?: string;
  connectedEmployee?: Employee | null;
  showToast?: (message: string, type?: 'success' | 'error') => void;
  externalAlarm?: ExternalAlarmControls;
}

export default function ReminderPanel({
  reminders,
  onUpdateReminders,
  employees = [],
  currentRole = 'admin',
  connectedEmployee = null,
  showToast,
  externalAlarm,
}: ReminderPanelProps) {
  const [activeSection, setActiveSection] = useState<'deadlines' | 'routines'>('deadlines');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ReminderCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'actionable' | 'upcoming' | 'resolved'>('all');
  const [routineTypeFilter, setRoutineTypeFilter] = useState<'all' | ReminderRoutineType>('all');
  const [routineStatusFilter, setRoutineStatusFilter] = useState<'all' | 'active' | 'paused'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  // Fallback local scheduler only when App.tsx hasn't mounted the global alarm scheduler
  const localScheduler = useReminderAlarmScheduler(
    externalAlarm ? [] : reminders,
    onUpdateReminders,
    showToast
  );

  const activeRingingReminder = externalAlarm
    ? externalAlarm.activeRingingReminder
    : localScheduler.activeRingingReminder;
  const handleStartAlarm = externalAlarm
    ? externalAlarm.onStartAlarm
    : localScheduler.handleStartAlarm;
  const handleStopAlarm = externalAlarm
    ? externalAlarm.onStopAlarm
    : localScheduler.handleStopAlarm;
  const handleSnooze5m = externalAlarm
    ? externalAlarm.onSnooze5m
    : localScheduler.handleSnooze5m;

  // Partition into the 2 clearly separated modules
  const deadlineReminders = useMemo(
    () =>
      sortRemindersByUrgency(
        reminders.filter((r) => r.kind !== 'movement' && !isRoutineReminder(r))
      ),
    [reminders]
  );

  const routineReminders = useMemo(
    () =>
      reminders
        .filter((r) => r.kind !== 'movement' && isRoutineReminder(r))
        .sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59')),
    [reminders]
  );

  const actionableDeadlinesCount = useMemo(
    () => deadlineReminders.filter((r) => computeReminderUrgency(r).isActionNeeded).length,
    [deadlineReminders]
  );

  const filteredDeadlines = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return deadlineReminders.filter((r) => {
      if (categoryFilter !== 'all' && (r.category || 'autre') !== categoryFilter) {
        return false;
      }
      const urgency = computeReminderUrgency(r);
      if (statusFilter === 'actionable' && !urgency.isActionNeeded) return false;
      if (statusFilter === 'upcoming' && urgency.level !== 'upcoming') return false;
      if (statusFilter === 'resolved' && urgency.level !== 'resolved') return false;

      if (q) {
        const hay = `${r.title || ''} ${r.note || ''} ${r.entityName || ''} ${r.documentRef || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [deadlineReminders, categoryFilter, statusFilter, searchTerm]);

  const filteredRoutines = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return routineReminders.filter((r) => {
      if (routineTypeFilter !== 'all' && (r.routineType || 'reunion') !== routineTypeFilter) {
        return false;
      }
      const isPaused = Boolean(r.stopped || r.isResolved);
      if (routineStatusFilter === 'active' && isPaused) return false;
      if (routineStatusFilter === 'paused' && !isPaused) return false;

      if (q) {
        const hay = `${r.title || ''} ${r.note || ''} ${r.location || ''} ${r.entityName || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [routineReminders, routineTypeFilter, routineStatusFilter, searchTerm]);

  const handleOpenCreateModal = () => {
    setEditingReminder(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsModalOpen(true);
  };

  const handleSaveReminder = (
    reminderData: Omit<Reminder, 'id' | 'createdAt'> & { id?: string }
  ) => {
    if (reminderData.id) {
      const updated = reminders.map((r) =>
        r.id === reminderData.id ? ({ ...r, ...reminderData } as Reminder) : r
      );
      onUpdateReminders(updated);
      if (showToast) showToast('Modification enregistrée avec succès.', 'success');
    } else {
      const newReminderItem: Reminder = {
        id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
        ...reminderData,
      } as Reminder;
      onUpdateReminders([newReminderItem, ...reminders]);
      setActiveSection(isRoutineReminder(newReminderItem) ? 'routines' : 'deadlines');
      if (showToast) {
        showToast(
          isRoutineReminder(newReminderItem)
            ? 'Rappel Jour J programmé avec succès.'
            : 'Échéance avec alerte anticipée enregistrée.',
          'success'
        );
      }
    }
  };

  const handleDeleteReminder = (id: string) => {
    if (activeRingingReminder?.id === id) {
      handleStopAlarm();
    }
    onUpdateReminders(reminders.filter((r) => r.id !== id));
    if (showToast) showToast('Élément supprimé.', 'success');
  };

  const handleRenewOrResolve = (target: Reminder) => {
    const resolvedOrAdvanced =
      target.lastRenewedAt && target.expirationDate !== undefined && target.isResolved !== undefined
        ? target
        : renewOrResolveReminder(target);
    onUpdateReminders(
      reminders.map((r) => (r.id === resolvedOrAdvanced.id ? resolvedOrAdvanced : r))
    );
    if (showToast) {
      showToast(
        resolvedOrAdvanced.renewalCycle && resolvedOrAdvanced.renewalCycle !== 'none'
          ? 'Échéance validée et reportée au cycle suivant.'
          : 'Document marqué comme validé.',
        'success'
      );
    }
  };

  const handleTogglePauseRoutine = (target: Reminder) => {
    const nextStopped = !(target.stopped || target.isResolved);
    if (nextStopped && activeRingingReminder?.id === target.id) {
      handleStopAlarm();
    }
    onUpdateReminders(
      reminders.map((r) =>
        r.id === target.id ? { ...r, stopped: nextStopped, isResolved: false } : r
      )
    );
    if (showToast) {
      showToast(nextStopped ? 'Rappel mis en pause.' : 'Rappel réactivé.', 'success');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Bannière sonnerie active (lorsqu'affichée localement ou en miroir) */}
      {activeRingingReminder && !externalAlarm && (
        <ActiveAlarmBanner
          ringingReminder={activeRingingReminder}
          onStopAlarm={handleStopAlarm}
          onSnooze5m={handleSnooze5m}
        />
      )}

      {/* En-tête & sélecteur des 2 modules séparés */}
      <ReminderToolbarAndHeader
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        deadlinesCount={deadlineReminders.length}
        routinesCount={routineReminders.length}
        onOpenCreateModal={handleOpenCreateModal}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        actionableCount={actionableDeadlinesCount}
        viewMode={viewMode}
        setViewMode={setViewMode}
        routineTypeFilter={routineTypeFilter}
        setRoutineTypeFilter={setRoutineTypeFilter}
        routineStatusFilter={routineStatusFilter}
        setRoutineStatusFilter={setRoutineStatusFilter}
      />

      {/* MODULE 1 : Échéances, Documents, Salaires & Fiscalité (Alerte J-N) */}
      {activeSection === 'deadlines' && (
        <div className="space-y-5">
          <HomeExpirationAlertsBanner
            reminders={deadlineReminders}
            employees={employees}
            onRenewOrResolve={handleRenewOrResolve}
            maxVisible={6}
          />

          {viewMode === 'cards' ? (
            <div className="space-y-3">
              {filteredDeadlines.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-3xl border border-stone-200/80 text-stone-400 text-xs">
                  Aucune échéance enregistrée pour ce filtre. Cliquez sur &quot;Ajouter une échéance J-N&quot; pour suivre salaires, documents ou fiscalité.
                </div>
              ) : (
                filteredDeadlines.map((reminder) => (
                  <ReminderItemCard
                    key={reminder.id}
                    reminder={reminder}
                    isRinging={activeRingingReminder?.id === reminder.id}
                    onStartAlarm={handleStartAlarm}
                    onStopAlarm={handleStopAlarm}
                    onRenewOrResolve={handleRenewOrResolve}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteReminder}
                  />
                ))
              )}
            </div>
          ) : (
            <ReminderTableView
              reminders={filteredDeadlines}
              employees={employees}
              ringingReminderId={activeRingingReminder?.id}
              onStartAlarm={handleStartAlarm}
              onStopAlarm={handleStopAlarm}
              onRenewOrResolve={handleRenewOrResolve}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteReminder}
            />
          )}
        </div>
      )}

      {/* MODULE 2 : Rappels Jour J & Rituels Sonores (jamais d'alerte avant le Jour J) */}
      {activeSection === 'routines' && (
        <div className="space-y-5">
          <RoutineStatsCards routines={routineReminders} />

          <div className="space-y-3">
            {filteredRoutines.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-3xl border border-stone-200/80 text-stone-400 text-xs">
                Aucun rappel Jour J ni rituel programmé. Cliquez sur &quot;Créer un rappel Jour J&quot; pour planifier un rappel ponctuel ou récurrent.
              </div>
            ) : (
              filteredRoutines.map((routine) => (
                <RoutineReminderCard
                  key={routine.id}
                  reminder={routine}
                  isRinging={activeRingingReminder?.id === routine.id}
                  onStartAlarm={handleStartAlarm}
                  onStopAlarm={handleStopAlarm}
                  onTogglePause={handleTogglePauseRoutine}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteReminder}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Création / Édition */}
      <ReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveReminder={handleSaveReminder}
        initialReminder={editingReminder}
        defaultMode={activeSection === 'routines' ? 'routine' : 'deadline'}
        employees={employees}
        isEmployee={currentRole === 'employé'}
        currentEmployee={connectedEmployee}
      />
    </div>
  );
}
