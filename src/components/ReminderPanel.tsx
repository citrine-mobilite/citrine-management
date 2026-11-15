import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bell,
  Plus,
  Search,
  LayoutGrid,
  ListOrdered,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { Reminder, Employee, ReminderCategory } from '../types';
import { soundService } from '../services/soundService';
import {
  ReminderStatsCards,
  ReminderItemCard,
  ReminderTableView,
  ReminderModal,
  ActiveAlarmBanner,
} from './reminders';
import {
  REMINDER_CATEGORY_META,
  computeReminderUrgency,
  formatDeadlineFrenchDate,
  renewOrResolveReminder,
  sortRemindersByUrgency,
} from '../services/reminderService';
import {
  executeOperationWithLoading,
  executeDeleteWithSweetAlert,
} from '../utils/sweetAlert';

interface ReminderPanelProps {
  reminders: Reminder[];
  onUpdateReminders: (updated: Reminder[]) => void;
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
  const [activeRingingReminder, setActiveRingingReminder] = useState<Reminder | null>(null);

  const handleStartAlarm = useCallback(
    (reminder: Reminder) => {
      setActiveRingingReminder(reminder);
      soundService.startContinuousAlertRingtone(0.7);
      if (showToast) {
        showToast(
          `Sonnerie d'alerte activée : "${reminder.title || reminder.note || 'Alerte'}"`,
          'success'
        );
      }
    },
    [showToast]
  );

  const handleStopAlarm = useCallback(() => {
    soundService.stopContinuousAlertRingtone();
    if (activeRingingReminder && showToast) {
      showToast('Sonnerie arrêtée avec succès.', 'success');
    }
    setActiveRingingReminder(null);
  }, [activeRingingReminder, showToast]);

  const handleSnooze5m = useCallback(() => {
    soundService.stopContinuousAlertRingtone();
    if (activeRingingReminder) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5);
      const newTime = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      const updated = reminders.map((r) =>
        r.id === activeRingingReminder.id ? { ...r, time: newTime } : r
      );
      onUpdateReminders(updated);
      if (showToast) showToast('Alerte reportée de 5 minutes.', 'success');
    }
    setActiveRingingReminder(null);
  }, [activeRingingReminder, reminders, onUpdateReminders, showToast]);

  // Real-time scheduler for hourly sound reminders
  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTotalMin = now.getHours() * 60 + now.getMinutes();

      for (const r of reminders) {
        if (r.stopped || r.isResolved) continue;
        if (!r.date || !r.time) continue;
        if (r.date !== todayStr) continue;

        const [rH, rM] = r.time.split(':').map(Number);
        if (isNaN(rH) || isNaN(rM)) continue;
        const targetTotalMin = rH * 60 + rM;

        const periods =
          r.triggerPeriods && r.triggerPeriods.length > 0 ? r.triggerPeriods : ['exact'];
        const triggered = r.triggeredPeriods || [];

        for (const period of periods) {
          if (triggered.includes(period)) continue;

          let shouldRing = false;
          if (period === 'exact' && currentTotalMin === targetTotalMin) shouldRing = true;
          else if (period === '5m' && targetTotalMin - currentTotalMin === 5) shouldRing = true;
          else if (period === '15m' && targetTotalMin - currentTotalMin === 15) shouldRing = true;
          else if (period === '30m' && targetTotalMin - currentTotalMin === 30) shouldRing = true;
          else if (period === '1h' && targetTotalMin - currentTotalMin === 60) shouldRing = true;

          if (shouldRing) {
            const updated = reminders.map((rem) =>
              rem.id === r.id
                ? { ...rem, triggeredPeriods: [...(rem.triggeredPeriods || []), period] }
                : rem
            );
            onUpdateReminders(updated);
            handleStartAlarm(r);
            break;
          }
        }
      }
    };

    const interval = setInterval(checkSchedule, 10000);
    return () => clearInterval(interval);
  }, [reminders, onUpdateReminders, handleStartAlarm]);

  useEffect(() => {
    return () => {
      soundService.stopContinuousAlertRingtone();
    };
  }, []);

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
          onUpdateReminders(updated);
        } else {
          const newReminderItem: Reminder = {
            id: `rem-${Date.now()}`,
            createdAt: new Date().toISOString(),
            ...reminderData,
          } as Reminder;
          onUpdateReminders([newReminderItem, ...reminders]);
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
        onUpdateReminders(updated);
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
        onUpdateReminders(reminders.filter((r) => r.id !== id));
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

      {/* En-tête sobre & professionnel */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/85 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-[#2A7B76] flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-950 tracking-tight">
              Échéances, Documents & Rappels
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Suivi des cartes grises, impôts trimestriels ou annuels, contrats et rappels horaires —
              avec alerte sur la page d&apos;accueil 7 à 14 jours avant expiration.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="bg-[#2A7B76] hover:bg-[#226763] text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer active:scale-98 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter une échéance / alerte</span>
        </button>
      </div>

      {/* KPIs d'urgence */}
      <ReminderStatsCards reminders={reminders} />

      {/* Barre de recherche, filtres et mode d'affichage */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/85 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Rechercher véhicule, impôt, réf..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-stone-400 shrink-0 hidden sm:block" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'all' | ReminderCategory)}
              className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-700 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none w-full sm:w-auto"
            >
              <option value="all">Toutes catégories</option>
              {(Object.keys(REMINDER_CATEGORY_META) as ReminderCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {REMINDER_CATEGORY_META[cat].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
          {/* Segmented status filter */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/70 text-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Toutes
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('actionable')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                statusFilter === 'actionable'
                  ? 'bg-white text-amber-800 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>À traiter</span>
              {actionableCount > 0 && (
                <span className="font-mono tabular-nums text-[10px] text-rose-700 font-extrabold">
                  ({actionableCount})
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('upcoming')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                statusFilter === 'upcoming'
                  ? 'bg-white text-[#2A7B76] shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              À jour
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('resolved')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                statusFilter === 'resolved'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Validées
            </button>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/70 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-[#2A7B76] shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Vue en cartes"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Cartes</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#2A7B76] shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Vue en tableau"
            >
              <ListOrdered className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Tableau</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
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
