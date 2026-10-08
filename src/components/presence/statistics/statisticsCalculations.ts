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

export function computePresenceStatistics(
  employees: Employee[],
  presences: Presence[],
  period: 'this_month' | 'last_month' | 'last_3_months' | 'all'
) {
  const now = new Date();
  const start = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  if (period === 'this_month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'last_month') {
    start.setMonth(start.getMonth() - 1);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setDate(0);
    end.setHours(23, 59, 59, 59);
  } else if (period === 'last_3_months') {
    start.setMonth(start.getMonth() - 3);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setFullYear(2024, 0, 1);
    start.setHours(0, 0, 0, 0);
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const startStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
  const endStr = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;

  const inRangePresences = presences.filter((p) => p.date >= startStr && p.date <= endStr);

  const statsByEmployee: EmployeeStatRow[] = employees.map((emp) => {
    const empPresences = inRangePresences.filter((p) => p.employeeId === emp.id);
    const presentDays = empPresences.filter((p) => p.status === 'present').length;
    const lateDays = empPresences.filter((p) => p.status === 'late').length;
    const absentDays = empPresences.filter((p) => p.status === 'absent').length;

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
