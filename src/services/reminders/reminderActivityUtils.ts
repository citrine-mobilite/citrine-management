import {
  Employee,
  MilestoneStatus,
  ProjectMilestone,
  Reminder,
  ReminderKind,
  ReminderRoutineType,
  StrategicProject,
} from '../../types';
import { getActiveWeekdays, resolveRecurrenceMode } from './routineSchedulerHelpers';
import { isManagerOrAdminEmployee } from '../../utils/roleUtils';

export interface EmployeeReminderActivity {
  id: string;
  title: string;
  time: string;
  durationMinutes: number;
  kind: ReminderKind;
  routineType?: ReminderRoutineType;
  location?: string;
  isResolved: boolean;
  isOverdue: boolean;
  statusLabel: 'Clôturé' | 'En retard' | 'Planifié';
  reminder: Reminder;
}

export interface EmployeeReminderPeriodStats {
  totalOccurrences: number;
  uniqueRemindersCount: number;
  resolvedCount: number;
  activeCount: number;
  overdueCount: number;
  totalMinutes: number;
  totalHours: number;
}

export interface StrategicMilestoneEntry {
  projectId: string;
  projectName: string;
  projectStatus: string;
  milestoneId: string;
  title: string;
  status: MilestoneStatus;
  targetDate?: string;
  completedAt?: string;
  ownerId?: string;
  ownerName?: string;
  isDone: boolean;
  isBlocked: boolean;
  isOverdue: boolean;
}

export function parseReminderDurationMinutes(
  duration?: string,
  kind?: ReminderKind,
  routineType?: ReminderRoutineType
): number {
  if (duration && typeof duration === 'string') {
    const clean = duration.trim().toLowerCase().replace(',', '.');
    const hm = clean.match(/(\d+(?:\.\d+)?)\s*h\s*(\d+)?/);
    if (hm) {
      const hours = parseFloat(hm[1]) || 0;
      const mins = hm[2] ? parseInt(hm[2], 10) || 0 : 0;
      const total = Math.round(hours * 60 + mins);
      if (total > 0) return total;
    }
    const minMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:min|mn|m)?/);
    if (minMatch) {
      const val = parseFloat(minMatch[1]);
      if (Number.isFinite(val) && val > 0) {
        return Math.round(val);
      }
    }
  }

  if (kind === 'movement') return 15;
  if (kind === 'deadline') return 20;
  if (routineType === 'reunion' || routineType === 'appel') return 45;
  if (routineType === 'brief') return 15;
  return 30;
}

export function isReminderRelevantToEmployee(
  reminder: Reminder,
  employee: Employee
): boolean {
  if (!reminder || !employee) return false;
  if (reminder.allEmployees) return true;

  const empIdStr = String(employee.id || '');
  const empNameLower = (employee.name || '').trim().toLowerCase();
  const empEmailLower = (employee.email || '').trim().toLowerCase();

  if (reminder.employeeId && String(reminder.employeeId) === empIdStr) {
    return true;
  }

  if (Array.isArray(reminder.employeeIds) && reminder.employeeIds.length > 0) {
    if (reminder.employeeIds.some((id) => String(id) === empIdStr)) {
      return true;
    }
    return false;
  }

  if (reminder.entityName && empNameLower) {
    const entityLower = reminder.entityName.trim().toLowerCase();
    if (entityLower === empNameLower || entityLower === empEmailLower) {
      return true;
    }
  }

  // Échéances administratives globales sans destinataire nominatif -> visibles pour responsables / admins
  if (
    reminder.kind === 'deadline' &&
    !reminder.employeeId &&
    (!reminder.employeeIds || reminder.employeeIds.length === 0) &&
    isManagerOrAdminEmployee(employee)
  ) {
    return true;
  }

  return false;
}

export function doesReminderOccurOnDate(
  reminder: Reminder,
  targetDateIso: string
): boolean {
  if (!reminder || reminder.stopped || !/^\d{4}-\d{2}-\d{2}$/.test(targetDateIso)) {
    return false;
  }

  const targetDateObj = new Date(`${targetDateIso}T12:00:00`);
  if (isNaN(targetDateObj.getTime())) return false;

  const mode = resolveRecurrenceMode(reminder);
  const explicitDate = (reminder.date || reminder.expirationDate || '').split('T')[0];

  if (mode === 'once') {
    return explicitDate === targetDateIso;
  }

  const startFloor =
    explicitDate && /^\d{4}-\d{2}-\d{2}$/.test(explicitDate)
      ? explicitDate
      : reminder.createdAt
      ? String(reminder.createdAt).split('T')[0]
      : '';

  if (startFloor && /^\d{4}-\d{2}-\d{2}$/.test(startFloor) && targetDateIso < startFloor) {
    return false;
  }

  const dayOfWeek = targetDateObj.getDay();
  const dayOfMonth = targetDateObj.getDate();

  if (mode === 'daily') return true;
  if (mode === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (mode === 'weekly_days') return getActiveWeekdays(reminder).includes(dayOfWeek);
  if (mode === 'monthly') {
    const baseDay = explicitDate ? Number(explicitDate.split('-')[2]) || 1 : 1;
    const lastDayOfMonth = new Date(
      targetDateObj.getFullYear(),
      targetDateObj.getMonth() + 1,
      0
    ).getDate();
    return dayOfMonth === Math.min(baseDay, lastDayOfMonth);
  }

  return false;
}

export function getEmployeeRemindersForDate(
  reminders: Reminder[],
  employee: Employee,
  dateIso: string
): EmployeeReminderActivity[] {
  const todayIso = new Date().toISOString().split('T')[0];

  return (reminders || [])
    .filter((r) => isReminderRelevantToEmployee(r, employee) && doesReminderOccurOnDate(r, dateIso))
    .map((r) => {
      const durationMinutes = parseReminderDurationMinutes(r.duration, r.kind, r.routineType);
      const isResolved = Boolean(r.isResolved || r.status === 'completed');
      const isOverdue = !isResolved && dateIso < todayIso;
      const statusLabel: EmployeeReminderActivity['statusLabel'] = isResolved
        ? 'Clôturé'
        : isOverdue
        ? 'En retard'
        : 'Planifié';

      return {
        id: r.id,
        title: r.title || 'Rappel / Rituel',
        time: r.time || '09:00',
        durationMinutes,
        kind: r.kind || 'routine',
        routineType: r.routineType,
        location: r.location,
        isResolved,
        isOverdue,
        statusLabel,
        reminder: r,
      };
    })
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function enumerateIsoDatesInRange(startIso: string, endIso: string, maxDays: number = 366): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startIso) || !/^\d{4}-\d{2}-\d{2}$/.test(endIso)) return [];
  if (endIso < startIso) return [];
  const res: string[] = [];
  const cur = new Date(`${startIso}T12:00:00`);
  const end = new Date(`${endIso}T12:00:00`);
  while (cur.getTime() <= end.getTime() && res.length < maxDays) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    res.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return res;
}

export function computeEmployeeReminderStatsInRange(
  reminders: Reminder[],
  employee: Employee,
  startIso?: string,
  endIso?: string
): EmployeeReminderPeriodStats {
  const relevant = (reminders || []).filter(
    (r) => !r.stopped && isReminderRelevantToEmployee(r, employee)
  );
  if (relevant.length === 0) {
    return {
      totalOccurrences: 0,
      uniqueRemindersCount: 0,
      resolvedCount: 0,
      activeCount: 0,
      overdueCount: 0,
      totalMinutes: 0,
      totalHours: 0,
    };
  }

  const todayIso = new Date().toISOString().split('T')[0];
  const effectiveStart =
    startIso && /^\d{4}-\d{2}-\d{2}$/.test(startIso)
      ? startIso
      : `${todayIso.slice(0, 7)}-01`;
  const effectiveEnd =
    endIso && /^\d{4}-\d{2}-\d{2}$/.test(endIso)
      ? endIso > todayIso && !startIso
        ? todayIso
        : endIso
      : todayIso;

  const days = enumerateIsoDatesInRange(effectiveStart, effectiveEnd);
  let totalOccurrences = 0;
  let totalMinutes = 0;
  let resolvedOccurrences = 0;
  let overdueOccurrences = 0;
  const matchedReminderIds = new Set<string>();

  if (days.length > 0) {
    days.forEach((dayIso) => {
      relevant.forEach((r) => {
        if (!doesReminderOccurOnDate(r, dayIso)) return;
        matchedReminderIds.add(r.id);
        totalOccurrences += 1;
        totalMinutes += parseReminderDurationMinutes(r.duration, r.kind, r.routineType);
        const isResolved = Boolean(r.isResolved || r.status === 'completed');
        if (isResolved) {
          resolvedOccurrences += 1;
        } else if (dayIso < todayIso) {
          overdueOccurrences += 1;
        }
      });
    });
  } else {
    relevant.forEach((r) => {
      matchedReminderIds.add(r.id);
      totalOccurrences += 1;
      totalMinutes += parseReminderDurationMinutes(r.duration, r.kind, r.routineType);
      const isResolved = Boolean(r.isResolved || r.status === 'completed');
      const dStr = (r.date || r.expirationDate || '').split('T')[0];
      if (isResolved) resolvedOccurrences += 1;
      else if (dStr && dStr < todayIso) overdueOccurrences += 1;
    });
  }

  return {
    totalOccurrences,
    uniqueRemindersCount: matchedReminderIds.size,
    resolvedCount: resolvedOccurrences,
    activeCount: Math.max(0, totalOccurrences - resolvedOccurrences),
    overdueCount: overdueOccurrences,
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
  };
}

export function isProjectMilestoneOwnedByEmployee(
  milestone: ProjectMilestone,
  employee: Employee
): boolean {
  if (!milestone || !employee) return false;
  if (milestone.ownerId && String(milestone.ownerId) === String(employee.id)) {
    return true;
  }
  const ownerName = (milestone.ownerName || '').trim().toLowerCase();
  const empName = (employee.name || '').trim().toLowerCase();
  if (ownerName && empName && (ownerName === empName || empName.includes(ownerName) || ownerName.includes(empName))) {
    return true;
  }
  return false;
}

export function extractStrategicMilestones(
  strategicProjects: StrategicProject[],
  employee?: Employee,
  periodStartIso?: string,
  periodEndIso?: string
): StrategicMilestoneEntry[] {
  const todayIso = new Date().toISOString().split('T')[0];
  const entries: StrategicMilestoneEntry[] = [];

  (strategicProjects || []).forEach((project) => {
    const milestones = Array.isArray(project.milestones) ? project.milestones : [];
    milestones.forEach((m) => {
      if (employee && !isProjectMilestoneOwnedByEmployee(m, employee)) {
        return;
      }

      if (periodStartIso && periodEndIso && m.targetDate) {
        const tDate = m.targetDate.split('T')[0];
        const compDate = m.completedAt ? m.completedAt.split('T')[0] : '';
        const inRange =
          (tDate >= periodStartIso && tDate <= periodEndIso) ||
          (compDate && compDate >= periodStartIso && compDate <= periodEndIso) ||
          m.status === 'in_progress' ||
          m.status === 'blocked';
        if (!inRange) return;
      }

      const isDone = m.status === 'done';
      const isBlocked = m.status === 'blocked';
      const isOverdue = Boolean(!isDone && m.targetDate && m.targetDate.split('T')[0] < todayIso);

      entries.push({
        projectId: project.id,
        projectName: project.name,
        projectStatus: project.status,
        milestoneId: m.id,
        title: m.title,
        status: m.status,
        targetDate: m.targetDate,
        completedAt: m.completedAt,
        ownerId: m.ownerId,
        ownerName: m.ownerName,
        isDone,
        isBlocked,
        isOverdue,
      });
    });
  });

  return entries;
}
