import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckSquare, 
  CheckCircle2, 
  CheckCheck,
  Volume2, 
  VolumeX, 
  Plus, 
  X, 
  Filter,
  ShieldAlert,
  Info,
  Search,
  ChevronDown,
  ChevronUp,
  LayoutList,
  LayoutGrid,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';
import { Employee, AppUser, Task, AttendanceIncident, NotificationLog, Presence } from '../../types';
import { soundService } from '../../services/soundService';
import { AlertCreateModal } from './AlertCreateModal';

interface EmployeeAlertsTabProps {
  employeeProfile: Employee;
  currentUser?: AppUser | null;
  tasks: Task[];
  onUpdateTasks?: (tasks: Task[]) => void;
  employees?: Employee[];
  incidents: AttendanceIncident[];
  notifications?: NotificationLog[];
  presences?: Presence[];
  onAddNotification?: (log: NotificationLog) => void;
  onUpdateNotifications?: (logs: NotificationLog[]) => void;
  onAlertsReadChange?: (unreadCount: number) => void;
}

export interface PersonalAlert {
  id: string;
  title: string;
  message: string;
  type: 'urgent' | 'warning' | 'info' | 'task' | 'incident';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  category: 'Tâche' | 'Pointage' | 'Sécurité' | 'Alerte' | 'Note' | 'Congés';
}

const STORAGE_KEY_READ_ALERTS = 'citrine_read_alerts_ids';
const STORAGE_KEY_CUSTOM_ALERTS = 'citrine_custom_alerts_list';

function formatExactTimestamp(ts?: string): string {
  if (!ts) return 'Récemment';
  try {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `le ${day} ${month} ${year} à ${hours}h${minutes} ${seconds} secondes`;
    }
  } catch {}
  return ts;
}

export const EmployeeAlertsTab: React.FC<EmployeeAlertsTabProps> = ({
  employeeProfile,
  currentUser,
  tasks,
  onUpdateTasks,
  employees,
  incidents,
  notifications = [],
  presences = [],
  onAddNotification,
  onUpdateNotifications,
  onAlertsReadChange,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent' | 'task' | 'incident' | 'leaves'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewDensity, setViewDensity] = useState<'compact' | 'detailed'>('compact');
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [isRinging, setIsRinging] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAlertModal, setSelectedAlertModal] = useState<PersonalAlert | null>(null);
  
  // Form fields
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState<'urgent' | 'warning' | 'info'>('warning');

  // Persistent Set of read alert IDs
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_READ_ALERTS);
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  // Custom user-created alerts persisted in localStorage
  const [userCreatedAlerts, setUserCreatedAlerts] = useState<PersonalAlert[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_ALERTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Deleted alerts IDs blacklist
  const [deletedAlertIds, setDeletedAlertIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('citrine_deleted_alerts_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  // Employee identification matching (includes broadcast or personal notifications)
  const isEmployeeMatch = (val?: string | null): boolean => {
    if (!val) return true;
    const clean = String(val).trim().toLowerCase();
    if (['tous', 'employe', 'employés', 'collaborateur', 'collaborateurs', 'général', 'general', 'direction rh & responsables'].includes(clean)) {
      return true;
    }
    const myIds = [
      employeeProfile.id,
      currentUser?.id,
      (employeeProfile as any).code,
    ].filter(Boolean).map(s => String(s).trim().toLowerCase());

    const myNames = [
      employeeProfile.name,
      currentUser?.name,
    ].filter(Boolean).map(s => String(s).trim().toLowerCase());

    const myEmails = [
      employeeProfile.email,
      currentUser?.email,
    ].filter(Boolean).map(s => String(s).trim().toLowerCase());

    return myIds.includes(clean) || myNames.includes(clean) || myEmails.includes(clean);
  };

  // Build the unified list of alerts from notifications, presences, tasks, incidents, and custom items
  const allAlerts: PersonalAlert[] = useMemo(() => {
    const list: PersonalAlert[] = [];
    const seenIds = new Set<string>();

    // 1. PERSISTED NOTIFICATION LOGS (Strictly filtered for this employee)
    notifications.forEach((notif) => {
      let isForMe = isEmployeeMatch(notif.recipient);

      let payloadObj: any = null;
      if (notif.payload) {
        try {
          payloadObj = typeof notif.payload === 'string' ? JSON.parse(notif.payload) : notif.payload;
          if (payloadObj && (
            isEmployeeMatch(payloadObj.employeeId) ||
            isEmployeeMatch(payloadObj.recipientId) ||
            isEmployeeMatch(payloadObj.assignedTo)
          )) {
            isForMe = true;
          }
        } catch {}
      }

      // If this notification is addressed to someone else, do NOT display it to this employee!
      if (!isForMe) return;

      if (!deletedAlertIds.has(notif.id) && !seenIds.has(notif.id)) {
        seenIds.add(notif.id);

        let cat: PersonalAlert['category'] = 'Alerte';
        let actionUrl = '#employee/alerts';
        let alertType: PersonalAlert['type'] = 'info';

        const titleLower = (notif.title || '').toLowerCase();
        const contentLower = (notif.content || '').toLowerCase();

        if (
          payloadObj?.source === 'pointage' || 
          payloadObj?.source === 'kiosk' || 
          payloadObj?.source === 'admin_on_behalf' ||
          titleLower.includes('pointage')
        ) {
          cat = 'Pointage';
          actionUrl = '#employee/presences';
          alertType = titleLower.includes('retard') ? 'urgent' : 'info';
        } else if (
          payloadObj?.source === 'task_movement' || 
          payloadObj?.source === 'task_created' || 
          notif.id.startsWith('notif-task') || 
          titleLower.includes('tâche')
        ) {
          cat = 'Tâche';
          actionUrl = '#employee/tasks';
          alertType = titleLower.includes('urgent') || contentLower.includes('haute') ? 'urgent' : 'task';
        } else if (
          payloadObj?.source === 'attendance_incident' || 
          payloadObj?.source === 'incident_auto' || 
          payloadObj?.source === 'incident_declaration' || 
          payloadObj?.source === 'incident_manual' ||
          titleLower.includes('signalement') || 
          titleLower.includes('incident')
        ) {
          cat = 'Pointage';
          actionUrl = '#employee/incidents';
          alertType = 'incident';
        } else if (
          payloadObj?.source === 'leave_decision' || 
          payloadObj?.source === 'leave_request' || 
          notif.id.startsWith('notif-leave') || 
          titleLower.includes('congé') || 
          titleLower.includes('permission')
        ) {
          cat = 'Congés';
          actionUrl = '#employee/leaves';
          alertType = titleLower.includes('refusée') ? 'urgent' : 'info';
        }

        list.push({
          id: notif.id,
          title: notif.title || 'Notification Citrine',
          message: notif.content || notif.payload || '',
          type: alertType,
          timestamp: notif.timestamp ? notif.timestamp.slice(11, 16) || notif.timestamp : 'Récent',
          read: readAlertIds.has(notif.id) || !!notif.read,
          actionUrl,
          category: cat,
        });
      }
    });

    // 2. ATTENDANCE INCIDENTS (Uniquement si aucun log de notification n'a déjà couvert cet incident)
    incidents
      .filter((inc) => isEmployeeMatch(inc.employeeId) || isEmployeeMatch(inc.employeeName))
      .forEach((inc) => {
        // Vérifier si un log de notification pour cet incident existe déjà dans la liste
        const alreadyCoveredInNotifs = list.some((item) => {
          return item.id.includes(inc.id) || 
            (item.message && item.message.includes(inc.id)) ||
            (inc.date && item.message && item.message.includes(inc.date) && item.category === 'Pointage');
        });

        if (alreadyCoveredInNotifs) return;

        const id = `inc-alert-${inc.id}`;
        if (!deletedAlertIds.has(id) && !seenIds.has(id)) {
          seenIds.add(id);
          const typeLabel = 
            inc.type === 'retard' ? 'Retard constaté' :
            inc.type === 'sortie_prematuree' || inc.type === 'depart_anticipe' ? 'Sortie prématurée' :
            (inc.type as string) === 'absence_injustifiee' ? 'Absence constatée' :
            'Signalement RH';

          list.push({
            id,
            title: `Signalement RH : ${typeLabel}`,
            message: `${inc.reason || 'Anomalie de présence consignée'}. Statut : ${inc.status || 'Enregistré'}.`,
            type: 'incident',
            timestamp: inc.timeString ? `${inc.date || ''} ${inc.timeString}` : (inc.date || 'Récent'),
            read: readAlertIds.has(id),
            actionUrl: '#employee/incidents',
            category: 'Pointage',
          });
        }
      });

    // 3. TÂCHES ASSIGNÉES (Uniquement si pas déjà notifiée dans les notifications système)
    tasks
      .filter((t) => isEmployeeMatch(t.assignedTo) || isEmployeeMatch(t.employeeId))
      .forEach((t) => {
        const alreadyCoveredInNotifs = list.some((item) => {
          return item.id.includes(t.id) || (item.title && item.title.includes(t.title));
        });

        if (alreadyCoveredInNotifs) return;

        const id = `task-alert-${t.id}`;
        if (!deletedAlertIds.has(id) && !seenIds.has(id)) {
          seenIds.add(id);
          const isUrgent = t.priority === 'urgent' || t.priority === 'high';
          const statusText = t.status === 'completed' ? 'Terminée ✓' : t.status === 'in_progress' ? 'En cours' : 'À faire';
          list.push({
            id,
            title: `Tâche [${statusText}] : ${t.title}`,
            message: `Échéance : ${t.date || 'Non définie'} ${t.time || ''}. ${t.description || 'Suivi et mouvement de tâche.'}`,
            type: isUrgent ? 'urgent' : 'task',
            timestamp: t.time || (t.date || 'Aujourd\'hui'),
            read: readAlertIds.has(id),
            actionUrl: '#employee/tasks',
            category: 'Tâche',
          });
        }
      });

    // 5. Notes & Alertes personnelles créées par l'employé
    userCreatedAlerts.forEach((a) => {
      if (!deletedAlertIds.has(a.id) && !seenIds.has(a.id)) {
        seenIds.add(a.id);
        list.push({
          ...a,
          read: readAlertIds.has(a.id),
        });
      }
    });

    // 6. Message d'accueil par défaut si aucune alerte n'existe
    if (list.length === 0) {
      list.push({
        id: 'system-welcome-1',
        title: 'Bienvenue dans votre Espace Collaborateur',
        message: 'Vos alertes de pointage, mouvements de tâches et signalements apparaîtront ici dès leur survenue.',
        type: 'info',
        timestamp: 'En service',
        read: true,
        category: 'Alerte',
      });
    }

    return list;
  }, [notifications, incidents, tasks, presences, employeeProfile, currentUser, userCreatedAlerts, readAlertIds, deletedAlertIds]);

  // Compute unread count
  const unreadCount = useMemo(() => {
    return allAlerts.filter((a) => !a.read).length;
  }, [allAlerts]);

  // Notify parent and update badge in real time
  useEffect(() => {
    if (onAlertsReadChange) {
      onAlertsReadChange(unreadCount);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('citrine:alerts_read_updated', { detail: { unreadCount } }));
    }
  }, [unreadCount, onAlertsReadChange]);

  // Save read alert IDs to localStorage
  const saveReadIds = (newSet: Set<string>) => {
    setReadAlertIds(newSet);
    try {
      localStorage.setItem(STORAGE_KEY_READ_ALERTS, JSON.stringify(Array.from(newSet)));
    } catch {}
  };

  // Helper to add all variant presence IDs so all listeners stay in sync
  const addIdVariants = (targetSet: Set<string>, id: string) => {
    targetSet.add(id);
    if (id.startsWith('clock-arr-')) {
      targetSet.add(`clock-arrivalTime-${id.replace('clock-arr-', '')}`);
    } else if (id.startsWith('clock-arrivalTime-')) {
      targetSet.add(`clock-arr-${id.replace('clock-arrivalTime-', '')}`);
    } else if (id.startsWith('clock-pstart-')) {
      targetSet.add(`clock-pauseStart-${id.replace('clock-pstart-', '')}`);
    } else if (id.startsWith('clock-pauseStart-')) {
      targetSet.add(`clock-pstart-${id.replace('clock-pauseStart-', '')}`);
    } else if (id.startsWith('clock-pend-')) {
      targetSet.add(`clock-pauseEnd-${id.replace('clock-pend-', '')}`);
    } else if (id.startsWith('clock-pauseEnd-')) {
      targetSet.add(`clock-pend-${id.replace('clock-pauseEnd-', '')}`);
    } else if (id.startsWith('clock-dept-')) {
      targetSet.add(`clock-departureTime-${id.replace('clock-dept-', '')}`);
    } else if (id.startsWith('clock-departureTime-')) {
      targetSet.add(`clock-dept-${id.replace('clock-departureTime-', '')}`);
    }
  };

  // Mark single alert as read (permanent: once read, cannot be unread)
  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (readAlertIds.has(id)) return;
    const next = new Set<string>(readAlertIds);
    addIdVariants(next, id);

    try {
      if (typeof soundService?.playPointageSuccess === 'function') {
        soundService.playPointageSuccess();
      }
    } catch {}
    saveReadIds(next);

    // If matching a notification, mark it as read in parent / database
    if (onUpdateNotifications && notifications.some((n) => n.id === id && !n.read)) {
      const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      onUpdateNotifications(updated);
    }
  };

  // Select alert to open detail modal and automatically mark as read
  const handleSelectAlert = (alert: PersonalAlert) => {
    setSelectedAlertModal(alert);
    if (!alert.read) {
      handleMarkAsRead(alert.id);
    }
  };

  // Mark all alerts as read (exhaustive across allAlerts and notifications)
  const handleMarkAllAsRead = () => {
    const next = new Set<string>(readAlertIds);
    allAlerts.forEach((a) => {
      addIdVariants(next, a.id);
    });
    saveReadIds(next);

    try {
      if (typeof soundService?.playAlertNotification === 'function') {
        soundService.playAlertNotification(0.5);
      }
    } catch {}

    // Persist read status for all matching notifications in Firestore
    if (onUpdateNotifications && notifications.length > 0) {
      let hasChanges = false;
      const updated = notifications.map((n) => {
        if (isEmployeeMatch(n.recipient)) {
          if (!n.read) hasChanges = true;
          return { ...n, read: true };
        }
        return n;
      });
      if (hasChanges) {
        onUpdateNotifications(updated);
      }
    }

    // Force dispatch immediate 0 unread badge
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('citrine:alerts_read_updated', { detail: { unreadCount: 0 } }));
    }
    if (onAlertsReadChange) {
      onAlertsReadChange(0);
    }
  };

  // Create alert from AlertCreateModal
  const handleCreateAlertFromModal = (alertData: {
    title: string;
    message: string;
    type: 'urgent' | 'warning' | 'info';
    category: 'Alerte' | 'Pointage' | 'Sécurité' | 'Congés';
  }) => {
    const nowIso = new Date().toISOString();
    const alertItem: PersonalAlert = {
      id: `custom-alert-${Date.now()}`,
      title: alertData.title,
      message: alertData.message,
      type: alertData.type,
      timestamp: nowIso,
      read: false,
      category: alertData.category,
      actionUrl: '#employee/alerts',
    };
    const updated = [alertItem, ...userCreatedAlerts];
    setUserCreatedAlerts(updated);
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_ALERTS, JSON.stringify(updated));
    } catch {}

    if (onAddNotification) {
      onAddNotification({
        id: alertItem.id,
        type: 'system',
        recipient: employeeProfile.email || currentUser?.email || 'Collaborateur',
        title: alertItem.title,
        content: alertItem.message,
        payload: JSON.stringify({ source: 'personal_alert' }),
        timestamp: nowIso,
      });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('citrine:push_notification', {
        detail: { title: alertItem.title, message: alertItem.message, type: alertItem.type, timestamp: nowIso }
      }));
    }

    setShowCreateModal(false);
  };

  // Continuous ringtone toggle
  const toggleRingtone = () => {
    if (isRinging) {
      soundService.stopContinuousAlertRingtone();
      setIsRinging(false);
    } else {
      soundService.startContinuousAlertRingtone(0.5);
      setIsRinging(true);
    }
  };

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return allAlerts.filter((a) => {
      // Filter tab
      if (filter === 'unread' && a.read) return false;
      if (filter === 'urgent' && a.type !== 'urgent') return false;
      if (filter === 'task' && a.category !== 'Tâche') return false;
      if (filter === 'incident' && a.category !== 'Pointage') return false;

      // Text search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = a.title.toLowerCase().includes(query);
        const matchesMsg = a.message.toLowerCase().includes(query);
        const matchesCat = a.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesMsg && !matchesCat) return false;
      }

      return true;
    });
  }, [allAlerts, filter, searchQuery]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 max-w-5xl mx-auto pb-10">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl shrink-0">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900">
                Centre de Notifications & Alertes
              </h2>
              {unreadCount > 0 ? (
                <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5 rounded-full font-semibold">
                  Toutes lues ✓
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Tâches prioritaires, signalements de présence et rappels personnels
            </p>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Mark all as read button */}
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
            title="Marquer toutes les alertes affichées comme lues"
          >
            <CheckCheck className="w-4 h-4 text-[#2A7B76]" />
            <span>Tout marquer lu</span>
          </button>

          {/* Density Switcher */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200 text-xs">
            <button
              type="button"
              onClick={() => setViewDensity('compact')}
              title="Vue Compacte (gain de place)"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewDensity === 'compact' ? 'bg-white text-stone-800 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewDensity('detailed')}
              title="Vue Détaillée"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewDensity === 'detailed' ? 'bg-white text-stone-800 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Continuous Ringtone Toggle */}
          <button
            type="button"
            onClick={toggleRingtone}
            className={`p-2 rounded-xl border transition cursor-pointer active:scale-95 ${
              isRinging
                ? 'bg-red-600 text-white border-red-700 animate-pulse'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border-stone-200'
            }`}
            title="Tester la sonnerie d'alerte continue"
          >
            {isRinging ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-amber-600" />}
          </button>

          {/* Create Alert button */}
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="bg-[#2A7B76] hover:bg-[#20615d] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Créer une alerte</span>
          </button>
        </div>
      </div>

      {/* Filter and Quick Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Filter Pills with Counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-stone-100 rounded-2xl border border-stone-200 text-xs">
          {[
            { id: 'all', label: 'Toutes', count: allAlerts.length },
            { id: 'unread', label: 'Non lues', count: unreadCount },
            { id: 'urgent', label: 'Urgentes', count: allAlerts.filter((a) => a.type === 'urgent').length },
            { id: 'task', label: 'Tâches', count: allAlerts.filter((a) => a.category === 'Tâche').length },
            { id: 'incident', label: 'Pointage', count: allAlerts.filter((a) => a.category === 'Pointage').length },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                filter === item.id
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>{item.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                filter === item.id ? 'bg-stone-100 text-stone-800' : 'bg-stone-200/70 text-stone-600'
              }`}>
                {item.count}
              </span>
            </button>
          ))}
        </div>

        {/* Quick Search */}
        <div className="relative sm:w-64">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une notification..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#2A7B76]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Notification Items List */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-stone-200 shadow-2xs space-y-2.5">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-stone-800 text-sm">Aucune alerte à afficher</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchQuery
              ? `Aucun résultat pour "${searchQuery}". Essayez un autre mot-clé.`
              : 'Toutes vos notifications sont à jour pour ce filtre.'}
          </p>
        </div>
      ) : viewDensity === 'compact' ? (
        /* ================= VUE COMPACTE (OPTIMISÉE EN ESPACE) ================= */
        <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 shadow-2xs overflow-hidden">
          {filteredAlerts.map((alert) => {
            const isExpanded = expandedAlertId === alert.id;
            const isUrgent = alert.type === 'urgent';
            const isIncident = alert.type === 'incident';

            return (
              <div
                key={alert.id}
                onClick={() => handleSelectAlert(alert)}
                className={`group px-4 py-3 transition-colors cursor-pointer flex flex-col ${
                  !alert.read
                    ? isUrgent
                      ? 'bg-red-50/40 hover:bg-red-50/70'
                      : 'bg-amber-50/30 hover:bg-amber-50/60'
                    : 'bg-white hover:bg-stone-50/80'
                }`}
              >
                {/* One-line compact row */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  {/* Left: Indicator Dot & Category Icon */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        !alert.read
                          ? isUrgent
                            ? 'bg-red-500 ring-4 ring-red-200/60'
                            : 'bg-amber-500 ring-4 ring-amber-200/60'
                          : 'bg-stone-300'
                      }`}
                      title={alert.read ? 'Lue' : 'Non lue'}
                    />

                    <div className="p-1 rounded-lg bg-stone-100 text-stone-600 shrink-0">
                      {isUrgent ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                      ) : isIncident ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      ) : alert.category === 'Tâche' ? (
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </div>

                    {/* Title & Preview */}
                    <div className="min-w-0 flex items-center gap-2 truncate">
                      <span className={`truncate text-xs ${!alert.read ? 'font-bold text-stone-900' : 'font-medium text-stone-700'}`}>
                        {alert.title}
                      </span>
                      <span className="hidden md:inline text-stone-400">·</span>
                      <span className="hidden md:inline text-[11px] text-stone-500 truncate max-w-sm">
                        {alert.message}
                      </span>
                    </div>

                    {/* Category pill */}
                    <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-100 text-stone-600">
                      {alert.category}
                    </span>
                  </div>

                  {/* Right: Timestamp & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-stone-400">
                      {alert.timestamp}
                    </span>

                    {/* Read status indicator */}
                    {alert.read ? (
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5" /> Lu
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-bold">Non lue</span>
                    )}

                    {/* Direct deep-link action button */}
                    {alert.actionUrl && (
                      <a
                        href={alert.actionUrl}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-[#2A7B76] text-stone-600 hover:text-white text-[11px] font-bold transition flex items-center gap-1"
                        title="Consulter l'élément"
                      >
                        <span className="hidden sm:inline">Voir</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {/* Accordion indicator */}
                    <div className="text-stone-400">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded details view */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2.5 border-t border-stone-200/60 pl-6 text-xs space-y-2 text-stone-700 animate-in fade-in duration-150">
                    <p className="leading-relaxed bg-white/70 p-2.5 rounded-xl border border-stone-200/60 text-xs">
                      {alert.message}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                      <span>Identifiant : <code className="font-mono text-[10px] text-stone-400">{alert.id}</code></span>
                      <span className="text-emerald-700 font-bold">Lue et enregistrée ✓</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= VUE DÉTAILLÉE (CARTES SPATIALES) ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredAlerts.map((alert) => {
            const isUrgent = alert.type === 'urgent';
            const isIncident = alert.type === 'incident';

            return (
              <div
                key={alert.id}
                onClick={() => handleSelectAlert(alert)}
                className={`bg-white rounded-2xl p-4 border shadow-2xs transition flex flex-col justify-between gap-3 cursor-pointer ${
                  !alert.read
                    ? isUrgent
                      ? 'border-red-300 bg-red-50/30'
                      : 'border-amber-300 bg-amber-50/20'
                    : 'border-stone-200 opacity-90'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          !alert.read ? 'bg-amber-500 ring-4 ring-amber-200/60' : 'bg-stone-300'
                        }`}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                        {alert.category}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400">{alert.timestamp}</span>
                  </div>

                  <h4 className={`text-xs font-bold ${!alert.read ? 'text-stone-900' : 'text-stone-700'}`}>
                    {alert.title}
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed bg-stone-50/60 p-2 rounded-xl border border-stone-100">
                    {alert.message}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    {alert.read ? '✓ Lue' : 'Non lue (cliquer pour lire)'}
                  </span>

                  {alert.actionUrl && (
                    <a
                      href={alert.actionUrl}
                      onClick={(e) => e.stopPropagation()}
                      className="px-2.5 py-1 rounded-lg bg-[#2A7B76] text-white font-bold text-xs flex items-center gap-1 hover:bg-[#20615d] transition"
                    >
                      <span>Consulter</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateAlert={handleCreateAlertFromModal}
      />

      {/* Modal for viewing complete alert details */}
      {selectedAlertModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${selectedAlertModal.type === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-[#2A7B76]'}`}>
                  {selectedAlertModal.type === 'urgent' ? <ShieldAlert className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                    {selectedAlertModal.category}
                  </span>
                  <h3 className="font-bold text-stone-900 text-sm mt-0.5">{selectedAlertModal.title}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlertModal(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 cursor-pointer transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">Message complet</label>
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 text-stone-800 text-xs leading-relaxed whitespace-pre-wrap">
                  {selectedAlertModal.message}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
                <span>Reçu <strong className="text-stone-700 font-mono">{formatExactTimestamp(selectedAlertModal.timestamp)}</strong></span>
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCheck className="w-4 h-4" /> Lue et enregistrée
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              {selectedAlertModal.actionUrl && (
                <a
                  href={selectedAlertModal.actionUrl}
                  onClick={() => setSelectedAlertModal(null)}
                  className="px-4 py-2 bg-[#2A7B76] hover:bg-[#20615d] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <span>Consulter l'élément</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={() => setSelectedAlertModal(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
