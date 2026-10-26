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
 * Détermine si un collaborateur est soumis au pointage des présences.
 * 
 * Règle d'or :
 * - Tous les collaborateurs en poste (statut 'en_poste') doivent pointer.
 * - L'IT (informaticien, support, administrateur système, etc.) DOIT IMPÉRATIVEMENT POINTER.
 * - Les employés, stagiaires, techniciens et responsables opérationnels en poste doivent pointer.
 * - Ne sont exclus que les sponsors/partenaires externes ou les collaborateurs ayant quitté l'entreprise.
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

  // 1. Vérification du statut d'activité dans l'entreprise
  const rawStatus = employee.employmentStatus || (typeof employee.status === 'string' ? employee.status : (employee.status ? 'en_poste' : 'parti'));
  const isEnPoste = rawStatus === 'en_poste' || rawStatus === 'true' || rawStatus === true;
  if (!isEnPoste) return false;

  // 2. Exclusion des sponsors ou profils purement externes
  const normRoleType = normalizeRoleString(employee.roleType);
  if (normRoleType === 'sponsor' || normRoleType === 'partenaire') return false;

  // 3. L'IT DOIT TOUJOURS POINTER (priorité absolue)
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
    return true; // L'IT pointe TOUJOURS !
  }

  // 4. Direction générale pure non salariée (hors IT)
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
 * L'IT fait partie des collaborateurs soumis au pointage.
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
 * Règle d'or de présence Citrine :
 * Dans la feuille de pointage, les responsables et les super admins NE SONT AFFICHÉS QUE S'ILS ONT BADGÉ.
 * S'ils n'ont pas badgé, ils ne sont jamais affichés dans la liste des pointages du jour.
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

  // 1. Détection par roleId numérique officiel (1 = Admin, 2 = Responsable)
  const rId = Number(employee.roleId);
  if (rId === 1 || rId === 2) {
    return true;
  }

  // 2. Détection par email du compte Super Admin principal
  const email = (employee.email || '').toLowerCase().trim();
  if (email === 'citrinemobilite@gmail.com') {
    return true;
  }

  // 3. Normalisation des intitulés de rôle, fonction, et direction
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
 * L'IT DOIT IMPÉRATIVEMENT POINTER.
 */
export function isEmployeeOnlyRole(roleOrRoleType?: string | null, departmentOrPosition?: string | null): boolean {
  if (!roleOrRoleType && !departmentOrPosition) return true;
  const normalized = normalizeRoleString(roleOrRoleType);
  const normDeptPos = normalizeRoleString(departmentOrPosition);

  // L'IT pointe TOUJOURS
  if (
    normalized.includes('it') ||
    normalized.includes('informatique') ||
    normalized.includes('informaticien') ||
    normDeptPos.includes('it') ||
    normDeptPos.includes('informatique')
  ) {
    return true;
  }

  // Direction générale pure
  if (normalized.includes('direction') || normDeptPos.includes('direction')) {
    return false;
  }

  // Administrateur pur (hors IT)
  if (normalized.includes('admin') && !normalized.includes('it') && !normDeptPos.includes('it')) {
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


