import { Employee, Presence } from '../../types';
import { isManagerOrAdminEmployee } from '../../utils/roleUtils';
import { isActualBadgePunch } from './presenceClockStepHelper';

export function buildFilteredPresencesList({
  mandatoryClockingEmployees,
  managerAndAdminEmployees,
  presences,
  targetDate,
  collaboratorFilter,
  isRestricted,
  myEmp,
}: {
  mandatoryClockingEmployees: Employee[];
  managerAndAdminEmployees: Employee[];
  presences: Presence[];
  targetDate: string;
  collaboratorFilter: string;
  isRestricted: boolean;
  myEmp?: Employee;
}): Presence[] {
  const makeAbsent = (emp: Employee, existing?: Presence): Presence => ({
    id: existing?.id || `absent-${emp.id}-${targetDate}`,
    employeeId: emp.id,
    employeeName: emp.name,
    date: targetDate,
    status: 'absent',
    arrivalTime: null,
    pauseStart: null,
    pauseEnd: null,
    departureTime: null,
    location: 'Non pointé (Absent)',
  });

  if (isRestricted && myEmp) {
    const existing = presences.find((p) => String(p.employeeId) === String(myEmp.id) && p.date === targetDate);
    return [isActualBadgePunch(existing) ? existing! : makeAbsent(myEmp, existing)];
  }

  const list: Presence[] = [];
  const addedIds = new Set<string>();

  mandatoryClockingEmployees.forEach((emp) => {
    if (collaboratorFilter !== 'all' && emp.id !== collaboratorFilter) return;
    addedIds.add(String(emp.id));
    const existing = presences.find((p) => String(p.employeeId) === String(emp.id) && p.date === targetDate);
    list.push(isActualBadgePunch(existing) ? existing! : makeAbsent(emp, existing));
  });

  managerAndAdminEmployees.forEach((emp) => {
    if (addedIds.has(String(emp.id)) || (collaboratorFilter !== 'all' && emp.id !== collaboratorFilter)) return;
    const existing = presences.find((p) => String(p.employeeId) === String(emp.id) && p.date === targetDate);
    if (isActualBadgePunch(existing)) list.push(existing!);
  });

  return list;
}

export function splitClockingEmployeesByRole(employees: Employee[]): {
  mandatoryClockingEmployees: Employee[];
  managerAndAdminEmployees: Employee[];
} {
  const mandatoryClockingEmployees = employees.filter((e) => {
    const st = e.employmentStatus || (typeof e.status === 'string' ? e.status : (e.status ? 'en_poste' : 'parti'));
    const isEnPoste = st === 'en_poste' || st === ('true' as any);
    if (!isEnPoste || e.roleType === 'sponsor') return false;
    return !isManagerOrAdminEmployee(e);
  });

  const managerAndAdminEmployees = employees.filter((e) => {
    const st = e.employmentStatus || (typeof e.status === 'string' ? e.status : (e.status ? 'en_poste' : 'parti'));
    const isEnPoste = st === 'en_poste' || st === ('true' as any);
    return isEnPoste && isManagerOrAdminEmployee(e);
  });

  return { mandatoryClockingEmployees, managerAndAdminEmployees };
}
