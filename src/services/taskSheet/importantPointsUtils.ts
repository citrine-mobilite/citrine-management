import { Employee, NotificationLog, Reminder } from '../../types';
import {
  enumerateIsoDatesInRange,
  getEmployeeRemindersForDate,
  parseReminderDurationMinutes,
} from '../reminders/reminderActivityUtils';
import { isRoutineReminder } from '../reminders/routineSchedulerHelpers';
import { getLocalMovements } from '../taskSheetMovementsService';

export type ImportantPointCategory = 'alerte' | 'rappel' | 'mouvement';

export interface TaskSheetImportantPoint {
  id: string;
  category: ImportantPointCategory;
  categoryLabel: 'Alerte' | 'Rappel' | 'Petit mouvement';
  title: string;
  detail?: string;
  time: string;
  date: string;
  durationMinutes: number;
  statusLabel: string;
  location?: string;
  source?: string;
  isResolved?: boolean;
  isOverdue?: boolean;
  isQuickMovement?: boolean;
}

export interface ImportantPointsPeriodSummary {
  totalPoints: number;
  alertsCount: number;
  remindersCount: number;
  movementsCount: number;
  resolvedCount: number;
  overdueCount: number;
  totalMinutes: number;
  totalHours: number;
  recentItems: TaskSheetImportantPoint[];
}

function normalizeStr(val?: unknown): string {
  return String(val ?? '').trim().toLowerCase();
}

function parseNotifPayload(notif: NotificationLog): Record<string, any> | null {
  if (!notif?.payload) return null;
  if (typeof notif.payload === 'object') return notif.payload as Record<string, any>;
  try {
    return JSON.parse(String(notif.payload));
  } catch {
    return null;
  }
}

export function doesNotificationTargetEmployee(
  notif: NotificationLog,
  employee: Employee
): boolean {
  if (!notif || !employee) return false;
  const empId = normalizeStr(employee.id);
  const empName = normalizeStr(employee.name);
  const empEmail = normalizeStr(employee.email);
  const empCode = normalizeStr((employee as any).code);
  const matchToken = (val: unknown) => {
    const clean = normalizeStr(val);
    if (!clean) return false;
    return (
      (empId && clean === empId) ||
      (empName && (clean === empName || clean.includes(empName))) ||
      (empEmail && clean === empEmail) ||
      (empCode && clean === empCode)
    );
  };

  if (matchToken(notif.targetUserId) || matchToken(notif.recipient)) {
    return true;
  }

  const payload = parseNotifPayload(notif);
  if (payload) {
    if (
      matchToken(payload.employeeId) ||
      matchToken(payload.recipientId) ||
      matchToken(payload.assignedTo) ||
      matchToken(payload.employeeName)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Filtre strict : uniquement les vraies Alertes (alertes personnelles, incidents de présence/retard,
 * alertes terrain/urgences), à l'exclusion des logs techniques ou emails de confirmation génériques.
 */
export function isRealAlertNotification(notif: NotificationLog): boolean {
  if (!notif) return false;
  const idLower = normalizeStr(notif.id);
  const titleLower = normalizeStr(notif.title);
  const contentLower = normalizeStr(notif.content || notif.message);
  const payload = parseNotifPayload(notif);
  const sourceLower = normalizeStr(payload?.source);

  // Exclure les logs e-mails / confirmations automatiques non alertes
  if (
    notif.type === 'email' &&
    !titleLower.includes('alerte') &&
    !titleLower.includes('incident') &&
    !titleLower.includes('retard') &&
    !titleLower.includes('urgent')
  ) {
    return false;
  }
  if (
    titleLower.includes('tasksheet transmis') ||
    titleLower.includes('nouvelle connexion') ||
    titleLower.includes('session ouverte')
  ) {
    return false;
  }

  if (
    sourceLower === 'personal_alert' ||
    sourceLower === 'attendance_incident' ||
    sourceLower === 'alert' ||
    sourceLower === 'manual_alert' ||
    sourceLower === 'reminder_alarm' ||
    sourceLower === 'task_movement' ||
    idLower.startsWith('notif-rem-') ||
    idLower.startsWith('notif-inc-') ||
    idLower.startsWith('notif-alert-')
  ) {
    return true;
  }

  if (sourceLower === 'pointage' || sourceLower === 'kiosk') {
    return (
      titleLower.includes('retard') ||
      titleLower.includes('absence') ||
      titleLower.includes('manquement') ||
      titleLower.includes('incident') ||
      titleLower.includes('alerte')
    );
  }

  if (
    titleLower.includes('alerte') ||
    titleLower.includes('rappel') ||
    titleLower.includes('incident') ||
    titleLower.includes('retard') ||
    titleLower.includes('urgent') ||
    contentLower.includes('alerte urgente')
  ) {
    return true;
  }

  return false;
}

export function mergeRemindersWithLocalMovements(
  reminders: Reminder[] = [],
  employeeId?: string
): Reminder[] {
  const localMovements = typeof window !== 'undefined' ? getLocalMovements(employeeId) : [];
  if (localMovements.length === 0) return reminders || [];
  const existingIds = new Set((reminders || []).map((r) => String(r.id)));
  const extras = localMovements.filter((m) => !existingIds.has(String(m.id)));
  return [...(reminders || []), ...extras];
}

function classifyReminderPoint(r: Reminder): {
  category: ImportantPointCategory;
  categoryLabel: TaskSheetImportantPoint['categoryLabel'];
} {
  if (r.kind === 'movement' || String(r.id || '').startsWith('mov-')) {
    return { category: 'mouvement', categoryLabel: 'Petit mouvement' };
  }
  if (
    r.kind === 'alarm' ||
    (String(r.id || '').startsWith('rem-') && !isRoutineReminder(r) && r.kind !== 'deadline')
  ) {
    return { category: 'alerte', categoryLabel: 'Alerte' };
  }
  return { category: 'rappel', categoryLabel: 'Rappel' };
}

export function buildDailyImportantPoints(params: {
  employee: Employee;
  dateIso: string;
  reminders?: Reminder[];
  notifications?: NotificationLog[];
}): TaskSheetImportantPoint[] {
  const { employee, dateIso, reminders = [], notifications = [] } = params;
  const mergedReminders = mergeRemindersWithLocalMovements(reminders, employee.id);
  const dayReminders = getEmployeeRemindersForDate(mergedReminders, employee, dateIso);

  const points: TaskSheetImportantPoint[] = [];
  const coveredReminderIds = new Set<string>();

  dayReminders.forEach((act) => {
    coveredReminderIds.add(String(act.id));
    const { category, categoryLabel } = classifyReminderPoint(act.reminder);
    const isMovement = category === 'mouvement';
    const isResolved = act.isResolved;
    const statusLabel = isMovement
      ? isResolved
        ? 'Effectué'
        : 'À suivre'
      : act.statusLabel;

    points.push({
      id: act.id,
      category,
      categoryLabel,
      title: act.title,
      detail: act.reminder.note || act.reminder.description,
      time: act.time || '09:00',
      date: dateIso,
      durationMinutes: act.durationMinutes,
      statusLabel,
      location: act.location,
      source: isMovement ? 'Petit mouvement' : act.routineType || act.kind,
      isResolved,
      isOverdue: act.isOverdue,
      isQuickMovement: isMovement,
    });
  });

  (notifications || []).forEach((notif) => {
    const tsDate = String(notif.timestamp || '').split('T')[0];
    if (tsDate !== dateIso) return;
    if (!doesNotificationTargetEmployee(notif, employee)) return;
    if (!isRealAlertNotification(notif)) return;

    const payload = parseNotifPayload(notif);
    if (payload?.reminderId && coveredReminderIds.has(String(payload.reminderId))) {
      return;
    }

    const timePart =
      notif.timestamp && notif.timestamp.length >= 16 && notif.timestamp.includes('T')
        ? notif.timestamp.slice(11, 16)
        : '09:00';
    const isTaskMovement = payload?.source === 'task_movement';

    points.push({
      id: notif.id,
      category: isTaskMovement ? 'mouvement' : 'alerte',
      categoryLabel: isTaskMovement ? 'Petit mouvement' : 'Alerte',
      title: notif.title || 'Alerte signalée',
      detail: notif.content || notif.message || undefined,
      time: timePart,
      date: dateIso,
      durationMinutes: 10,
      statusLabel: notif.read ? 'Pris en compte' : 'Signalée',
      source: payload?.source || notif.type || 'alerte',
      isResolved: Boolean(notif.read),
      isOverdue: false,
      isQuickMovement: false,
    });
  });

  return points.sort((a, b) => a.time.localeCompare(b.time));
}

export function computeImportantPointsPeriodSummary(params: {
  employee: Employee;
  startIso: string;
  endIso: string;
  reminders?: Reminder[];
  notifications?: NotificationLog[];
  maxRecentItems?: number;
}): ImportantPointsPeriodSummary {
  const {
    employee,
    startIso,
    endIso,
    reminders = [],
    notifications = [],
    maxRecentItems = 15,
  } = params;

  const days = enumerateIsoDatesInRange(startIso, endIso, 370);
  const allPoints: TaskSheetImportantPoint[] = [];

  days.forEach((dayIso) => {
    const dayPoints = buildDailyImportantPoints({
      employee,
      dateIso: dayIso,
      reminders,
      notifications,
    });
    allPoints.push(...dayPoints);
  });

  // Deduplicate alert notifications just in case, while keeping daily recurring reminder occurrences
  const alertsCount = allPoints.filter((p) => p.category === 'alerte').length;
  const remindersCount = allPoints.filter((p) => p.category === 'rappel').length;
  const movementsCount = allPoints.filter((p) => p.category === 'mouvement').length;
  const resolvedCount = allPoints.filter((p) => p.isResolved).length;
  const overdueCount = allPoints.filter((p) => p.isOverdue).length;
  const totalMinutes = allPoints.reduce((sum, p) => sum + (p.durationMinutes || 0), 0);

  const recentItems = [...allPoints]
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.time.localeCompare(a.time);
    })
    .slice(0, maxRecentItems);

  return {
    totalPoints: allPoints.length,
    alertsCount,
    remindersCount,
    movementsCount,
    resolvedCount,
    overdueCount,
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    recentItems,
  };
}

export function computeMovementMinutes(reminder: Reminder): number {
  return parseReminderDurationMinutes(reminder.duration, reminder.kind, reminder.routineType);
}
