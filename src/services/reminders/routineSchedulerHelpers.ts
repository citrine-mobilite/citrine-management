import {
  Reminder,
  ReminderRecurrenceMode,
  ReminderRoutineType,
} from '../../types';

export const WEEKDAY_OPTIONS: Array<{
  day: number;
  short: string;
  label: string;
}> = [
  { day: 1, short: 'Lun', label: 'Lundi' },
  { day: 2, short: 'Mar', label: 'Mardi' },
  { day: 3, short: 'Mer', label: 'Mercredi' },
  { day: 4, short: 'Jeu', label: 'Jeudi' },
  { day: 5, short: 'Ven', label: 'Vendredi' },
  { day: 6, short: 'Sam', label: 'Samedi' },
  { day: 0, short: 'Dim', label: 'Dimanche' },
];

export const ROUTINE_TYPE_META: Record<
  ReminderRoutineType,
  { label: string; placeholder: string }
> = {
  reunion: {
    label: 'Réunion',
    placeholder: "Ex: Réunion d'équipe hebdomadaire",
  },
  brief: {
    label: 'Brief / Point',
    placeholder: 'Ex: Point matinal opérations',
  },
  appel: {
    label: 'Appel / Visio',
    placeholder: 'Ex: Appel de synchronisation clients',
  },
  suivi: {
    label: 'Suivi opérationnel',
    placeholder: 'Ex: Vérification des livraisons du jour',
  },
  personnel: {
    label: 'Rappel personnel',
    placeholder: 'Ex: Envoyer le compte rendu',
  },
  autre: {
    label: 'Autre rappel',
    placeholder: 'Ex: Rappel récurrent',
  },
};

export interface RoutinePresetTemplate {
  id: string;
  label: string;
  title: string;
  routineType: ReminderRoutineType;
  recurrenceMode: ReminderRecurrenceMode;
  recurrenceDays: number[];
  time: string;
  triggerPeriods: string[];
  note: string;
}

export const ROUTINE_PRESETS: RoutinePresetTemplate[] = [
  {
    id: 'reunion_lmv_9h',
    label: 'Réunion Lun · Mer · Ven à 09h00',
    title: "Réunion d'équipe",
    routineType: 'reunion',
    recurrenceMode: 'weekly_days',
    recurrenceDays: [1, 3, 5],
    time: '09:00',
    triggerPeriods: ['15m', 'exact'],
    note: 'Point de coordination hebdomadaire (Lundi, Mercredi, Vendredi à 09h00).',
  },
  {
    id: 'brief_quotidien_8h30',
    label: 'Brief matinal Lun–Ven à 08h30',
    title: 'Brief matinal des équipes',
    routineType: 'brief',
    recurrenceMode: 'weekdays',
    recurrenceDays: [1, 2, 3, 4, 5],
    time: '08:30',
    triggerPeriods: ['5m', 'exact'],
    note: 'Revue des priorités de la journée.',
  },
  {
    id: 'point_hebdo_vendredi',
    label: 'Bilan Vendredi à 16h00',
    title: 'Bilan hebdomadaire',
    routineType: 'suivi',
    recurrenceMode: 'weekly_days',
    recurrenceDays: [5],
    time: '16:00',
    triggerPeriods: ['30m', 'exact'],
    note: 'Validation des dossiers clôturés de la semaine.',
  },
];

export function isRoutineReminder(reminder: Reminder): boolean {
  if (!reminder) return false;
  if (reminder.kind === 'routine' || reminder.kind === 'alarm') return true;
  if (reminder.kind === 'deadline') return false;
  if (
    reminder.recurrenceMode ||
    (Array.isArray(reminder.recurrenceDays) && reminder.recurrenceDays.length > 0)
  ) {
    return true;
  }
  return false;
}

export function resolveRecurrenceMode(reminder: Reminder): ReminderRecurrenceMode {
  if (reminder.recurrenceMode) return reminder.recurrenceMode;
  if (reminder.recurrence === 'daily') return 'daily';
  if (reminder.recurrence === 'weekdays') return 'weekdays';
  if (Array.isArray(reminder.recurrenceDays) && reminder.recurrenceDays.length > 0) {
    return 'weekly_days';
  }
  return 'once';
}

export function getActiveWeekdays(reminder: Reminder): number[] {
  const mode = resolveRecurrenceMode(reminder);
  if (mode === 'daily') return [0, 1, 2, 3, 4, 5, 6];
  if (mode === 'weekdays') return [1, 2, 3, 4, 5];
  if (mode === 'weekly_days') {
    const valid = (reminder.recurrenceDays || []).filter((d) => d >= 0 && d <= 6);
    return Array.from(new Set(valid));
  }
  return [];
}

function parseTimeParts(timeStr?: string): { hour: number; minute: number } | null {
  if (!timeStr) return null;
  const parts = String(timeStr).trim().split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return { hour: parts[0], minute: parts[1] };
}

export function formatRoutineRecurrenceLabel(reminder: Reminder): string {
  const mode = resolveRecurrenceMode(reminder);
  const timeLabel = reminder.time ? `à ${reminder.time}` : '';

  if (mode === 'daily') {
    return `Tous les jours ${timeLabel}`.trim();
  }
  if (mode === 'weekdays') {
    return `Lun – Ven ${timeLabel}`.trim();
  }
  if (mode === 'weekly_days') {
    const days = getActiveWeekdays(reminder);
    if (days.length === 0) return `Hebdomadaire ${timeLabel}`.trim();
    const ordered = WEEKDAY_OPTIONS.filter((w) => days.includes(w.day)).map((w) => w.short);
    return `Tous les ${ordered.join(', ')} ${timeLabel}`.trim();
  }
  if (mode === 'monthly') {
    const datePart = reminder.date ? Number(reminder.date.split('-')[2]) : 1;
    const dayNum = !isNaN(datePart) && datePart >= 1 ? datePart : 1;
    return `Chaque ${dayNum} du mois ${timeLabel}`.trim();
  }
  if (reminder.date) {
    const clean = reminder.date.split('T')[0];
    const [y, m, d] = clean.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const formatted = new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return `Le ${formatted} ${timeLabel}`.trim();
    }
  }
  return timeLabel ? `Ponctuel ${timeLabel}` : 'Ponctuel';
}

export function computeNextRoutineOccurrence(
  reminder: Reminder,
  referenceDate: Date = new Date()
): Date | null {
  if (reminder.stopped || reminder.isResolved) return null;
  const parsedTime = parseTimeParts(reminder.time) || { hour: 9, minute: 0 };
  const mode = resolveRecurrenceMode(reminder);

  if (mode === 'once') {
    if (!reminder.date) return null;
    const [y, m, d] = reminder.date.split('T')[0].split('-').map(Number);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    const target = new Date(y, m - 1, d, parsedTime.hour, parsedTime.minute, 0, 0);
    return target;
  }

  if (mode === 'monthly') {
    const dayNum = reminder.date ? Number(reminder.date.split('-')[2]) || 1 : 1;
    for (let offset = 0; offset <= 2; offset++) {
      const monthFirst = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth() + offset,
        1
      );
      const lastDay = new Date(
        monthFirst.getFullYear(),
        monthFirst.getMonth() + 1,
        0
      ).getDate();
      const candidate = new Date(
        monthFirst.getFullYear(),
        monthFirst.getMonth(),
        Math.min(dayNum, lastDay),
        parsedTime.hour,
        parsedTime.minute,
        0,
        0
      );
      if (candidate.getTime() >= referenceDate.getTime()) {
        return candidate;
      }
    }
    return null;
  }

  const activeDays = getActiveWeekdays(reminder);
  if (activeDays.length === 0) return null;

  for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
    const candidate = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate() + dayOffset,
      parsedTime.hour,
      parsedTime.minute,
      0,
      0
    );
    if (
      activeDays.includes(candidate.getDay()) &&
      candidate.getTime() >= referenceDate.getTime()
    ) {
      return candidate;
    }
  }
  return null;
}

export function formatNextOccurrenceBadge(
  reminder: Reminder,
  referenceDate: Date = new Date()
): { label: string; isToday: boolean; isSoon: boolean; isPastOnce: boolean } {
  if (reminder.stopped || reminder.isResolved) {
    return { label: 'En pause', isToday: false, isSoon: false, isPastOnce: false };
  }

  const next = computeNextRoutineOccurrence(reminder, referenceDate);
  if (!next) {
    return { label: 'À configurer', isToday: false, isSoon: false, isPastOnce: false };
  }

  const diffMs = next.getTime() - referenceDate.getTime();
  const mode = resolveRecurrenceMode(reminder);
  if (mode === 'once' && diffMs < -60000) {
    return { label: 'Passé', isToday: false, isSoon: false, isPastOnce: true };
  }

  const timeStr = `${String(next.getHours()).padStart(2, '0')}:${String(
    next.getMinutes()
  ).padStart(2, '0')}`;

  const todayStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const nextStart = new Date(next.getFullYear(), next.getMonth(), next.getDate());
  const dayDiff = Math.round((nextStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));

  const diffMins = Math.round(diffMs / 60000);
  if (dayDiff === 0) {
    if (diffMins >= 0 && diffMins <= 60) {
      return {
        label: diffMins === 0 ? 'Maintenant' : `Dans ${diffMins} min (${timeStr})`,
        isToday: true,
        isSoon: true,
        isPastOnce: false,
      };
    }
    return { label: `Aujourd'hui à ${timeStr}`, isToday: true, isSoon: false, isPastOnce: false };
  }

  if (dayDiff === 1) {
    return { label: `Demain à ${timeStr}`, isToday: false, isSoon: false, isPastOnce: false };
  }

  const dayLabel = next.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return { label: `${dayLabel} à ${timeStr}`, isToday: false, isSoon: false, isPastOnce: false };
}

export interface NowScheduleParts {
  dateStr: string;
  dayOfMonth: number;
  dayOfWeek: number; // 0=Dimanche .. 6=Samedi
  hour: number;
  minute: number;
}

export function getPeriodLeadMinutes(period: string): number {
  if (period === '5m') return 5;
  if (period === '15m') return 15;
  if (period === '30m') return 30;
  if (period === '1h') return 60;
  return 0;
}

export function doesRoutineMatchMoment(
  reminder: Reminder,
  now: NowScheduleParts
): { period: string; triggerKey: string } | null {
  if (reminder.stopped || reminder.isResolved || !isRoutineReminder(reminder)) return null;

  const parsedTime = parseTimeParts(reminder.time);
  if (!parsedTime) return null;

  const mode = resolveRecurrenceMode(reminder);
  let dayMatches = false;

  if (mode === 'daily') {
    dayMatches = true;
  } else if (mode === 'weekdays') {
    dayMatches = now.dayOfWeek >= 1 && now.dayOfWeek <= 5;
  } else if (mode === 'weekly_days') {
    dayMatches = getActiveWeekdays(reminder).includes(now.dayOfWeek);
  } else if (mode === 'monthly') {
    const targetDay = reminder.date ? Number(reminder.date.split('-')[2]) || 1 : 1;
    dayMatches = now.dayOfMonth === targetDay;
  } else if (mode === 'once') {
    const targetDate = (reminder.date || '').split('T')[0];
    dayMatches = targetDate === now.dateStr;
  }

  if (!dayMatches) return null;

  const targetTotalMin = parsedTime.hour * 60 + parsedTime.minute;
  const currentTotalMin = now.hour * 60 + now.minute;
  const periods =
    reminder.triggerPeriods && reminder.triggerPeriods.length > 0
      ? reminder.triggerPeriods
      : ['exact'];

  for (const period of periods) {
    const leadMin = getPeriodLeadMinutes(period);
    if (targetTotalMin - currentTotalMin === leadMin) {
      const hh = String(now.hour).padStart(2, '0');
      const mm = String(now.minute).padStart(2, '0');
      return {
        period,
        triggerKey: `${now.dateStr}_${hh}:${mm}_${period}`,
      };
    }
  }

  return null;
}
