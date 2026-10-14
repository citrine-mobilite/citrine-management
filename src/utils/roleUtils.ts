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
