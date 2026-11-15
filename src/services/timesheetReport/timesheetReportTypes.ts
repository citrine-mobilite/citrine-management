export interface TimesheetItem {
  index: number;
  taskTitle: string;
  subTitle: string;
  status: string;
  statusLabel: string;
  estimatedHours: number;
  actualHours: number;
  blockerReason?: string;
  isBlocked?: boolean;
}

export interface TimesheetBlocker {
  sourceTask: string;
  reason: string;
  status?: string;
  time?: string;
}

export interface TimesheetManagerPoint {
  sourceTask?: string;
  author?: string;
  content: string;
  time?: string;
  urgency?: string;
}

export interface TimesheetPriority {
  id?: string;
  title: string;
  priority?: string;
  status: string;
  isMilestone?: boolean;
}

export interface TimesheetScheduleSlot {
  timeRange: string;
  activity: string;
  isBuffer?: boolean;
  isBreak?: boolean;
  resolutionNote?: string;
}

export interface DailyPresenceIncident {
  time?: string;
  type: string;
  label: string;
  description: string;
  isJustified?: boolean;
}

export interface DailyAttendanceRecap {
  statusLabel?: string;
  statusType?: 'present' | 'late' | 'mission' | 'leave' | 'absent' | 'remote';
  arrivalTime?: string;
  pauseStart?: string;
  pauseEnd?: string;
  departureTime?: string;
  hoursWorkedText?: string;
  location?: string;
  incidentNote?: string;
  incidents?: DailyPresenceIncident[];
}

export interface TimesheetReportData {
  employeeName: string;
  employeeEmail?: string;
  employeeId?: string | number;
  department?: string;
  dateStr?: string;
  timeStr?: string;
  dailyAttendance?: DailyAttendanceRecap;
  presenceIncidents?: DailyPresenceIncident[];
  items: TimesheetItem[];
  blockers: TimesheetBlocker[];
  managerPoints: TimesheetManagerPoint[];
  totalEstimatedHours: number;
  totalActualHours: number;
  topPriorities?: TimesheetPriority[];
  scheduleSlots?: TimesheetScheduleSlot[];
  postponedTasks?: string[];
  location?: string;
  dayName?: string;
}

export function getDoualaDateInfo(date: Date = new Date()): {
  dateOnly: string;
  timeOnly: string;
  fullDateStr: string;
  dayIso: string;
} {
  const fullFormatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Douala',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const dateOnlyFormatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Douala',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const timeOnlyFormatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Douala',
    hour: '2-digit',
    minute: '2-digit',
  });

  const parts = fullFormatter.format(date);
  const dateOnly = dateOnlyFormatter.format(date);
  const timeOnly = timeOnlyFormatter.format(date);

  const isoFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Douala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dayIso = isoFormatter.format(date);

  return {
    dateOnly,
    timeOnly,
    fullDateStr: `${parts} (Heure locale Douala, Cameroun)`,
    dayIso,
  };
}

export function normalizeStatusBadge(
  status?: string,
  completed?: boolean
): { label: string; bg: string; color: string; border: string } {
  if (completed || status === 'completed' || status === 'done' || status === 'fait' || status === 'Fait' || status === 'termine') {
    return { label: 'Fait', bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' };
  }
  if (status === 'blocked' || status === 'bloque') {
    return { label: 'Bloqué', bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' };
  }
  if (status === 'in_progress' || status === 'en_cours' || status === 'En cours') {
    return { label: 'En cours', bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
  }
  return { label: 'À faire', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
}
