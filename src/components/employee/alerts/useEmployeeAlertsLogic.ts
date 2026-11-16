import React, { useState, useEffect, useMemo } from 'react';
import { Employee, AppUser, NotificationLog, Reminder } from '../../../types';
import { soundService } from '../../../services/soundService';
import { saveDocument, deleteDocument, COLLECTIONS } from '../../../services/dataService';
import { executeDeleteWithSweetAlert, executeOperationWithLoading } from '../../../utils/sweetAlert';
import {
  addQuickSmallMovement,
  deleteQuickSmallMovement,
  TASKSHEET_MOVEMENTS_UPDATED_EVENT,
} from '../../../services/taskSheetMovementsService';
import {
  PersonalAlert,
  matchesEmployeeIdentifier,
  addAlertIdVariants,
  buildPersonalAlertsList,
} from './employeeAlertsTypes';

interface UseEmployeeAlertsLogicParams {
  employeeProfile: Employee;
  currentUser?: AppUser | null;
  notifications: NotificationLog[];
  reminders: Reminder[];
  onUpdateReminders?: (reminders: Reminder[]) => void;
  onAddNotification?: (log: NotificationLog) => void;
  onUpdateNotifications?: (logs: NotificationLog[]) => void;
  onAlertsReadChange?: (unreadCount: number) => void;
}

export function useEmployeeAlertsLogic({
  employeeProfile,
  currentUser,
  notifications,
  reminders,
  onUpdateReminders,
  onAddNotification,
  onUpdateNotifications,
  onAlertsReadChange,
}: UseEmployeeAlertsLogicParams) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent' | 'movement' | 'task' | 'incident' | 'leaves'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewDensity, setViewDensity] = useState<'compact' | 'detailed'>('compact');
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [isRinging, setIsRinging] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [movementTitle, setMovementTitle] = useState('');
  const [movementDuration, setMovementDuration] = useState(15);
  const [movementLocation, setMovementLocation] = useState('');
  const [movementNote, setMovementNote] = useState('');
  const [selectedAlertModal, setSelectedAlertModal] = useState<PersonalAlert | null>(null);
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(() => new Set<string>());
  const [deletedAlertIds, setDeletedAlertIds] = useState<Set<string>>(() => new Set<string>());
  const [movementsTick, setMovementsTick] = useState(0);

  useEffect(() => {
    const onMovUpdated = () => setMovementsTick((t) => t + 1);
    window.addEventListener(TASKSHEET_MOVEMENTS_UPDATED_EVENT, onMovUpdated);
    return () => window.removeEventListener(TASKSHEET_MOVEMENTS_UPDATED_EVENT, onMovUpdated);
  }, []);

  const allAlerts = useMemo(
    () =>
      buildPersonalAlertsList({
        reminders,
        notifications,
        employeeProfile,
        currentUser,
        readAlertIds,
        deletedAlertIds,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reminders, notifications, employeeProfile, currentUser, readAlertIds, deletedAlertIds, movementsTick]
  );

  const unreadCount = useMemo(() => allAlerts.filter((a) => !a.read).length, [allAlerts]);

  useEffect(() => {
    onAlertsReadChange?.(unreadCount);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('citrine:alerts_read_updated', { detail: { unreadCount } }));
    }
  }, [unreadCount, onAlertsReadChange]);

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (readAlertIds.has(id)) return;
    const next = new Set<string>(readAlertIds);
    addAlertIdVariants(next, id);

    try {
      if (typeof soundService?.playPointageSuccess === 'function') {
        soundService.playPointageSuccess();
      }
    } catch {}
    setReadAlertIds(next);

    if (onUpdateNotifications && notifications.some((n) => n.id === id && !n.read)) {
      onUpdateNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }
  };

  const handleSelectAlert = (alert: PersonalAlert) => {
    setSelectedAlertModal(alert);
    if (!alert.read) {
      handleMarkAsRead(alert.id);
    }
  };

  const handleMarkAllAsRead = () => {
    const next = new Set<string>(readAlertIds);
    allAlerts.forEach((a) => addAlertIdVariants(next, a.id));
    setReadAlertIds(next);

    try {
      if (typeof soundService?.playAlertNotification === 'function') {
        soundService.playAlertNotification(0.5);
      }
    } catch {}

    if (onUpdateNotifications && notifications.length > 0) {
      let hasChanges = false;
      const updated = notifications.map((n) => {
        if (matchesEmployeeIdentifier(n.recipient, employeeProfile, currentUser)) {
          if (!n.read) hasChanges = true;
          return { ...n, read: true };
        }
        return n;
      });
      if (hasChanges) onUpdateNotifications(updated);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('citrine:alerts_read_updated', { detail: { unreadCount: 0 } }));
    }
    onAlertsReadChange?.(0);
  };

  const handleDeleteAlert = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    await executeDeleteWithSweetAlert({
      title: 'Supprimer cette notification ?',
      text: 'Voulez-vous vraiment supprimer cet élément de vos alertes ?',
      action: async () => {
        const nextDeleted = new Set<string>(deletedAlertIds);
        nextDeleted.add(id);
        setDeletedAlertIds(nextDeleted);

        if (id.startsWith('mov-')) {
          await deleteQuickSmallMovement(id);
          onUpdateReminders?.(reminders.filter((r) => r.id !== id));
        } else if (id.startsWith('rem-') || reminders.some((r) => r.id === id)) {
          await deleteDocument(COLLECTIONS.REMINDERS, id);
          onUpdateReminders?.(reminders.filter((r) => r.id !== id));
        }

        if (notifications.some((n) => n.id === id)) {
          await deleteDocument(COLLECTIONS.NOTIFICATIONS, id);
          onUpdateNotifications?.(notifications.filter((n) => n.id !== id));
        }

        if (selectedAlertModal?.id === id) setSelectedAlertModal(null);
      },
      successTitle: 'Alerte supprimée !',
      successMessage: "L'élément a été retiré de votre fil d'alertes.",
    });
  };

  const handleCreateQuickMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementTitle.trim()) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const saved = await addQuickSmallMovement({
      employeeId: String(employeeProfile.id),
      employeeName: employeeProfile.name,
      date: todayStr,
      title: movementTitle.trim(),
      durationMinutes: Number(movementDuration) || 15,
      location: movementLocation.trim() || undefined,
      note: movementNote.trim() || undefined,
      isResolved: true,
      authorName: currentUser?.name || employeeProfile.name,
    });
    if (onUpdateReminders) {
      onUpdateReminders([saved, ...reminders.filter((r) => r.id !== saved.id)]);
    }
    setMovementTitle('');
    setMovementLocation('');
    setMovementNote('');
    setShowMovementForm(false);
  };

  const handleCreateAlertFromModal = async (alertData: {
    title: string;
    note: string;
    date: string;
    time: string;
    triggerPeriods: string[];
    employeeId: string;
  }) => {
    const targetId = employeeProfile.id || currentUser?.id || alertData.employeeId;
    const nowIso = new Date().toISOString();

    const newReminderItem: Reminder = {
      id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: alertData.title.trim(),
      note: alertData.note.trim(),
      date: alertData.date,
      time: alertData.time,
      triggerPeriods: alertData.triggerPeriods && alertData.triggerPeriods.length > 0 ? alertData.triggerPeriods : ['exact'],
      triggeredPeriods: [],
      allEmployees: false,
      employeeIds: [targetId],
      employeeId: targetId,
      stopped: false,
      createdAt: nowIso,
    };

    const res = await executeOperationWithLoading({
      loadingTitle: "Création de l'alerte...",
      loadingText: `Programmation de "${newReminderItem.title}", veuillez patienter...`,
      action: async () => {
        await saveDocument(COLLECTIONS.REMINDERS, newReminderItem);
        onUpdateReminders?.([newReminderItem, ...reminders]);

        const notifLog: NotificationLog = {
          id: `notif-rem-${Date.now()}`,
          type: 'system',
          recipient: employeeProfile.name || currentUser?.name || 'Moi',
          title: `Alerte programmée : ${newReminderItem.title}`,
          content: `${newReminderItem.note} (Date: ${newReminderItem.date} à ${newReminderItem.time})`,
          timestamp: nowIso,
          read: false,
          payload: JSON.stringify({ source: 'personal_alert', reminderId: newReminderItem.id }),
        };
        await saveDocument(COLLECTIONS.NOTIFICATIONS, notifLog);
        onAddNotification?.(notifLog);
      },
      successTitle: 'Alerte créée !',
      successMessage: `L'alerte "${newReminderItem.title}" a été programmée avec succès.`,
    });

    if (res.success) {
      setShowCreateModal(false);
    }
  };

  const toggleRingtone = () => {
    if (isRinging) {
      soundService.stopContinuousAlertRingtone();
      setIsRinging(false);
    } else {
      soundService.startContinuousAlertRingtone(0.5);
      setIsRinging(true);
    }
  };

  const filteredAlerts = useMemo(() => {
    return allAlerts.filter((a) => {
      if (filter === 'unread' && a.read) return false;
      if (filter === 'urgent' && a.type !== 'urgent') return false;
      if (filter === 'movement' && a.category !== 'Mouvement') return false;
      if (filter === 'task' && a.category !== 'Tâche') return false;
      if (filter === 'incident' && a.category !== 'Pointage') return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (
          !a.title.toLowerCase().includes(query) &&
          !a.message.toLowerCase().includes(query) &&
          !a.category.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [allAlerts, filter, searchQuery]);

  return {
    filter, setFilter, searchQuery, setSearchQuery, viewDensity, setViewDensity,
    expandedAlertId, isRinging, showCreateModal, setShowCreateModal,
    showMovementForm, setShowMovementForm, movementTitle, setMovementTitle,
    movementDuration, setMovementDuration, movementLocation, setMovementLocation,
    movementNote, setMovementNote, handleCreateQuickMovement,
    selectedAlertModal, setSelectedAlertModal, allAlerts, unreadCount, filteredAlerts,
    handleSelectAlert, handleMarkAllAsRead, handleDeleteAlert, handleCreateAlertFromModal, toggleRingtone,
  };
}
