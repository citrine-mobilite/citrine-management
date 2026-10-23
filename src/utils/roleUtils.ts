import { AppUser, Role } from '../types';

/**
 * Normalise une chaîne de rôle (insensible à la casse et aux accents)
 * Ex: "Employé", "employé", "EMPLOYE", "employee" -> "employe"
 */
export function normalizeRoleString(role?: string | null): string {
  if (!role) return '';
  return role
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Vérifie si l'utilisateur est un employé
 */
export function isEmployeeUser(user?: { role?: string | null } | null): boolean {
  if (!user || !user.role) return false;
  const normalized = normalizeRoleString(user.role);
  return normalized === 'employe' || normalized === 'employee';
}

/**
 * Vérifie si l'utilisateur est un responsable ou manager
 */
export function isManagerUser(user?: { role?: string | null } | null): boolean {
  if (!user || !user.role) return false;
  const normalized = normalizeRoleString(user.role);
  return normalized === 'responsable' || normalized === 'manager';
}

/**
 * Vérifie si l'utilisateur est un administrateur
 */
export function isAdminUser(user?: { role?: string | null } | null): boolean {
  if (!user || !user.role) return false;
  const normalized = normalizeRoleString(user.role);
  return normalized === 'administrateur' || normalized === 'admin' || normalized === 'superadmin';
}

/**
 * Détermine le portail/onglet d'atterrissage officiel en fonction du rôle
 */
export function getDefaultPortalForUser(user?: { role?: string | null } | null): string {
  if (isEmployeeUser(user)) {
    return 'employee_portal'; // Espace Personnel Collaborateur
  }
  // Administrateurs & Responsables
  return 'dashboard'; // Tableau de Bord & Pilotage Opérationnel
}

/**
 * Vérifie si le profil concerne strictement un employé (et non un responsable ou admin).
 * Seuls les employés badgent.
 */
export function isEmployeeOnlyRole(roleOrRoleType?: string | null): boolean {
  if (!roleOrRoleType) return true;
  const normalized = normalizeRoleString(roleOrRoleType);
  if (
    normalized.includes('admin') ||
    normalized.includes('responsable') ||
    normalized.includes('manager') ||
    normalized.includes('direction')
  ) {
    return false;
  }
  return true;
}

/**
 * Vérifie si l'utilisateur peut voir TOUTES les notifications.
 * Seuls les administrateurs, l'IT (même droit que super admin) et les responsables peuvent voir toutes les notifications.
 * Les employés et stagiaires ne voient que les notifications qui les concernent personnellement.
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
 * Les employés et stagiaires ne peuvent JAMAIS réassigner une tâche.
 * Seuls les administrateurs, l'IT et les responsables/managers en ont le droit.
 */
export function canManageTaskAssignment(user?: { role?: string | null } | null, currentRole?: string): boolean {
  const roleToCheck = user?.role || currentRole;
  if (!roleToCheck) return false;
  const normalized = normalizeRoleString(roleToCheck);
  // Stagiaire ou employé : STRICTEMENT INTERDIT
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
 * Vérifie si l'utilisateur a le droit de voir les données des AUTRES collaborateurs
 * (rendement, charge de travail, assiduité, tâches, incidents, documents, pointages, alertes).
 * 
 * Règle d'or :
 * - Les employés et les stagiaires ne voient STRICTEMENT que ce qui les concerne personnellement.
 * - Seuls les responsables, le IT (mêmes droits que superadmin) et les administrateurs/superadmin peuvent voir les données des autres.
 */
export function canViewOthersData(user?: { role?: string | null } | null, currentRole?: string): boolean {
  const roleToCheck = user?.role || currentRole;
  if (!roleToCheck) return false;
  const normalized = normalizeRoleString(roleToCheck);

  // Stagiaire ou employé : STRICTEMENT RESTREINT À SOI-MÊME
  if (
    normalized === 'employe' ||
    normalized === 'employee' ||
    normalized === 'stagiaire' ||
    normalized === 'intern'
  ) {
    return false;
  }

  // Seuls les responsables, IT et administrateurs peuvent voir pour autrui
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


