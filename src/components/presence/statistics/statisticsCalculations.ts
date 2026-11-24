import { Employee, Presence } from '../../../types';
import {
  computeWorkHoursPeriodAnalysis,
  formatLocalIsoDate,
  HoursComplianceVerdict,
  parseIsoDateLocal,
  PLATFORM_START_DATE,
  WeeklyWorkHoursSummary,
} from './workHoursCalculations';

export { PLATFORM_START_DATE };

export type StatisticsPeriod =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'all'
  | 'custom';

export interface EmployeeStatRow {
  employee: Employee;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  earlyDepartureDays: number;
  emergencyCount: number;
  totalTracked: number;
  presenceRate: number;     // % Présence (Venus travailler)
  ponctualiteRate: number;  // % Ponctualité (Arrivés à l'heure)
  assiduiteRate: number;    // % Assiduité (Respect du contrat & assiduité sans fautes)
  globalScore: number;      // % Score Global RH Combiné
  // Contrôle du volume horaire (40h/sem · 8h/jour ouvré)
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

export type RankingSortTab = 'all' | 'presences' | 'assiduite' | 'ponctualite';

function clampRangeToPlatformStart(
  startStr: string,
  endStr: string
): { startStr: string; endStr: string } {
  if (endStr < PLATFORM_START_DATE) {
    return { startStr, endStr };
  }
  return {
    startStr: startStr < PLATFORM_START_DATE ? PLATFORM_START_DATE : startStr,
    endStr,
  };
}

export function resolveStatisticsDateRange(
  period: StatisticsPeriod,
  customStart?: string,
  customEnd?: string,
  referenceNow: Date = new Date()
): { startStr: string; endStr: string } {
  const now = new Date(referenceNow.getFullYear(), referenceNow.getMonth(), referenceNow.getDate());

  if (period === 'custom' && customStart && customEnd) {
    const orderedStart = customStart <= customEnd ? customStart : customEnd;
    const orderedEnd = customStart <= customEnd ? customEnd : customStart;
    return clampRangeToPlatformStart(orderedStart, orderedEnd);
  }

  if (period === 'today') {
    const todayIso = formatLocalIsoDate(now);
    return clampRangeToPlatformStart(todayIso, todayIso);
  }

  if (period === 'yesterday') {
    const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yIso = formatLocalIsoDate(yest);
    return clampRangeToPlatformStart(yIso, yIso);
  }

  if (period === 'this_week') {
    const dow = now.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    return clampRangeToPlatformStart(formatLocalIsoDate(monday), formatLocalIsoDate(sunday));
  }

  if (period === 'this_month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return clampRangeToPlatformStart(formatLocalIsoDate(monthStart), formatLocalIsoDate(monthEnd));
  }

  if (period === 'last_month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    return clampRangeToPlatformStart(formatLocalIsoDate(monthStart), formatLocalIsoDate(monthEnd));
  }

  if (period === 'last_3_months') {
    const start3 = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return clampRangeToPlatformStart(formatLocalIsoDate(start3), formatLocalIsoDate(monthEnd));
  }

  // 'all' — à partir de la date de mise en service de la plateforme (20/10/2026)
  return clampRangeToPlatformStart(PLATFORM_START_DATE, formatLocalIsoDate(now));
}

export function computePresenceStatistics(
  employees: Employee[],
  presences: Presence[],
  period: StatisticsPeriod,
  customStart?: string,
  customEnd?: string,
  referenceNow: Date = new Date()
) {
  const { startStr, endStr } = resolveStatisticsDateRange(period, customStart, customEnd, referenceNow);
  const todayIso = formatLocalIsoDate(referenceNow);
  const effectiveElapsedEnd = endStr < todayIso ? endStr : todayIso;
  const isPreLaunchRange = endStr < PLATFORM_START_DATE;

  const inRangePresences = isPreLaunchRange
    ? []
    : (presences || []).filter((p) => p.date >= startStr && p.date <= endStr);

  const statsByEmployee: EmployeeStatRow[] = (employees || []).map((emp) => {
    const empPresences = inRangePresences.filter((p) => String(p.employeeId) === String(emp.id));
    let presentDays = 0;
    let lateDays = 0;

    const attendedElapsedWeekdayDates = new Set<string>();
    const attendedAnyDates = new Set<string>();
    const explicitAbsentDates = new Set<string>();

    let earlyDepartureDays = 0;
    let emergencyCount = 0;

    empPresences.forEach((p) => {
      if (p.emergencies) emergencyCount += p.emergencies.length;
      if (p.departureTime && p.departureTime < '16:00') {
        earlyDepartureDays += 1;
      }

      const rawStatus = String(p.status || '').trim().toLowerCase();
      const isPresentStatus = rawStatus === 'present' || rawStatus === 'prensent';
      const isLateStatus = rawStatus === 'late';
      const isAbsentStatus = rawStatus === 'absent';
      if (isPresentStatus) presentDays += 1;
      else if (isLateStatus) lateDays += 1;

      const d = parseIsoDateLocal(p.date);
      const dow = d ? d.getDay() : 1;
      const isWeekday = dow >= 1 && dow <= 5;
      const isAttended = isPresentStatus || isLateStatus;

      if (isAttended) {
        attendedAnyDates.add(p.date);
        if (isWeekday && p.date <= effectiveElapsedEnd) {
          attendedElapsedWeekdayDates.add(p.date);
        }
      } else if (isAbsentStatus && isWeekday && p.date <= effectiveElapsedEnd) {
        explicitAbsentDates.add(p.date);
      }
    });

    const workAnalysis = computeWorkHoursPeriodAnalysis(empPresences, startStr, endStr, referenceNow);
    const workingDaysElapsed = workAnalysis.workingDaysElapsed;

    const unbadgedAbsentDays = Math.max(0, workingDaysElapsed - attendedElapsedWeekdayDates.size);
    const absentDays = isPreLaunchRange
      ? 0
      : Math.max(explicitAbsentDates.size, unbadgedAbsentDays);

    const totalDaysWorked = presentDays + lateDays;
    const totalTracked = Math.max(
      workingDaysElapsed,
      attendedElapsedWeekdayDates.size + explicitAbsentDates.size,
      totalDaysWorked + absentDays
    );

    const presenceRate = isPreLaunchRange
      ? 0
      : workingDaysElapsed > 0
      ? Math.min(100, Math.round((attendedElapsedWeekdayDates.size / workingDaysElapsed) * 100))
      : attendedAnyDates.size > 0
      ? 100
      : 0;

    const ponctualiteRate =
      totalDaysWorked > 0 ? Math.round((presentDays / totalDaysWorked) * 100) : 0;

    let assiduiteRate = 0;
    if (!isPreLaunchRange && totalDaysWorked > 0) {
      const absencePenalty =
        workingDaysElapsed > 0 ? (absentDays / workingDaysElapsed) * 100 : absentDays * 15;
      const latePenalty = Math.min(
        25,
        (lateDays / Math.max(workingDaysElapsed, totalDaysWorked)) * 40 + lateDays * 2
      );
      const earlyPenalty = Math.min(20, earlyDepartureDays * 5);
      const emergencyBonus = Math.min(5, emergencyCount * 2);
      const rawAssiduite =
        100 - absencePenalty - latePenalty - earlyPenalty + emergencyBonus;
      assiduiteRate = Math.max(0, Math.min(100, Math.round(rawAssiduite)));
    }

    const globalScore = Math.round(
      0.4 * assiduiteRate + 0.35 * presenceRate + 0.25 * ponctualiteRate
    );

    return {
      employee: emp,
      presentDays,
      lateDays,
      absentDays,
      earlyDepartureDays,
      emergencyCount,
      totalTracked,
      presenceRate,
      ponctualiteRate,
      assiduiteRate,
      globalScore,
      workedHoursTotal: workAnalysis.workedHoursTotal,
      workedHoursWeekdays: workAnalysis.workedHoursWeekdays,
      workedHoursWeekend: workAnalysis.workedHoursWeekend,
      workingDaysInPeriod: workAnalysis.workingDaysInPeriod,
      workingDaysElapsed: workAnalysis.workingDaysElapsed,
      weekendWorkedDays: workAnalysis.weekendWorkedDays,
      expectedHoursElapsed: workAnalysis.expectedHoursElapsed,
      expectedHoursFullPeriod: workAnalysis.expectedHoursFullPeriod,
      hoursDelta: workAnalysis.hoursDelta,
      hoursComplianceRate: workAnalysis.hoursComplianceRate,
      hoursVerdict: workAnalysis.hoursVerdict,
      incompleteClockingsCount: workAnalysis.incompleteClockingsCount,
      weeklyHoursBreakdown: workAnalysis.weeklyHoursBreakdown,
    };
  });

  const overallPresent = statsByEmployee.reduce((sum, s) => sum + s.presentDays, 0);
  const overallLate = statsByEmployee.reduce((sum, s) => sum + s.lateDays, 0);
  const overallAbsent = statsByEmployee.reduce((sum, s) => sum + s.absentDays, 0);

  const avgAssiduite =
    statsByEmployee.length > 0
      ? Math.round(statsByEmployee.reduce((sum, s) => sum + s.assiduiteRate, 0) / statsByEmployee.length)
      : 0;

  const avgPonctualite =
    statsByEmployee.length > 0
      ? Math.round(statsByEmployee.reduce((sum, s) => sum + s.ponctualiteRate, 0) / statsByEmployee.length)
      : 0;

  const avgPresence =
    statsByEmployee.length > 0
      ? Math.round(statsByEmployee.reduce((sum, s) => sum + s.presenceRate, 0) / statsByEmployee.length)
      : 0;

  return {
    startStr,
    endStr,
    statsByEmployee,
    overallPresent,
    overallLate,
    overallAbsent,
    avgAssiduite,
    avgPonctualite,
    avgPresence,
  };
}
