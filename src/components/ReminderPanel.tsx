import React, { useState, useMemo } from 'react';
import { CheckCircle2, Repeat } from 'lucide-react';
import {
  Reminder,
  Employee,
  ReminderCategory,
  ReminderRoutineType,
} from '../types';
import {
  ReminderStatsCards,
  ReminderItemCard,
  ReminderTableView,
  ReminderModal,
  ActiveAlarmBanner,
  RoutineReminderCard,
  RoutineStatsCards,
} from './reminders';
import {
  computeReminderUrgency,
  computeNextRoutineOccurrence,
  formatDeadlineFrenchDate,
  isRoutineReminder,
  renewOrResolveReminder,
  sortRemindersByUrgency,
} from '../services/reminderService';
import {
  executeOperationWithLoading,
  executeDeleteWithSweetAlert,
} from '../utils/sweetAlert';
import { useReminderAlarmScheduler } from './reminders/useReminderAlarmScheduler';
import { ReminderToolbarAndHeader } from './reminders/ReminderToolbarAndHeader';

interface ReminderPanelProps {
  reminders: Reminder[];
  onUpdateReminders: (updated: Reminder[]) => Promise<void> | void;
  currentTime: string;
  employees?: Employee[];
  currentRole?: string;
  connectedEmployee?: Employee | null;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export default function ReminderPanel({
  reminders,
  onUpdateReminders,
  employees = [],
  currentRole = 'admin',
  connectedEmployee = null,
  showToast,
}: ReminderPanelProps) {
  const [activeSection, setActiveSection] = useState<'deadlines' | 'routines'>('deadlines');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [statusFilter, setStatusFilter] = useState<'all' | 'actionable' | 'upcoming' | 'resolved'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ReminderCategory>('all');
  const [routineTypeFilter, setRoutineTypeFilter] = useState<'all' | ReminderRoutineType>('all');
  const [routineStatusFilter, setRoutineStatusFilter] = useState<'all' | 'active' | 'paused'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [modalDefaultMode, setModalDefaultMode] = useState<'deadline' | 'routine'>('deadline');

  const {
    activeRingingReminder,
    handleStartAlarm,
    handleStopAlarm,
    handleSnooze5m,
  } = useReminderAlarmScheduler(reminders, onUpdateReminders, showToast);

  const deadlineReminders = useMemo(
    () => reminders.filter((r) => !isRoutineReminder(r)),
    [reminders]
  );

  const routineReminders = useMemo(
    () => reminders.filter((r) => isRoutineReminder(r)),
    [reminders]
  );

  const handleOpenCreateModal = () => {
    setEditingReminder(null);
    setModalDefaultMode(activeSection === 'routines' ? 'routine' : 'deadline');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setModalDefaultMode(isRoutineReminder(reminder) ? 'routine' : 'deadline');
    setIsModalOpen(true);
  };

  const handleSaveReminder = async (
    reminderData: Omit<Reminder, 'id' | 'createdAt'> & { id?: string }
  ) => {
    const isEdit = Boolean(reminderData.id);
    const isRoutine = reminderData.kind === 'routine' || reminderData.kind === 'alarm';

    await executeOperationWithLoading({
      loadingTitle: isEdit
        ? isRoutine
          ? 'Mise à jour du rappel...'
          : "Mise à jour de l'échéance..."
        : isRoutine
        ? 'Enregistrement du rappel récurrent...'
        : "Enregistrement de l'échéance...",
      loadingText: 'Synchronisation avec la base de données...',
      action: async () => {
        if (reminderData.id) {
          const updated = reminders.map((r) =>
            r.id === reminderData.id ? ({ ...r, ...reminderData } as Reminder) : r
          );
          await onUpdateReminders(updated);
        } else {
          const newReminderItem: Reminder = {
            id: `rem-${Date.now()}`,
            createdAt: new Date().toISOString(),
            ...reminderData,
          } as Reminder;
          await onUpdateReminders([newReminderItem, ...reminders]);
        }

        if (isRoutine) {
          setActiveSection('routines');
        } else {
          setActiveSection('deadlines');
        }
      },
      successTitle: isEdit
        ? isRoutine
          ? 'Rappel mis à jour'
          : 'Échéance mise à jour'
        : isRoutine
        ? 'Rappel récurrent créé'
        : 'Échéance ajoutée',
      successMessage: `"${reminderData.title}" est bien enregistré.`,
    });
  };

  const handleRenewOrResolveReminder = async (reminder: Reminder) => {
    const renewed = renewOrResolveReminder(reminder);
    const isRecurring = (reminder.renewalCycle || 'none') !== 'none';

    await executeOperationWithLoading({
      loadingTitle: isRecurring ? 'Renouvellement en cours...' : 'Validation du document...',
      loadingText: 'Mise à jour de la prochaine échéance...',
      action: async () => {
        if (activeRingingReminder?.id === reminder.id) {
          handleStopAlarm();
        }
        const updated = reminders.map((r) => (r.id === reminder.id ? renewed : r));
        await onUpdateReminders(updated);
      },
      successTitle: isRecurring ? 'Échéance renouvelée !' : 'Document validé !',
      successMessage: isRecurring
        ? `Prochaine échéance planifiée le ${formatDeadlineFrenchDate(
            renewed.expirationDate || renewed.date
          )}.`
        : `"${reminder.title}" a été marqué comme validé.`,
    });
  };

  const handleTogglePauseRoutine = async (reminder: Reminder) => {
    const willPause = !Boolean(reminder.stopped || reminder.isResolved);
    await executeOperationWithLoading({
      loadingTitle: willPause ? 'Mise en pause du rappel...' : 'Réactivation du rappel...',
      loadingText: 'Mise à jour du planning...',
      action: async () => {
        if (willPause && activeRingingReminder?.id === reminder.id) {
          handleStopAlarm();
        }
        const updated = reminders.map((r) =>
          r.id === reminder.id
            ? {
                ...r,
                stopped: willPause,
                isResolved: false,
              }
            : r
        );
        await onUpdateReminders(updated);
      },
      successTitle: willPause ? 'Rappel mis en pause' : 'Rappel réactivé',
      successMessage: willPause
        ? `"${reminder.title}" ne déclenchera plus d'alerte jusqu'à réactivation.`
        : `"${reminder.title}" est de nouveau actif.`,
    });
  };

  const handleDeleteReminder = async (id: string) => {
    const target = reminders.find((r) => r.id === id);
    const isRoutine = target ? isRoutineReminder(target) : false;

    await executeDeleteWithSweetAlert({
      title: isRoutine ? 'Supprimer ce rappel ?' : 'Supprimer cette échéance ?',
      text: 'Voulez-vous vraiment supprimer cet élément ?',
      itemName: target?.title,
      action: async () => {
        if (activeRingingReminder?.id === id) {
          handleStopAlarm();
        }
        await onUpdateReminders(reminders.filter((r) => r.id !== id));
      },
      successTitle: 'Élément supprimé',
      successMessage: target?.title
        ? `"${target.title}" a été supprimé.`
        : 'Le rappel a été supprimé.',
    });
  };

  const sortedAndFilteredDeadlines = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const list = deadlineReminders.filter((r) => {
      if (query) {
        const match =
          (r.title && r.title.toLowerCase().includes(query)) ||
          (r.entityName && r.entityName.toLowerCase().includes(query)) ||
          (r.documentRef && r.documentRef.toLowerCase().includes(query)) ||
          (r.note && r.note.toLowerCase().includes(query));
        if (!match) return false;
      }

      if (categoryFilter !== 'all') {
        const cat = r.category || 'autre';
        if (cat !== categoryFilter) return false;
      }

      const urgency = computeReminderUrgency(r);
      if (statusFilter === 'actionable') return urgency.isActionNeeded;
      if (statusFilter === 'upcoming') {
        return urgency.level === 'upcoming' || urgency.level === 'unscheduled';
      }
      if (statusFilter === 'resolved') return urgency.level === 'resolved';

      return true;
    });

    return sortRemindersByUrgency(list);
  }, [deadlineReminders, searchTerm, statusFilter, categoryFilter]);

  const sortedAndFilteredRoutines = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filtered = routineReminders.filter((r) => {
      if (query) {
        const match =
          (r.title && r.title.toLowerCase().includes(query)) ||
          (r.location && r.location.toLowerCase().includes(query)) ||
          (r.entityName && r.entityName.toLowerCase().includes(query)) ||
          (r.note && r.note.toLowerCase().includes(query));
        if (!match) return false;
      }

      if (routineTypeFilter !== 'all') {
        if ((r.routineType || 'reunion') !== routineTypeFilter) return false;
      }

      const isPaused = Boolean(r.stopped || r.isResolved);
      if (routineStatusFilter === 'active' && isPaused) return false;
      if (routineStatusFilter === 'paused' && !isPaused) return false;

      return true;
    });

    const now = new Date();
    return [...filtered].sort((a, b) => {
      const pausedA = Boolean(a.stopped || a.isResolved);
      const pausedB = Boolean(b.stopped || b.isResolved);
      if (pausedA !== pausedB) return pausedA ? 1 : -1;

      const nextA = computeNextRoutineOccurrence(a, now)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const nextB = computeNextRoutineOccurrence(b, now)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return nextA - nextB;
    });
  }, [routineReminders, searchTerm, routineTypeFilter, routineStatusFilter]);

  const actionableCount = useMemo(
    () => deadlineReminders.filter((r) => computeReminderUrgency(r).isActionNeeded).length,
    [deadlineReminders]
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {activeRingingReminder && (
        <ActiveAlarmBanner
          ringingReminder={activeRingingReminder}
          onStopAlarm={handleStopAlarm}
          onSnooze5m={handleSnooze5m}
        />
      )}

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
        actionableCount={actionableCount}
        viewMode={viewMode}
        setViewMode={setViewMode}
        routineTypeFilter={routineTypeFilter}
        setRoutineTypeFilter={setRoutineTypeFilter}
        routineStatusFilter={routineStatusFilter}
        setRoutineStatusFilter={setRoutineStatusFilter}
      />

      {activeSection === 'deadlines' ? (
        <>
          <ReminderStatsCards reminders={deadlineReminders} />

          {viewMode === 'cards' ? (
            <div className="space-y-2.5">
              {sortedAndFilteredDeadlines.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-3xl border border-stone-200/80 space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                  <p className="text-sm font-bold text-stone-800">
                    Aucune échéance pour ce filtre
                  </p>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    Ajoutez vos cartes grises, visites techniques, impôts trimestriels ou annuels
                    pour recevoir une alerte sur l&apos;accueil avant expiration.
                  </p>
                </div>
              ) : (
                sortedAndFilteredDeadlines.map((reminder) => (
                  <ReminderItemCard
                    key={reminder.id}
                    reminder={reminder}
                    isRinging={activeRingingReminder?.id === reminder.id}
                    onStartAlarm={handleStartAlarm}
                    onStopAlarm={handleStopAlarm}
                    onRenewOrResolve={handleRenewOrResolveReminder}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteReminder}
                  />
                ))
              )}
            </div>
          ) : (
            <ReminderTableView
              reminders={sortedAndFilteredDeadlines}
              employees={employees}
              ringingReminderId={activeRingingReminder?.id}
              onStartAlarm={handleStartAlarm}
              onStopAlarm={handleStopAlarm}
              onRenewOrResolve={handleRenewOrResolveReminder}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteReminder}
            />
          )}
        </>
      ) : (
        <>
          <RoutineStatsCards routines={routineReminders} />

          <div className="space-y-2.5">
            {sortedAndFilteredRoutines.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-3xl border border-stone-200/80 space-y-2.5">
                <Repeat className="h-8 w-8 text-[#2A7B76] mx-auto" />
                <p className="text-sm font-bold text-stone-800">
                  Aucun rappel récurrent ou réunion planifiée
                </p>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Créez par exemple une réunion tous les{' '}
                  <strong>Lundi, Mercredi et Vendredi à 09h00</strong> pour envoyer automatiquement
                  un rappel Push et une alerte à l&apos;équipe concernée.
                </p>
              </div>
            ) : (
              sortedAndFilteredRoutines.map((reminder) => (
                <RoutineReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  isRinging={activeRingingReminder?.id === reminder.id}
                  onStartAlarm={handleStartAlarm}
                  onStopAlarm={handleStopAlarm}
                  onTogglePause={handleTogglePauseRoutine}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteReminder}
                />
              ))
            )}
          </div>
        </>
      )}

      <ReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveReminder={handleSaveReminder}
        initialReminder={editingReminder}
        defaultMode={modalDefaultMode}
        employees={employees}
        isEmployee={currentRole === 'employé'}
        currentEmployee={connectedEmployee}
      />
    </div>
  );
}
