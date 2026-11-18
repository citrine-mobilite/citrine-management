import { AppUser, EmployeeStatus } from '../../types';
export function mapDbUserRow(u: any): AppUser {
  const raw = u.raw_data && typeof u.raw_data === 'object' ? u.raw_data : {};
  const isUserActive =
    u.status === true ||
    u.status === 1 ||
    String(u.status).toLowerCase() === 'actif' ||
    String(u.status).toLowerCase() === 'active' ||
    String(raw.status).toLowerCase() === 'actif' ||
    String(raw.status).toLowerCase() === 'active' ||
    String(raw.status).toLowerCase() === 'en_poste';

  let resolvedRole: 'administrateur' | 'responsable' | 'employé' = 'employé';
  if (
    u.role_id === 1 ||
    String(raw.role).toUpperCase().includes('ADMIN') ||
    String(raw.role).toLowerCase() === 'administrateur'
  ) {
    resolvedRole = 'administrateur';
  } else if (u.role_id === 2 || String(raw.role).toUpperCase() === 'RESPONSABLE') {
    resolvedRole = 'responsable';
  }

  return {
    ...raw,
    id: String(u.id),
    uid: u.uid,
    doc_id: u.doc_id || raw.doc_id,
    name: u.name || raw.name || (u.email ? u.email.split('@')[0] : 'Utilisateur'),
    email: u.email,
    role: resolvedRole,
    roleId: u.role_id || raw.roleId || (resolvedRole === 'administrateur' ? 1 : resolvedRole === 'responsable' ? 2 : 3),
    status: isUserActive ? 'actif' : 'inactif',
    employmentStatus: raw.employmentStatus || (isUserActive ? 'en_poste' : 'suspendu'),
    department: u.department || raw.department || 'Général',
    phone: u.phone || raw.phone || '',
    avatarUrl: u.avatar_url || raw.avatarUrl || '',
    employeeId: raw.employeeId ? String(raw.employeeId) : (raw.employeeDbId ? String(raw.employeeDbId) : undefined),
    birthDate: raw.birthDate,
    team: raw.team,
    teams: Array.isArray(raw.teams) ? raw.teams : undefined,
    managerId: raw.managerId,
    managerName: raw.managerName,
    allowEarlyDeparture15_17: Boolean(raw.allowEarlyDeparture15_17 || u.allow_early_departure_15_17),
    allowLateArrival8_930: Boolean(raw.allowLateArrival8_930 || u.allow_late_arrival_8_930),
    passwordHash: raw.passwordHash || raw.password_hash || u.password_hash || '',
    createdAt: u.created_at || raw.createdAt || new Date().toISOString(),
  };
}

export function mapDbUserAndEmpToAppUser(dbUser: any, dbEmp: any, cleanEmail: string): AppUser {
  const raw = dbUser.raw_data && typeof dbUser.raw_data === 'object' ? dbUser.raw_data : {};
  const empStatus: EmployeeStatus =
    dbEmp?.employment_status ||
    dbEmp?.employmentStatus ||
    raw.employmentStatus ||
    (dbEmp?.status === false ? 'parti' : 'en_poste');

  const isBlockedBySituation =
    empStatus === 'renvoye' ||
    empStatus === 'demissionne' ||
    empStatus === 'parti' ||
    empStatus === 'suspendu';

  const isBaseActive =
    dbUser.status === true ||
    dbUser.status === 1 ||
    String(dbUser.status).toLowerCase() === 'actif' ||
    String(dbUser.status).toLowerCase() === 'active' ||
    String(dbUser.status).toLowerCase() === 'true';

  const isUserActive = isBaseActive && !isBlockedBySituation;

  let resolvedRole: 'administrateur' | 'responsable' | 'employé' = 'employé';
  if (
    dbUser.role_id === 1 ||
    String(raw.role).toUpperCase() === 'SUPER_ADMIN' ||
    String(raw.role).toLowerCase() === 'administrateur' ||
    String(raw.role).toLowerCase().includes('admin')
  ) {
    resolvedRole = 'administrateur';
  } else if (
    dbUser.role_id === 2 ||
    String(raw.role).toUpperCase() === 'RESPONSABLE' ||
    String(raw.role).toLowerCase() === 'responsable' ||
    String(raw.role).toLowerCase().includes('manager')
  ) {
    resolvedRole = 'responsable';
  } else if (
    dbUser.role_id === 3 ||
    String(raw.role).toUpperCase() === 'EMPLOYE' ||
    String(raw.role).toLowerCase() === 'employé'
  ) {
    resolvedRole = 'employé';
  }

  const empRaw = dbEmp?.raw_data && typeof dbEmp.raw_data === 'object' ? dbEmp.raw_data : {};
  return {
    ...raw,
    id: String(dbUser.id),
    uid: dbUser.uid,
    name: dbUser.name || raw.name || cleanEmail.split('@')[0],
    email: dbUser.email || cleanEmail,
    role: resolvedRole,
    roleId: dbUser.role_id || raw.roleId || (resolvedRole === 'administrateur' ? 1 : resolvedRole === 'responsable' ? 2 : 3),
    status: isUserActive ? 'actif' : 'inactif',
    employmentStatus: empStatus,
    department: dbUser.department || dbEmp?.department || raw.department || 'Direction Générale',
    phone: dbUser.phone || dbEmp?.phone || raw.phone || '',
    avatarUrl: dbUser.avatar_url || dbEmp?.photo_url || dbEmp?.avatar_url || raw.avatarUrl || '',
    passwordHash: raw.passwordHash || raw.password_hash || dbUser.password_hash || '',
    employeeId: dbEmp?.id ? String(dbEmp.id) : raw.employeeId,
    birthDate: raw.birthDate || empRaw.birthDate,
    team: raw.team || empRaw.team,
    teams: Array.isArray(raw.teams) ? raw.teams : (Array.isArray(empRaw.teams) ? empRaw.teams : undefined),
    managerId: raw.managerId || empRaw.managerId,
    managerName: raw.managerName || empRaw.managerName,
    allowEarlyDeparture15_17: Boolean(raw.allowEarlyDeparture15_17 || empRaw.allowEarlyDeparture15_17),
    allowLateArrival8_930: Boolean(raw.allowLateArrival8_930 || empRaw.allowLateArrival8_930),
    createdAt: dbUser.created_at || raw.createdAt || new Date().toISOString(),
  };
}

export function mapDbEmployeeOnlyToAppUser(dbEmp: any, cleanEmail: string): AppUser {
  const raw = dbEmp.raw_data && typeof dbEmp.raw_data === 'object' ? dbEmp.raw_data : {};
  const empStatus: EmployeeStatus = dbEmp.employment_status || dbEmp.employmentStatus || (dbEmp.status ? 'en_poste' : 'parti');
  const isBlockedBySituation =
    empStatus === 'renvoye' ||
    empStatus === 'demissionne' ||
    empStatus === 'parti' ||
    empStatus === 'suspendu';

  const isEmpActive =
    (dbEmp.status === true ||
      dbEmp.status === 1 ||
      String(dbEmp.status).toLowerCase() === 'actif' ||
      String(dbEmp.status).toLowerCase() === 'true') &&
    !isBlockedBySituation;

  let resolvedRole: 'administrateur' | 'responsable' | 'employé' = 'employé';
  if (dbEmp.role_id === 1 || String(dbEmp.role_type).toLowerCase().includes('admin')) {
    resolvedRole = 'administrateur';
  } else if (
    dbEmp.role_id === 2 ||
    String(dbEmp.role_type).toLowerCase().includes('responsable') ||
    String(dbEmp.position).toLowerCase().includes('responsable')
  ) {
    resolvedRole = 'responsable';
  }

  return {
    id: String(dbEmp.id),
    uid: dbEmp.uid,
    name: dbEmp.name || `${dbEmp.first_name || ''} ${dbEmp.last_name || ''}`.trim() || raw.name || 'Collaborateur',
    email: dbEmp.email || cleanEmail,
    role: resolvedRole,
    roleId: dbEmp.role_id || raw.roleId || (resolvedRole === 'administrateur' ? 1 : resolvedRole === 'responsable' ? 2 : 3),
    status: isEmpActive ? 'actif' : 'inactif',
    employmentStatus: empStatus,
    department: dbEmp.department || raw.department || 'Direction Générale',
    phone: dbEmp.phone || raw.phone || '',
    avatarUrl: dbEmp.photo_url || dbEmp.avatar_url || raw.avatarUrl || '',
    passwordHash: raw.passwordHash || raw.password_hash || '',
    employeeId: String(dbEmp.id),
    birthDate: raw.birthDate,
    team: raw.team,
    teams: Array.isArray(raw.teams) ? raw.teams : undefined,
    managerId: raw.managerId,
    managerName: raw.managerName,
    allowEarlyDeparture15_17: Boolean(raw.allowEarlyDeparture15_17),
    allowLateArrival8_930: Boolean(raw.allowLateArrival8_930),
    createdAt: dbEmp.created_at || dbEmp.hire_date || new Date().toISOString(),
  };
}
