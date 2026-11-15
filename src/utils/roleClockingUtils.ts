import { normalizeRoleString } from './roleCoreUtils';

/**
 * Détermine si un collaborateur est soumis au pointage des présences.
 */
export function shouldEmployeeClock(employee?: {
  role?: string | null;
  roleType?: string | null;
  position?: string | null;
  department?: string | null;
  email?: string | null;
  name?: string | null;
  status?: any;
  employmentStatus?: any;
} | null): boolean {
  if (!employee) return false;

  const rawStatus = employee.employmentStatus || (typeof employee.status === 'string' ? employee.status : (employee.status ? 'en_poste' : 'parti'));
  const isEnPoste = rawStatus === 'en_poste' || rawStatus === 'true' || rawStatus === true;
  if (!isEnPoste) return false;

  const normRoleType = normalizeRoleString(employee.roleType);
  if (normRoleType === 'sponsor' || normRoleType === 'partenaire') return false;

  const dept = normalizeRoleString(employee.department);
  const pos = normalizeRoleString(employee.position);
  const role = normalizeRoleString(employee.role);
  const email = (employee.email || '').toLowerCase().trim();
  const name = (employee.name || '').toLowerCase().trim();

  const isIT =
    dept === 'it' ||
    dept.includes('informatique') ||
    dept.includes('information') ||
    dept.includes('technologie') ||
    normRoleType.includes('it') ||
    normRoleType.includes('informaticien') ||
    normRoleType.includes('developpeur') ||
    pos.includes('it') ||
    pos.includes('informatique') ||
    pos.includes('administrateur systeme') ||
    role.includes('it') ||
    email.includes('it') ||
    email === 'citrinemobilite@gmail.com' ||
    name.includes('citrine mobilite') ||
    name.includes('it');

  if (isIT) {
    return true;
  }

  const isPureDirection =
    (dept === 'direction' || dept === 'direction generale') &&
    (pos.includes('directeur general') || pos.includes('pdg') || normRoleType.includes('direction'));

  if (isPureDirection) {
    return false;
  }

  return true;
}

/**
 * Vérifie si le collaborateur fait partie de l'équipe IT (informaticien, support, sysadmin, etc.)
 */
export function isITEmployee(employee?: {
  role?: string | null;
  roleType?: string | null;
  position?: string | null;
  department?: string | null;
  email?: string | null;
  name?: string | null;
} | null): boolean {
  if (!employee) return false;
  const dept = normalizeRoleString(employee.department);
  const pos = normalizeRoleString(employee.position);
  const role = normalizeRoleString(employee.role);
  const normRoleType = normalizeRoleString(employee.roleType);
  const email = (employee.email || '').toLowerCase().trim();
  const name = (employee.name || '').toLowerCase().trim();

  return (
    dept === 'it' ||
    dept.includes('informatique') ||
    dept.includes('information') ||
    dept.includes('technologie') ||
    normRoleType.includes('it') ||
    normRoleType.includes('informaticien') ||
    normRoleType.includes('developpeur') ||
    pos.includes('it') ||
    pos.includes('informatique') ||
    pos.includes('administrateur systeme') ||
    role.includes('it') ||
    email.includes('it') ||
    email === 'citrinemobilite@gmail.com' ||
    name.includes('citrine mobilite') ||
    name.includes('it')
  );
}

/**
 * Vérifie si un collaborateur est un responsable ou un super administrateur.
 */
export function isManagerOrAdminEmployee(employee?: {
  roleId?: number | string | null;
  role?: string | null;
  roleType?: string | null;
  position?: string | null;
  department?: string | null;
  userRole?: string | null;
  email?: string | null;
  name?: string | null;
} | null): boolean {
  if (!employee) return false;

  const rId = Number(employee.roleId);
  if (rId === 1 || rId === 2) {
    return true;
  }

  const email = (employee.email || '').toLowerCase().trim();
  if (email === 'citrinemobilite@gmail.com') {
    return true;
  }

  const role = normalizeRoleString(employee.role);
  const roleType = normalizeRoleString(employee.roleType);
  const pos = normalizeRoleString(employee.position);
  const userRole = normalizeRoleString(employee.userRole);
  const dept = normalizeRoleString(employee.department);

  return (
    role.includes('admin') ||
    role.includes('super') ||
    role.includes('responsable') ||
    role.includes('manager') ||
    roleType.includes('admin') ||
    roleType.includes('super') ||
    roleType.includes('responsable') ||
    roleType.includes('manager') ||
    roleType.includes('direction') ||
    userRole.includes('admin') ||
    userRole.includes('super') ||
    userRole.includes('responsable') ||
    userRole.includes('manager') ||
    pos.includes('directeur') ||
    pos.includes('responsable') ||
    pos.includes('manager') ||
    pos.includes('admin') ||
    dept.includes('direction')
  );
}

/**
 * Vérifie si le profil concerne un collaborateur soumis au pointage.
 */
export function isEmployeeOnlyRole(roleOrRoleType?: string | null, departmentOrPosition?: string | null): boolean {
  if (!roleOrRoleType && !departmentOrPosition) return true;
  const normalized = normalizeRoleString(roleOrRoleType);
  const normDeptPos = normalizeRoleString(departmentOrPosition);

  if (
    normalized.includes('it') ||
    normalized.includes('informatique') ||
    normalized.includes('informaticien') ||
    normDeptPos.includes('it') ||
    normDeptPos.includes('informatique')
  ) {
    return true;
  }

  if (normalized.includes('direction') || normDeptPos.includes('direction')) {
    return false;
  }

  if (normalized.includes('admin') && !normalized.includes('it') && !normDeptPos.includes('it')) {
    return false;
  }

  return true;
}
