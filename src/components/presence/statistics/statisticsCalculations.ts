import { Employee, Presence } from '../../../types';
import { safeNum, round1 } from '../../../utils/rendementTaskHelpers';

export interface EmployeeStatRow {
  employee: Employee;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  earlyDepartureDays: number;
  emergencyCount: number;
  workedHoursTotal: number;
  totalTracked: number;
  workingDaysInPeriod?: number;
  weekendWorkedDays: number;
  presenceRate: number;
  ponctualiteRate: number;
  assiduiteRate: number;
  globalScore: number;
}

export type RankingSortTab = 'all' | 'presences' | 'assiduite' | 'ponctualite';

export type StatisticsPeriod = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'last_3_months' | 'all' | 'custom';

function parseClockMinutes(hm?: string | null): number | null {
  if (!hm || typeof hm !== 'string' || !hm.includes(':')) return null;
  const parts = hm.trim().split(':');
  if (parts.length < 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

export function computePresenceStatistics(
  employees: Employee[],
  presences: Presence[],
  period: StatisticsPeriod,
  customStart?: string,
  customEnd?: string
) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  let startStr = '';
  let endStr = '';

  if (period === 'today') {
    startStr = todayStr;
    endStr = todayStr;
  } else if (period === 'yesterday') {
    const yDate = new Date();
    yDate.setDate(yDate.getDate() - 1);
    const yesterdayStr = `${yDate.getFullYear()}-${pad(yDate.getMonth() + 1)}-${pad(yDate.getDate())}`;
    startStr = yesterdayStr;
    endStr = yesterdayStr;
  } else if (period === 'this_week') {
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    startStr = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
    endStr = todayStr;
  } else if (period === 'this_month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    startStr = `${firstDay.getFullYear()}-${pad(firstDay.getMonth() + 1)}-${pad(firstDay.getDate())}`;
    endStr = todayStr;
  } else if (period === 'last_month') {
    const firstLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    startStr = `${firstLastMonth.getFullYear()}-${pad(firstLastMonth.getMonth() + 1)}-${pad(firstLastMonth.getDate())}`;
    endStr = `${lastDayLastMonth.getFullYear()}-${pad(lastDayLastMonth.getMonth() + 1)}-${pad(lastDayLastMonth.getDate())}`;
  } else if (period === 'last_3_months') {
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    startStr = `${threeMonthsAgo.getFullYear()}-${pad(threeMonthsAgo.getMonth() + 1)}-${pad(threeMonthsAgo.getDate())}`;
    endStr = todayStr;
  } else if (period === 'custom' && (customStart || customEnd)) {
    startStr = customStart || customEnd || todayStr;
    endStr = customEnd || customStart || todayStr;
  } else {
    startStr = '2024-01-01';
    endStr = todayStr;
  }

  const countWorkingDaysBetween = (sStr: string, eStr: string): number => {
    const start = new Date(sStr + 'T12:00:00');
    const end = new Date(eStr + 'T12:00:00');
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
    let count = 0;
    const cursor = new Date(start);
    while (cursor <= end) {
      const dow = cursor.getDay();
      if (dow >= 1 && dow <= 5) count++;
      cursor.setDate(cursor.getDate() + 1);
    }
    return count;
  };

  let workingDaysInPeriod: number | undefined;
  if (period === 'this_week') {
    workingDaysInPeriod = 5;
  } else if (period === 'this_month') {
    const lastDayCurrMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthEndStr = `${lastDayCurrMonth.getFullYear()}-${pad(lastDayCurrMonth.getMonth() + 1)}-${pad(lastDayCurrMonth.getDate())}`;
    workingDaysInPeriod = countWorkingDaysBetween(startStr, monthEndStr);
  } else if (period !== 'all') {
    workingDaysInPeriod = countWorkingDaysBetween(startStr, endStr);
  }

  const isWeekendDateStr = (dateStr?: string | null): boolean => {
    if (!dateStr) return false;
    const dow = new Date(`${dateStr.split('T')[0]}T12:00:00`).getDay();
    return dow === 0 || dow === 6;
  };

  const safePresences = Array.isArray(presences) ? presences : [];
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const inRangePresences = safePresences.filter((p) => p && p.date >= startStr && p.date <= endStr);

  const statsByEmployee: EmployeeStatRow[] = safeEmployees.map((emp) => {
    const empPresences = inRangePresences.filter((p) => String(p.employeeId) === String(emp.id));
    const weekdayPresences = empPresences.filter((p) => !isWeekendDateStr(p.date));

    const presentDays = weekdayPresences.filter((p) => p.status === 'present' || p.status === 'mission').length;
    const lateDays = weekdayPresences.filter((p) => p.status === 'late').length;
    const isEmpOnMission = emp.employmentStatus === 'en_mission' || emp.status === 'en_mission';
    const absentDays = isEmpOnMission ? 0 : weekdayPresences.filter((p) => p.status === 'absent').length;

    const weekendWorkedDays = empPresences.filter((p) => {
      if (!isWeekendDateStr(p.date) || p.status === 'absent') return false;
      return p.status === 'present' || p.status === 'late' || p.status === 'mission' || Boolean(p.arrivalTime);
    }).length;

    let earlyDepartureDays = 0;
    let emergencyCount = 0;
    let workedMinutes = 0;

    empPresences.forEach((p) => {
      const isWe = isWeekendDateStr(p.date);
      if (Array.isArray(p.emergencies)) emergencyCount += p.emergencies.length;
      if (!isWe && p.status !== 'absent' && p.departureTime && p.departureTime < '16:00') {
        earlyDepartureDays += 1;
      }
      if (p.arrivalTime && p.status !== 'absent') {
        const arrM = parseClockMinutes(p.arrivalTime);
        const depM = parseClockMinutes(p.departureTime) ?? (arrM !== null ? arrM + 480 : null);
        if (arrM !== null && depM !== null && depM > arrM) {
          const pStart = parseClockMinutes(p.pauseStart);
          const pEnd = parseClockMinutes(p.pauseEnd);
          const breakM = pStart !== null && pEnd !== null && pEnd > pStart ? pEnd - pStart : 60;
          workedMinutes += Math.max(0, depM - arrM - (depM - arrM > 300 ? breakM : 0));
        }
      }
    });

    const workedHoursTotal = round1(workedMinutes / 60);
    const totalDaysWorked = presentDays + lateDays;
    const totalTracked = Math.max(1, totalDaysWorked + absentDays);

    const presenceRate =
      totalDaysWorked + absentDays > 0
        ? Math.round(safeNum((totalDaysWorked / totalTracked) * 100, 100))
        : 100;

    const ponctualiteRate =
      totalDaysWorked > 0
        ? Math.round(safeNum((presentDays / totalDaysWorked) * 100, 100))
        : 100;

    const rawAssiduite =
      100 - lateDays * 6 - earlyDepartureDays * 6 - absentDays * 15 + emergencyCount * 2;
    const assiduiteRate = Math.max(0, Math.min(100, Math.round(safeNum(rawAssiduite, 100))));

    const globalScore = Math.max(
      0,
      Math.min(100, Math.round(safeNum(0.4 * assiduiteRate + 0.35 * presenceRate + 0.25 * ponctualiteRate, 100)))
    );

    return {
      employee: emp,
      presentDays,
      lateDays,
      absentDays,
      earlyDepartureDays,
      emergencyCount,
      workedHoursTotal,
      totalTracked: totalDaysWorked + absentDays,
      workingDaysInPeriod,
      weekendWorkedDays,
      presenceRate,
      ponctualiteRate,
      assiduiteRate,
      globalScore,
    };
  });

  const overallPresent = statsByEmployee.reduce((sum, s) => sum + safeNum(s.presentDays), 0);
  const overallLate = statsByEmployee.reduce((sum, s) => sum + safeNum(s.lateDays), 0);
  const overallAbsent = statsByEmployee.reduce((sum, s) => sum + safeNum(s.absentDays), 0);

  const avgAssiduite =
    statsByEmployee.length > 0
      ? Math.round(
          safeNum(
            statsByEmployee.reduce((sum, s) => sum + safeNum(s.assiduiteRate, 100), 0) / statsByEmployee.length,
            100
          )
        )
      : 100;

  const avgPonctualite =
    statsByEmployee.length > 0
      ? Math.round(
          safeNum(
            statsByEmployee.reduce((sum, s) => sum + safeNum(s.ponctualiteRate, 100), 0) / statsByEmployee.length,
            100
          )
        )
      : 100;

  const avgPresence =
    statsByEmployee.length > 0
      ? Math.round(
          safeNum(
            statsByEmployee.reduce((sum, s) => sum + safeNum(s.presenceRate, 100), 0) / statsByEmployee.length,
            100
          )
        )
      : 100;

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
