import { Employee, Presence } from '../../../types';

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
}

export type RankingSortTab = 'all' | 'presences' | 'assiduite' | 'ponctualite';

export type StatisticsPeriod = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'last_3_months' | 'all' | 'custom';

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
    const day = now.getDay(); // 0: Dimanche, 1: Lundi...
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

  const inRangePresences = presences.filter((p) => p.date >= startStr && p.date <= endStr);

  const statsByEmployee: EmployeeStatRow[] = employees.map((emp) => {
    const empPresences = inRangePresences.filter((p) => p.employeeId === emp.id);
    const presentDays = empPresences.filter((p) => p.status === 'present').length;
    const lateDays = empPresences.filter((p) => p.status === 'late').length;
    const isEmpOnMission = emp.employmentStatus === 'en_mission' || emp.status === 'en_mission';
    const absentDays = isEmpOnMission ? 0 : empPresences.filter((p) => p.status === 'absent').length;

    let earlyDepartureDays = 0;
    let emergencyCount = 0;

    empPresences.forEach((p) => {
      if (p.emergencies) emergencyCount += p.emergencies.length;
      if (p.departureTime && p.departureTime < '16:00') {
        earlyDepartureDays += 1;
      }
    });

    const totalDaysWorked = presentDays + lateDays;
    const totalTracked = totalDaysWorked + absentDays || 1;

    // 1. Taux de Présence : Proportion de jours travaillés
    const presenceRate = totalTracked > 0 ? Math.round((totalDaysWorked / totalTracked) * 100) : 100;

    // 2. Taux de Ponctualité : Arrivées à l'heure parmi les présences effectives
    const ponctualiteRate = totalDaysWorked > 0 ? Math.round((presentDays / totalDaysWorked) * 100) : 100;

    // 3. Score d'Assiduité RH : Rigueur et respect des horaires sans fautes
    const rawAssiduite = 100 - (lateDays * 6) - (earlyDepartureDays * 6) - (absentDays * 15) + (emergencyCount * 2);
    const assiduiteRate = Math.max(0, Math.min(100, Math.round(rawAssiduite)));

    // 4. Score Global Combiné RH
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
    };
  });

  const overallPresent = statsByEmployee.reduce((sum, s) => sum + s.presentDays, 0);
  const overallLate = statsByEmployee.reduce((sum, s) => sum + s.lateDays, 0);
  const overallAbsent = statsByEmployee.reduce((sum, s) => sum + s.absentDays, 0);
  const overallTotal = overallPresent + overallLate + overallAbsent;

  const avgAssiduite =
    statsByEmployee.length > 0
      ? Math.round(statsByEmployee.reduce((sum, s) => sum + s.assiduiteRate, 0) / statsByEmployee.length)
      : 100;

  const avgPonctualite =
    statsByEmployee.length > 0
      ? Math.round(statsByEmployee.reduce((sum, s) => sum + s.ponctualiteRate, 0) / statsByEmployee.length)
      : 100;

  const avgPresence =
    statsByEmployee.length > 0
      ? Math.round(statsByEmployee.reduce((sum, s) => sum + s.presenceRate, 0) / statsByEmployee.length)
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
