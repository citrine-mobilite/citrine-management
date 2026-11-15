import { normalizeRoleString } from './roleCoreUtils';

/**
 * Vérifie si l'utilisateur peut voir TOUTES les notifications.
 */
export function canSeeAllNotifications(user?: { role?: string | null } | null): boolean {
  if (!user || !user.role) return false;
  const normalized = normalizeRoleString(user.role);
  if (
    normalized.includes('admin') ||
    normalized.includes('super') ||
    normalized.includes('it') ||
    normalized.includes('informatique') ||
    normalized.includes('responsable') ||
    normalized.includes('manager') ||
    normalized.includes('direction')
  ) {
    return true;
  }
  return false;
}

/**
 * Vérifie si l'utilisateur a le droit d'assigner ou réassigner des tâches / sous-tâches.
 */
export function canManageTaskAssignment(user?: { role?: string | null } | null, currentRole?: string): boolean {
  const roleToCheck = user?.role || currentRole;
  if (!roleToCheck) return false;
  const normalized = normalizeRoleString(roleToCheck);
  if (
    normalized === 'employe' ||
    normalized === 'employee' ||
    normalized === 'stagiaire' ||
    normalized === 'intern'
  ) {
    return false;
  }
  return (
    normalized.includes('admin') ||
    normalized.includes('super') ||
    normalized.includes('it') ||
    normalized.includes('informatique') ||
    normalized.includes('responsable') ||
    normalized.includes('manager') ||
    normalized.includes('direction')
  );
}

/**
 * Vérifie si l'utilisateur a le droit de voir les données des AUTRES collaborateurs.
 */
export function canViewOthersData(user?: { role?: string | null } | null, currentRole?: string): boolean {
  const roleToCheck = user?.role || currentRole;
  if (!roleToCheck) return false;
  const normalized = normalizeRoleString(roleToCheck);

  if (
    normalized === 'employe' ||
    normalized === 'employee' ||
    normalized === 'stagiaire' ||
    normalized === 'intern'
  ) {
    return false;
  }

  return (
    normalized.includes('admin') ||
    normalized.includes('super') ||
    normalized.includes('it') ||
    normalized.includes('informatique') ||
    normalized.includes('responsable') ||
    normalized.includes('manager') ||
    normalized.includes('direction')
  );
}

/**
 * Raccourci vérifiant si l'utilisateur est restreint à ses propres données exclusivement.
 */
export function isSelfOnlyUser(user?: { role?: string | null } | null, currentRole?: string): boolean {
  return !canViewOthersData(user, currentRole);
}

/**
 * Trouve l'employé correspondant à un compte utilisateur dans la liste des employés.
 */
export function findMatchingEmployee<T extends { id?: string; email?: string; name?: string }>(
  employees: T[],
  currentUser?: { id?: string; email?: string; name?: string } | null
): T | undefined {
  if (!currentUser || !employees || employees.length === 0) return undefined;

  const userId = (currentUser.id || '').toLowerCase();
  const userEmail = (currentUser.email || '').toLowerCase();
  const userName = (currentUser.name || '').toLowerCase();

  return employees.find((e) => {
    const empId = (e.id || '').toLowerCase();
    const empEmail = (e.email || '').toLowerCase();
    const empName = (e.name || '').toLowerCase();

    if (userId && empId === userId) return true;
    if (userEmail && empEmail === userEmail) return true;
    if (userName && empName === userName) return true;
    return false;
  });
}
