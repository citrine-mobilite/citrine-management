import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Bell, 
  Plus, 
  Search, 
  LayoutGrid, 
  ListOrdered, 
  Volume2, 
  VolumeX, 
  Clock, 
  Filter 
} from 'lucide-react';
import { Reminder, Employee } from '../types';
import { soundService } from '../services/soundService';
import { 
  ReminderStatsCards, 
  ReminderItemCard, 
  ReminderTableView, 
  ReminderModal, 
  ActiveAlarmBanner 
} from './reminders';

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
  currentTime,
  employees = [],
  showToast,
}: ReminderPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'upcoming'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  // Active Ringing Alarm State (Continuous alarm until stopped)
  const [activeRingingReminder, setActiveRingingReminder] = useState<Reminder | null>(null);

  // Start continuous ringing alarm
  const handleStartAlarm = useCallback((reminder: Reminder) => {
    setActiveRingingReminder(reminder);
    soundService.startContinuousAlertRingtone(0.7);
    if (showToast) {
      showToast(`Sonnerie d'alerte activée : "${reminder.title || reminder.note || 'Alerte'}"`, 'success');
    }
  }, [showToast]);

  // Stop continuous ringing alarm
  const handleStopAlarm = useCallback(() => {
    soundService.stopContinuousAlertRingtone();
    if (activeRingingReminder && showToast) {
      showToast('Sonnerie arrêtée avec succès.', 'success');
    }
    setActiveRingingReminder(null);
  }, [activeRingingReminder, showToast]);

  // Snooze alarm by 5 minutes
  const handleSnooze5m = useCallback(() => {
    soundService.stopContinuousAlertRingtone();
    if (activeRingingReminder) {
      // Calculate new time + 5m
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5);
      const newTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const updated = reminders.map((r) =>
        r.id === activeRingingReminder.id ? { ...r, time: newTime } : r
      );
      onUpdateReminders(updated);
      if (showToast) showToast('Alerte reportée de 5 minutes.', 'success');
    }
    setActiveRingingReminder(null);
  }, [activeRingingReminder, reminders, onUpdateReminders, showToast]);

  // Automatic real-time scheduler check: triggers continuous alarm when scheduled time matches
  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      const currentTotalMin = currentH * 60 + currentM;

      for (const r of reminders) {
        if (!r.date || !r.time) continue;
        if (r.date !== todayStr) continue;

        const [rH, rM] = r.time.split(':').map(Number);
        if (isNaN(rH) || isNaN(rM)) continue;
        const targetTotalMin = rH * 60 + rM;

        const periods = r.triggerPeriods && r.triggerPeriods.length > 0 ? r.triggerPeriods : ['exact'];
        const triggered = r.triggeredPeriods || [];

        for (const period of periods) {
          if (triggered.includes(period)) continue;

          let shouldRing = false;
          if (period === 'exact' && currentTotalMin === targetTotalMin) {
            shouldRing = true;
          } else if (period === '5m' && targetTotalMin - currentTotalMin === 5) {
            shouldRing = true;
          } else if (period === '15m' && targetTotalMin - currentTotalMin === 15) {
            shouldRing = true;
          } else if (period === '30m' && targetTotalMin - currentTotalMin === 30) {
            shouldRing = true;
          } else if (period === '1h' && targetTotalMin - currentTotalMin === 60) {
            shouldRing = true;
          }

          if (shouldRing) {
            // Mark as triggered so it rings only once for this period
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

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      soundService.stopContinuousAlertRingtone();
    };
  }, []);

  // Open creation modal
  const handleOpenCreateModal = () => {
    setEditingReminder(null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsModalOpen(true);
  };

  // Save (Create or Edit)
  const handleSaveReminder = (
    reminderData: Omit<Reminder, 'id' | 'createdAt'> & { id?: string }
  ) => {
    if (reminderData.id) {
      // Modification
      const updated = reminders.map((r) =>
        r.id === reminderData.id ? ({ ...r, ...reminderData } as Reminder) : r
      );
      onUpdateReminders(updated);
      if (showToast) showToast('Alerte modifiée avec succès.', 'success');
    } else {
      // Création
      const newReminderItem: Reminder = {
        id: `rem-${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...reminderData,
      } as Reminder;
      onUpdateReminders([newReminderItem, ...reminders]);
      if (showToast) showToast('Nouvelle alerte programmée.', 'success');
    }
  };

  // Delete
  const handleDeleteReminder = (id: string) => {
    if (activeRingingReminder?.id === id) {
      handleStopAlarm();
    }
    onUpdateReminders(reminders.filter((r) => r.id !== id));
    if (showToast) showToast('Alerte supprimée.');
  };

  // Filtered Reminders
  const todayDateStr = new Date().toISOString().split('T')[0];
  const filtered = useMemo(() => {
    return reminders.filter((r) => {
      const matchSearch =
        (r.title && r.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.note && r.note.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchSearch) return false;

      if (filterPeriod === 'today') {
        return r.date === todayDateStr;
      }
      if (filterPeriod === 'upcoming') {
        return r.date && r.date >= todayDateStr;
      }
      return true;
    });
  }, [reminders, searchTerm, filterPeriod, todayDateStr]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Active Continuous Ringing Banner (Stops when user clicks Stop) */}
      {activeRingingReminder && (
        <ActiveAlarmBanner
          ringingReminder={activeRingingReminder}
          onStopAlarm={handleStopAlarm}
          onSnooze5m={handleSnooze5m}
        />
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-200" />
            <h2 className="font-serif font-bold text-xl">Gestion des Alertes & Rappels</h2>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-white text-[#2A7B76] hover:bg-emerald-50 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Créer une Alerte</span>
        </button>
      </div>

      {/* KPI Stats */}
      <ReminderStatsCards reminders={reminders} />

      {/* Toolbar: Search, Period Filter & View Switcher (Cards vs DataTable) */}
      <div className="bg-white p-3.5 rounded-3xl border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher par intitulé, consigne ou date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 rounded-2xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Quick Filter */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200/70 text-xs">
            <button
              onClick={() => setFilterPeriod('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                filterPeriod === 'all'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilterPeriod('today')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                filterPeriod === 'today'
                  ? 'bg-white text-[#2A7B76] shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setFilterPeriod('upcoming')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                filterPeriod === 'upcoming'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              À venir
            </button>
          </div>

          {/* View Mode Switcher: Cards vs DataTable */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200/70 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-[#2A7B76] shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Affichage sous forme de cartes"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Cartes</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#2A7B76] shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Affichage sous forme de liste dans un tableau (DataTable)"
            >
              <ListOrdered className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Tableau</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1: Cards View */}
      {viewMode === 'cards' && (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-stone-200/80 text-stone-400 text-xs">
              Aucune alerte correspondante. Cliquez sur "Créer une Alerte" pour en planifier une.
            </div>
          ) : (
            filtered.map((reminder) => (
              <ReminderItemCard
                key={reminder.id}
                reminder={reminder}
                isRinging={activeRingingReminder?.id === reminder.id}
                onStartAlarm={handleStartAlarm}
                onStopAlarm={handleStopAlarm}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteReminder}
              />
            ))
          )}
        </div>
      )}

      {/* Mode 2: DataTable View */}
      {viewMode === 'table' && (
        <ReminderTableView
          reminders={filtered}
          employees={employees}
          ringingReminderId={activeRingingReminder?.id}
          onStartAlarm={handleStartAlarm}
          onStopAlarm={handleStopAlarm}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteReminder}
        />
      )}

      {/* Create / Edit Reminder Modal */}
      <ReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveReminder={handleSaveReminder}
        initialReminder={editingReminder}
        employees={employees}
      />
    </div>
  );
}
