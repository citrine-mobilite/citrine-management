import { Presence } from '../../../types';

export type HoursComplianceVerdict =
  | 'conforme'
  | 'heures_sup'
  | 'partiel'
  | 'insuffisant'
  | 'non_pointe';

export interface WeeklyWorkHoursSummary {
  weekStartStr: string;
  weekEndStr: string;
  weekLabel: string;
  workedHours: number;
  targetHours: number;
  expectedHoursElapsed: number;
  deltaHours: number;
  complianceRate: number;
  workedDays: number;
  workingDaysInWeek: number;
  incompleteClockingsCount: number;
  verdict: HoursComplianceVerdict;
}

export interface WorkHoursPeriodAnalysis {
  workedHoursTotal: number;
  workedHoursWeekdays: number;
  workedHoursWeekend: number;
  workingDaysInPeriod: number;
  workingDaysElapsed: number;
  weekendWorkedDays: number;
  expectedHoursElapsed: number;
  expectedHoursFullPeriod: number;
  hoursDelta: number;
  hoursComplianceRate: number;
  hoursVerdict: HoursComplianceVerdict;
  incompleteClockingsCount: number;
  weeklyHoursBreakdown: WeeklyWorkHoursSummary[];
}

export function formatLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIsoDateLocal(dateStr?: string): Date | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return null;
  const clean = dateStr.slice(0, 10);
  const [y, m, d] = clean.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return null;
  return date;
}

export function parseTimeToMinutes(timeStr?: string | null): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const trimmed = timeStr.trim();
  if (!trimmed || trimmed === '--:--' || trimmed === '—' || trimmed === '-') return null;
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

export function computeDailyWorkedHours(presence: Presence): {
  workedHours: number;
  isIncomplete: boolean;
  isWeekend: boolean;
} {
  const d = parseIsoDateLocal(presence.date);
  const dow = d ? d.getDay() : 1;
  const isWeekend = dow === 0 || dow === 6;

  if (presence.status === 'absent') {
    return { workedHours: 0, isIncomplete: false, isWeekend };
  }

  const arrMin = parseTimeToMinutes(presence.arrivalTime);
  const depMin = parseTimeToMinutes(presence.departureTime);

  if (arrMin !== null && depMin === null) {
    return { workedHours: 0, isIncomplete: true, isWeekend };
  }

  if (arrMin === null || depMin === null) {
    return { workedHours: 0, isIncomplete: false, isWeekend };
  }

  let rawMin = depMin - arrMin;
  if (rawMin <= 0) {
    return { workedHours: 0, isIncomplete: false, isWeekend };
  }

  const pStart = parseTimeToMinutes(presence.pauseStart);
  const pEnd = parseTimeToMinutes(presence.pauseEnd);
  if (pStart !== null && pEnd !== null && pEnd > pStart) {
    const overlapStart = Math.max(arrMin, pStart);
    const overlapEnd = Math.min(depMin, pEnd);
    if (overlapEnd > overlapStart) {
      rawMin = Math.max(0, rawMin - (overlapEnd - overlapStart));
    }
  }

  return {
    workedHours: round1(rawMin / 60),
    isIncomplete: false,
    isWeekend,
  };
}

export function countWorkingDaysBetween(startIso: string, endIso: string): number {
  const startDate = parseIsoDateLocal(startIso);
  const endDate = parseIsoDateLocal(endIso);
  if (!startDate || !endDate || endDate.getTime() < startDate.getTime()) return 0;

  let count = 0;
  const cur = new Date(startDate.getTime());
  let guard = 0;
  while (cur.getTime() <= endDate.getTime() && guard < 1500) {
    const dow = cur.getDay();
    if (dow >= 1 && dow <= 5) count += 1;
    cur.setDate(cur.getDate() + 1);
    guard += 1;
  }
  return count;
}

export function resolveHoursVerdict(
  workedHours: number,
  expectedHours: number
): HoursComplianceVerdict {
  if (workedHours <= 0 && expectedHours > 0) return 'non_pointe';
  if (expectedHours <= 0) return workedHours > 0 ? 'heures_sup' : 'conforme';
  const ratio = workedHours / expectedHours;
  if (ratio >= 1.05 && workedHours - expectedHours >= 1) return 'heures_sup';
  if (ratio >= 0.95) return 'conforme';
  if (ratio >= 0.75) return 'partiel';
  return 'insuffisant';
}

function getMondayOfDate(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + offset);
  return d;
}

const DEFAULT_PLATFORM_START_DATE = '2026-10-20';

export function resolvePlatformStartDate(): string {
  const fromVite =
    typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PLATFORM_START_DATE;
  const fromNode =
    typeof process !== 'undefined' &&
    (process.env?.VITE_PLATFORM_START_DATE || process.env?.PLATFORM_START_DATE);
  const candidate = String(fromVite || fromNode || DEFAULT_PLATFORM_START_DATE).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : DEFAULT_PLATFORM_START_DATE;
}

export const PLATFORM_START_DATE = resolvePlatformStartDate();

export function computeWorkHoursPeriodAnalysis(
  empPresences: Presence[],
  startStr: string,
  endStr: string,
  referenceToday: Date = new Date()
): WorkHoursPeriodAnalysis {
  if (endStr < PLATFORM_START_DATE) {
    return {
      workedHoursTotal: 0,
      workedHoursWeekdays: 0,
      workedHoursWeekend: 0,
      workingDaysInPeriod: 0,
      workingDaysElapsed: 0,
      weekendWorkedDays: 0,
      expectedHoursElapsed: 0,
      expectedHoursFullPeriod: 0,
      hoursDelta: 0,
      hoursComplianceRate: 0,
      hoursVerdict: 'non_pointe',
      incompleteClockingsCount: 0,
      weeklyHoursBreakdown: [],
    };
  }

  const effectiveStartStr = startStr < PLATFORM_START_DATE ? PLATFORM_START_DATE : startStr;
  const todayIso = formatLocalIsoDate(referenceToday);
  const effectiveElapsedEnd = endStr < todayIso ? endStr : todayIso;

  const workingDaysInPeriod = countWorkingDaysBetween(effectiveStartStr, endStr);
  const workingDaysElapsed =
    effectiveElapsedEnd >= effectiveStartStr
      ? countWorkingDaysBetween(effectiveStartStr, effectiveElapsedEnd)
      : 0;

  let workedHoursTotal = 0;
  let workedHoursWeekdays = 0;
  let workedHoursWeekend = 0;
  let weekendWorkedDays = 0;
  let incompleteClockingsCount = 0;

  const dayHoursMap = new Map<string, { hours: number; isIncomplete: boolean; isWeekend: boolean }>();

  (empPresences || []).forEach((p) => {
    if (!p.date || p.date < effectiveStartStr || p.date > endStr) return;
    const daily = computeDailyWorkedHours(p);
    if (daily.isIncomplete) incompleteClockingsCount += 1;

    workedHoursTotal += daily.workedHours;
    if (daily.isWeekend) {
      workedHoursWeekend += daily.workedHours;
      if (daily.workedHours > 0 || (p.status !== 'absent' && Boolean(p.arrivalTime))) {
        weekendWorkedDays += 1;
      }
    } else {
      workedHoursWeekdays += daily.workedHours;
    }

    const prev = dayHoursMap.get(p.date) || { hours: 0, isIncomplete: false, isWeekend: daily.isWeekend };
    dayHoursMap.set(p.date, {
      hours: round1(prev.hours + daily.workedHours),
      isIncomplete: prev.isIncomplete || daily.isIncomplete,
      isWeekend: daily.isWeekend,
    });
  });

  workedHoursTotal = round1(workedHoursTotal);
  workedHoursWeekdays = round1(workedHoursWeekdays);
  workedHoursWeekend = round1(workedHoursWeekend);

  const expectedHoursElapsed = round1(workingDaysElapsed * 8);
  const expectedHoursFullPeriod = round1(workingDaysInPeriod * 8);
  const baselineExpected = expectedHoursElapsed > 0 ? expectedHoursElapsed : expectedHoursFullPeriod;
  const hoursDelta = round1(workedHoursTotal - baselineExpected);
  const hoursComplianceRate =
    baselineExpected > 0
      ? Math.round((workedHoursTotal / baselineExpected) * 100)
      : workedHoursTotal > 0
      ? 100
      : 0;
  const hoursVerdict = resolveHoursVerdict(workedHoursTotal, baselineExpected);

  // Build week-by-week 40h breakdown within period (cap at 16 weeks for readability)
  const weeklyHoursBreakdown: WeeklyWorkHoursSummary[] = [];
  const startDate = parseIsoDateLocal(effectiveStartStr);
  const endDate = parseIsoDateLocal(endStr);

  if (startDate && endDate && endDate.getTime() >= startDate.getTime()) {
    let cursorMonday = getMondayOfDate(startDate);
    let safety = 0;
    while (cursorMonday.getTime() <= endDate.getTime() && safety < 16) {
      const weekEnd = new Date(
        cursorMonday.getFullYear(),
        cursorMonday.getMonth(),
        cursorMonday.getDate() + 6
      );
      const wStartIso = formatLocalIsoDate(cursorMonday);
      const wEndIso = formatLocalIsoDate(weekEnd);

      const clampedStart = wStartIso < effectiveStartStr ? effectiveStartStr : wStartIso;
      const clampedEnd = wEndIso > endStr ? endStr : wEndIso;

      const workingDaysInWeek = countWorkingDaysBetween(clampedStart, clampedEnd);
      const elapsedWeekEnd = clampedEnd < todayIso ? clampedEnd : todayIso;
      const elapsedDaysInWeek =
        elapsedWeekEnd >= clampedStart ? countWorkingDaysBetween(clampedStart, elapsedWeekEnd) : 0;

      let weekWorked = 0;
      let weekDays = 0;
      let weekIncomplete = 0;

      dayHoursMap.forEach((info, dateKey) => {
        if (dateKey >= clampedStart && dateKey <= clampedEnd) {
          weekWorked += info.hours;
          if (info.hours > 0) weekDays += 1;
          if (info.isIncomplete) weekIncomplete += 1;
        }
      });

      weekWorked = round1(weekWorked);
      const targetHours = workingDaysInWeek * 8; // 40h for a full Mon-Fri week
      const expectedWeekElapsed = elapsedDaysInWeek * 8;
      const refExp = expectedWeekElapsed > 0 ? expectedWeekElapsed : targetHours;
      const deltaHours = round1(weekWorked - refExp);
      const complianceRate =
        refExp > 0 ? Math.round((weekWorked / refExp) * 100) : weekWorked > 0 ? 100 : 0;
      const verdict = resolveHoursVerdict(weekWorked, refExp);

      const startFmt = parseIsoDateLocal(clampedStart)?.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
      });
      const endFmt = parseIsoDateLocal(clampedEnd)?.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
      });

      weeklyHoursBreakdown.push({
        weekStartStr: clampedStart,
        weekEndStr: clampedEnd,
        weekLabel: startFmt && endFmt ? `${startFmt} – ${endFmt}` : `${clampedStart} – ${clampedEnd}`,
        workedHours: weekWorked,
        targetHours,
        expectedHoursElapsed: expectedWeekElapsed,
        deltaHours,
        complianceRate,
        workedDays: weekDays,
        workingDaysInWeek,
        incompleteClockingsCount: weekIncomplete,
        verdict,
      });

      cursorMonday = new Date(
        cursorMonday.getFullYear(),
        cursorMonday.getMonth(),
        cursorMonday.getDate() + 7
      );
      safety += 1;
    }
  }

  return {
    workedHoursTotal,
    workedHoursWeekdays,
    workedHoursWeekend,
    workingDaysInPeriod,
    workingDaysElapsed,
    weekendWorkedDays,
    expectedHoursElapsed,
    expectedHoursFullPeriod,
    hoursDelta,
    hoursComplianceRate,
    hoursVerdict,
    incompleteClockingsCount,
    weeklyHoursBreakdown,
  };
}
