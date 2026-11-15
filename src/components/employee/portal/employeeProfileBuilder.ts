import { AppUser, Employee, NotificationLog, Reminder } from '../../../types';

export const VALID_EMPLOYEE_SUBTABS = [
  'clocking',
  'presences',
  'incidents',
  'leaves',
  'salaries',
  'loans',
  'tasks',
  'alerts',
  'profile',
  'install_pwa',
] as const;

export type EmployeeSubTab = (typeof VALID_EMPLOYEE_SUBTABS)[number];

export function buildEmployeeProfile(currentUser: AppUser | null, employees: Employee[]): Employee {
  const foundEmp = employees.find((emp) => {
    if (!currentUser) return false;
    const curEmail = currentUser.email?.toLowerCase().trim();
    const curId = String(currentUser.id || '').trim();
    const curEmpId = currentUser.employeeId ? String(currentUser.employeeId).trim() : '';

    if (curEmail && emp.email?.toLowerCase().trim() === curEmail) return true;
    if (curEmpId && (String(emp.id) === curEmpId || emp.uid === curEmpId)) return true;
    if (emp.userId && String(emp.userId) === curId) return true;
    if (String(emp.id) === curId) return true;
    if (emp.name && currentUser.name && emp.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) return true;
    return false;
  });

  return {
    ...(foundEmp || {}),
    id: foundEmp?.id || currentUser?.id || 'unknown',
    uid: foundEmp?.uid,
    _dbId: foundEmp?._dbId,
    userId: foundEmp?.userId || currentUser?.id,
    roleId: foundEmp?.roleId ?? currentUser?.roleId,
    managerId: foundEmp?.managerId ?? currentUser?.managerId,
    managerName: foundEmp?.managerName ?? currentUser?.managerName,
    team: foundEmp?.team ?? currentUser?.team,
    teams: Array.isArray(foundEmp?.teams) && foundEmp.teams.length > 0 ? foundEmp.teams : currentUser?.teams,
    birthDate: foundEmp?.birthDate || currentUser?.birthDate,
    allowEarlyDeparture15_17: Boolean(foundEmp?.allowEarlyDeparture15_17 || currentUser?.allowEarlyDeparture15_17),
    allowLateArrival8_930: Boolean(foundEmp?.allowLateArrival8_930 || currentUser?.allowLateArrival8_930),
    name: currentUser?.name || foundEmp?.name || 'Collaborateur',
    firstName: foundEmp?.firstName,
    lastName: foundEmp?.lastName,
    email: currentUser?.email || foundEmp?.email || '',
    roleType: (foundEmp?.roleType || currentUser?.role || 'employé') as any,
    department: currentUser?.department || foundEmp?.department || 'Général',
    position: foundEmp?.position || (foundEmp?.roleType as string),
    avatarUrl: currentUser?.avatarUrl || foundEmp?.avatarUrl || '',
    phone: currentUser?.phone || foundEmp?.phone || '',
    status: foundEmp?.status || 'en_poste',
    employmentStatus: foundEmp?.employmentStatus || 'en_poste',
    hireDate: foundEmp?.hireDate || '2025-01-01',
    salary: foundEmp?.salary || 0,
  };
}

export function computeEmployeeUnreadAlertsCount(
  notifications: NotificationLog[] | undefined,
  reminders: Reminder[] | undefined,
  employeeProfile: Employee,
  currentUser: AppUser | null
): number {
  try {
    const readSet = new Set<string>();
    const deletedSet = new Set<string>();

    const myIds = [
      employeeProfile.id,
      employeeProfile.uid,
      employeeProfile._dbId,
      currentUser?.id,
      currentUser?.employeeId,
      (currentUser as any)?.uid,
      (employeeProfile as any).code,
    ]
      .filter(Boolean)
      .map((s) => String(s).trim().toLowerCase());
    const myNames = [employeeProfile.name, currentUser?.name].filter(Boolean).map((s) => String(s).trim().toLowerCase());
    const myEmails = [employeeProfile.email, currentUser?.email].filter(Boolean).map((s) => String(s).trim().toLowerCase());

    const isMatch = (val?: string | null) => {
      if (!val) return false;
      const clean = String(val).trim().toLowerCase();
      if (clean === 'équipe' || clean === 'equipe' || clean === 'tous') return true;
      const parts = clean.split(',').map((p) => p.trim());
      return parts.some((p) => myIds.includes(p) || myNames.includes(p) || myEmails.includes(p));
    };

    let count = 0;
    const seenIds = new Set<string>();

    if (notifications) {
      notifications.forEach((n) => {
        let isForMe = isMatch(n.recipient);
        if (n.payload) {
          try {
            const p = typeof n.payload === 'string' ? JSON.parse(n.payload) : n.payload;
            if (p && (isMatch(p.employeeId) || isMatch(p.recipientId) || isMatch(p.assignedTo))) {
              isForMe = true;
            }
          } catch {}
        }
        if (isForMe && !deletedSet.has(n.id) && !seenIds.has(n.id)) {
          seenIds.add(n.id);
          if (!readSet.has(n.id) && !n.read) count++;
        }
      });
    }

    if (reminders) {
      reminders.forEach((r) => {
        const isTargeted =
          r.allEmployees ||
          (r.employeeId && myIds.includes(String(r.employeeId).toLowerCase())) ||
          (r.employeeIds && r.employeeIds.some((id) => myIds.includes(String(id).toLowerCase())));

        if (isTargeted && !deletedSet.has(r.id) && !seenIds.has(r.id)) {
          seenIds.add(r.id);
          if (!readSet.has(r.id) && !r.stopped) count++;
        }
      });
    }

    return count;
  } catch {
    return 0;
  }
}

export function calculateEmployeeTenure(hireDate?: string): string {
  if (!hireDate) return '1 an';
  const hire = new Date(hireDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - hire.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  if (years > 0) {
    return `${years} an${years > 1 ? 's' : ''}${months > 0 ? ` et ${months} mois` : ''}`;
  }
  if (months > 0) {
    return `${months} mois`;
  }
  return `${diffDays} jours`;
}
