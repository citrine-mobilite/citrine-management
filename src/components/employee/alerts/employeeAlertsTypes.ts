import { Employee, AppUser, NotificationLog, Reminder } from '../../../types';
import {
  formatNextOccurrenceBadge,
  formatRoutineRecurrenceLabel,
  isRoutineReminder,
} from '../../../services/reminderService';

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

export function formatExactTimestamp(ts?: string): string {
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

export function matchesEmployeeIdentifier(
  val: string | null | undefined,
  employeeProfile: Employee,
  currentUser?: AppUser | null
): boolean {
  if (!val) return true;
  const clean = String(val).trim().toLowerCase();
  if (['tous', 'employe', 'employés', 'collaborateur', 'collaborateurs', 'général', 'general', 'direction rh & responsables'].includes(clean)) {
    return true;
  }
  const myIds = [employeeProfile.id, currentUser?.id, (employeeProfile as any).code]
    .filter(Boolean)
    .map((s) => String(s).trim().toLowerCase());
  const myNames = [employeeProfile.name, currentUser?.name]
    .filter(Boolean)
    .map((s) => String(s).trim().toLowerCase());
  const myEmails = [employeeProfile.email, currentUser?.email]
    .filter(Boolean)
    .map((s) => String(s).trim().toLowerCase());

  return myIds.includes(clean) || myNames.includes(clean) || myEmails.includes(clean);
}

export function addAlertIdVariants(targetSet: Set<string>, id: string) {
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
}

export function buildPersonalAlertsList(params: {
  reminders: Reminder[];
  notifications: NotificationLog[];
  employeeProfile: Employee;
  currentUser?: AppUser | null;
  readAlertIds: Set<string>;
  deletedAlertIds: Set<string>;
}): PersonalAlert[] {
  const { reminders, notifications, employeeProfile, currentUser, readAlertIds, deletedAlertIds } = params;
  const isEmployeeMatch = (val?: string | null) => matchesEmployeeIdentifier(val, employeeProfile, currentUser);
  const list: PersonalAlert[] = [];
  const seenIds = new Set<string>();

  const periodsLabels: Record<string, string> = {
    exact: "À l'heure exacte",
    '5m': '5 min avant',
    '15m': '15 min avant',
    '30m': '30 min avant',
    '1h': '1h avant',
  };

  reminders.forEach((r) => {
    const isForMe =
      r.allEmployees ||
      (r.employeeId && isEmployeeMatch(r.employeeId)) ||
      (r.employeeIds && r.employeeIds.some((id) => isEmployeeMatch(id)));

    if (!isForMe || deletedAlertIds.has(r.id) || seenIds.has(r.id)) return;
    seenIds.add(r.id);

    const periodsText =
      r.triggerPeriods && r.triggerPeriods.length > 0
        ? r.triggerPeriods.map((p) => periodsLabels[p] || p).join(', ')
        : "À l'heure exacte";

    if (isRoutineReminder(r)) {
      const scheduleText = formatRoutineRecurrenceLabel(r);
      const nextOccurrence = formatNextOccurrenceBadge(r);
      const locationText = r.location ? ` • Lieu : ${r.location}` : '';
      const noteText = r.note || r.description || 'Rappel récurrent';

      list.push({
        id: r.id,
        title: r.title || 'Rappel récurrent',
        message: `${scheduleText}${locationText} • ${noteText} • Rappels : ${periodsText}`,
        type: 'info',
        timestamp: r.stopped ? 'En pause' : nextOccurrence.label,
        read: readAlertIds.has(r.id) || !!r.stopped,
        actionUrl: '#employee/alerts',
        category: 'Alerte',
      });
      return;
    }

    list.push({
      id: r.id,
      title: r.title || 'Alerte Programmée',
      message: `${r.note || r.description || 'Alerte'}${r.date && r.time ? ` • Prévue le ${r.date} à ${r.time}` : ''} • Périodes: ${periodsText}`,
      type: 'warning',
      timestamp: r.date && r.time ? `${r.date} ${r.time}` : r.createdAt ? r.createdAt.slice(0, 10) : 'Programmé',
      read: readAlertIds.has(r.id) || !!r.stopped,
      actionUrl: '#employee/alerts',
      category: 'Alerte',
    });
  });

  notifications.forEach((notif) => {
    let isForMe = isEmployeeMatch(notif.recipient);
    let payloadObj: any = null;
    if (notif.payload) {
      try {
        payloadObj = typeof notif.payload === 'string' ? JSON.parse(notif.payload) : notif.payload;
        if (
          payloadObj &&
          (isEmployeeMatch(payloadObj.employeeId) ||
            isEmployeeMatch(payloadObj.recipientId) ||
            isEmployeeMatch(payloadObj.assignedTo))
        ) {
          isForMe = true;
        }
      } catch {}
    }

    if (!isForMe || deletedAlertIds.has(notif.id) || seenIds.has(notif.id)) return;
    seenIds.add(notif.id);

    let cat: PersonalAlert['category'] = 'Alerte';
    let actionUrl = '#employee/alerts';
    let alertType: PersonalAlert['type'] = 'info';

    const titleLower = (notif.title || '').toLowerCase();
    const contentLower = (notif.content || '').toLowerCase();

    if (
      payloadObj?.source === 'pointage' ||
      payloadObj?.source === 'kiosk' ||
      payloadObj?.source === 'attendance_incident' ||
      titleLower.includes('pointage') ||
      titleLower.includes('signalement rh')
    ) {
      cat = 'Pointage';
      actionUrl = '#employee/incidents';
      alertType = titleLower.includes('retard') || titleLower.includes('absence') || titleLower.includes('manquement') ? 'urgent' : 'info';
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
  });

  return list;
}
