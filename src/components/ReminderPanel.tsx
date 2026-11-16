import React, { useState, useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Reminder, Employee, ReminderCategory } from '../types';
import {
  ReminderStatsCards,
  ReminderItemCard,
  ReminderTableView,
  ReminderModal,
  ActiveAlarmBanner,
} from './reminders';
import {
  computeReminderUrgency,
  formatDeadlineFrenchDate,
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
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [statusFilter, setStatusFilter] = useState<'all' | 'actionable' | 'upcoming' | 'resolved'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ReminderCategory>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const {
    activeRingingReminder,
    handleStartAlarm,
    handleStopAlarm,
    handleSnooze5m,
  } = useReminderAlarmScheduler(reminders, onUpdateReminders, showToast);

  const handleOpenCreateModal = () => {
    setEditingReminder(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsModalOpen(true);
  };

  const handleSaveReminder = async (
    reminderData: Omit<Reminder, 'id' | 'createdAt'> & { id?: string }
  ) => {
    const isEdit = Boolean(reminderData.id);
    await executeOperationWithLoading({
      loadingTitle: isEdit ? "Mise à jour de l'échéance..." : "Enregistrement de l'échéance...",
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
      },
      successTitle: isEdit ? 'Échéance mise à jour' : 'Échéance ajoutée',
      successMessage: `"${reminderData.title}" est bien enregistrée.`,
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

  const handleDeleteReminder = async (id: string) => {
    const target = reminders.find((r) => r.id === id);
    await executeDeleteWithSweetAlert({
      title: 'Supprimer cette échéance ?',
      text: 'Voulez-vous vraiment supprimer cet élément du registre ?',
      itemName: target?.title,
      action: async () => {
        if (activeRingingReminder?.id === id) {
          handleStopAlarm();
        }
        await onUpdateReminders(reminders.filter((r) => r.id !== id));
      },
      successTitle: 'Élément supprimé',
      successMessage: target?.title
        ? `"${target.title}" a été retiré du registre.`
        : 'Le rappel a été supprimé.',
    });
  };

  const sortedAndFiltered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const list = reminders.filter((r) => {
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
  }, [reminders, searchTerm, statusFilter, categoryFilter]);

  const actionableCount = useMemo(
    () => reminders.filter((r) => computeReminderUrgency(r).isActionNeeded).length,
    [reminders]
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
      />

      <ReminderStatsCards reminders={reminders} />

      {viewMode === 'cards' ? (
        <div className="space-y-2.5">
          {sortedAndFiltered.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-stone-200/80 space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <p className="text-sm font-bold text-stone-800">
                Aucune échéance pour ce filtre
              </p>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Ajoutez vos cartes grises, visites techniques, impôts trimestriels ou annuels pour
                recevoir un message d&apos;alerte sur l&apos;accueil avant expiration.
              </p>
            </div>
          ) : (
            sortedAndFiltered.map((reminder) => (
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
          reminders={sortedAndFiltered}
          employees={employees}
          ringingReminderId={activeRingingReminder?.id}
          onStartAlarm={handleStartAlarm}
          onStopAlarm={handleStopAlarm}
          onRenewOrResolve={handleRenewOrResolveReminder}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteReminder}
        />
      )}

      <ReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveReminder={handleSaveReminder}
        initialReminder={editingReminder}
        employees={employees}
        isEmployee={currentRole === 'employé'}
        currentEmployee={connectedEmployee}
      />
    </div>
  );
}
