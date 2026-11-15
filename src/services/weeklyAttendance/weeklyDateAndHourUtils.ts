export function isStrictSuperAdminAccount(emp: any, users?: any[]): boolean {
  if (!emp) return false;
  const normalize = (str?: string | null) => (str || '').toLowerCase().replace(/[\s_-]/g, '');

  const email = (emp.email || '').toLowerCase().trim();
  if (email === 'citrinemobilite@gmail.com') return true;

  const role = normalize(emp.role);
  const roleType = normalize(emp.roleType);
  const pos = normalize(emp.position);
  const uRole = normalize(emp.userRole);

  if (
    role.includes('superadmin') ||
    role.includes('superadministrateur') ||
    roleType.includes('superadmin') ||
    roleType.includes('superadministrateur') ||
    pos.includes('superadmin') ||
    pos.includes('superadministrateur') ||
    uRole.includes('superadmin') ||
    uRole.includes('superadministrateur')
  ) {
    return true;
  }

  if (users && users.length > 0) {
    const empId = String(emp.id || '');
    const matchedUser = users.find((u) => {
      const matchId = String(u.employeeId || u.employee_id || '') === empId;
      const matchEmail = email && String(u.email || '').trim().toLowerCase() === email;
      return (empId && matchId) || matchEmail;
    });

    if (matchedUser) {
      const userNormRole = normalize(matchedUser.role);
      const userNormRoleType = normalize(matchedUser.roleType);
      if (
        userNormRole.includes('superadmin') ||
        userNormRole.includes('superadministrateur') ||
        userNormRoleType.includes('superadmin') ||
        userNormRoleType.includes('superadministrateur')
      ) {
        return true;
      }
    }
  }

  return false;
}

export function isArrivalAfterThreshold(arrivalTime?: string | null, threshold: string = '08:00'): boolean {
  if (!arrivalTime || !arrivalTime.includes(':')) return false;
  const [h, m] = arrivalTime.split(':').map((v) => parseInt(v, 10));
  const [thH, thM] = threshold.split(':').map((v) => parseInt(v, 10));
  if (isNaN(h) || isNaN(m) || isNaN(thH) || isNaN(thM)) return false;
  return h * 60 + m > thH * 60 + thM;
}

export function getDoualaCurrentWeek(referenceDate: Date = new Date(), options?: { forceFriday?: boolean }) {
  const doualaFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Douala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = doualaFormatter.formatToParts(referenceDate);
  const year = parseInt(parts.find((p) => p.type === 'year')?.value || '2026', 10);
  const month = parseInt(parts.find((p) => p.type === 'month')?.value || '1', 10) - 1;
  const day = parseInt(parts.find((p) => p.type === 'day')?.value || '1', 10);

  const localDate = new Date(year, month, day);
  const dayOfWeek = localDate.getDay();

  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(localDate);
  monday.setDate(localDate.getDate() + diffToMonday);

  let targetEndDay = dayOfWeek;
  if (options?.forceFriday || dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek >= 5) {
    targetEndDay = 5;
  } else if (targetEndDay < 1) {
    targetEndDay = 1;
  }

  const days: Array<{
    date: Date;
    dateIso: string;
    dayName: string;
    isToday: boolean;
    isPastOrToday: boolean;
  }> = [];

  const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const isPastOrToday = i + 1 <= targetEndDay;
    const isToday = i + 1 === dayOfWeek;
    days.push({ date: d, dateIso: iso, dayName: dayNames[i], isToday, isPastOrToday });
  }

  const mondayIso = days[0].dateIso;
  const endDayItem = days[Math.min(targetEndDay - 1, 4)];
  const endDateIso = endDayItem ? endDayItem.dateIso : days[4].dateIso;

  const dateFrFormatter = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return {
    mondayDate: days[0].date,
    mondayIso,
    mondayLabel: `${days[0].dayName} ${dateFrFormatter.format(days[0].date)}`,
    endDate: endDayItem.date,
    endDateIso,
    endLabel: `${endDayItem.dayName} ${dateFrFormatter.format(endDayItem.date)}`,
    targetEndDay,
    isFullWeek: targetEndDay >= 5,
    days,
  };
}

export function calculateHoursWorked(arrival?: string, departure?: string, pauseStart?: string, pauseEnd?: string): number {
  if (!arrival) return 0;
  const parseMins = (timeStr?: string) => {
    if (!timeStr || !timeStr.includes(':')) return null;
    const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };
  const arrMins = parseMins(arrival);
  if (arrMins === null) return 0;
  const depMins = parseMins(departure);
  if (depMins === null) return 0;

  let totalMins = depMins - arrMins;
  const pStartMins = parseMins(pauseStart);
  const pEndMins = parseMins(pauseEnd);
  if (pStartMins !== null && pEndMins !== null && pEndMins > pStartMins) {
    totalMins -= pEndMins - pStartMins;
  }
  return Math.max(0, Math.round((totalMins / 60) * 10) / 10);
}

export function formatHours(hours: number): string {
  if (hours <= 0) return '0h';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
}
