import { randomBytes, randomUUID, pbkdf2Sync } from 'node:crypto';
import { withMariaDbTransaction } from '../mariadb';
import type { CreateCollaboratorTransactionInput } from './collaboratorTransactionHelpers';

export type { CreateCollaboratorTransactionInput };

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  return `pbkdf2:${salt.toString('hex')}:${derived.toString('hex')}`;
}

export async function executeCollaboratorCreationTransaction(input: CreateCollaboratorTransactionInput) {
  const email = String(input.email || '').trim().toLowerCase();
  const name = String(input.name || '').trim();
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Nom et adresse email valides requis.');
  }
  const initialPassword = String(input.userPassword || 'Collab@2026');
  if (initialPassword.length < 10) throw new Error('Le mot de passe initial doit contenir au moins 10 caractères.');

  const roleText = String(input.roleType || input.userRole || '').toLowerCase();
  const roleCode = roleText.includes('admin') ? 'ADMIN' : roleText.includes('responsable') ? 'MANAGER' : 'EMPLOYEE';
  const roleName = roleCode === 'ADMIN' ? 'Administrateur' : roleCode === 'MANAGER' ? 'Responsable' : 'Employé';
  const department = String(input.department || 'Direction Générale').trim();
  const empDocId = `emp-${randomUUID()}`;
  const userDocId = `user-${randomUUID()}`;
  const empUid = randomUUID();
  const userUid = randomUUID();
  const passwordHash = hashPassword(initialPassword);
  const now = new Date();

  return withMariaDbTransaction(async (connection) => {
    const [existingUsers] = await connection.execute<any[]>(
      'SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1', [email]
    );
    if (existingUsers[0]) throw new Error(`Un compte utilisateur avec l'adresse "${email}" existe déjà.`);
    const [existingEmployees] = await connection.execute<any[]>(
      'SELECT id FROM employees WHERE LOWER(email) = ? LIMIT 1', [email]
    );
    if (existingEmployees[0]) throw new Error(`Un collaborateur avec l'adresse "${email}" existe déjà.`);

    await connection.execute(
      `INSERT INTO roles (uid, name, code, description, permissions, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3))
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
      [randomUUID(), roleName, roleCode, `Rôle ${roleName}`, JSON.stringify([])]
    );
    const [roleRows] = await connection.execute<any[]>('SELECT id FROM roles WHERE code = ? LIMIT 1', [roleCode]);
    const roleId = Number(roleRows[0]?.id);
    if (!roleId) throw new Error(`Impossible de résoudre le rôle ${roleName}.`);

    const employeeRaw = {
      doc_id: empDocId, uid: empUid, team: input.team || null,
      teams: Array.isArray(input.teams) ? input.teams : null,
      managerId: input.managerId || null, birthDate: input.birthDate || null,
      avatarUrl: input.avatarUrl || null, departureReason: input.departureReason || null,
      suspensionReason: input.suspensionReason || null,
      allowEarlyDeparture15_17: Boolean(input.allowEarlyDeparture15_17),
      allowLateArrival8_930: Boolean(input.allowLateArrival8_930),
      employmentStatus: input.status || 'en_poste',
    };
    const photoUrl = input.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
    const [empResult] = await connection.execute<any>(
      `INSERT INTO employees
       (uid, doc_id, name, first_name, last_name, email, phone, department, position, role_type,
        status, hire_date, salary, photo_url, work_location, role_id, raw_data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 'Douala', ?, ?, NOW(3), NOW(3))`,
      [empUid, empDocId, name, input.firstName || null, input.lastName || null, email,
       input.phone || null, department, input.position || input.roleType || 'Employé',
       input.roleType || 'Employé', input.hireDate ? String(input.hireDate).slice(0,10) : null,
       Math.max(0, Number(input.salary) || 0), photoUrl, roleId, JSON.stringify(employeeRaw)]
    );
    const employeeDbId = Number(empResult.insertId);

    const userRaw = {
      doc_id: userDocId, uid: userUid, role: roleCode.toLowerCase(),
      roleId, employeeId: empDocId, employeeDbId, department,
      team: input.team || null, teams: Array.isArray(input.teams) ? input.teams : null,
      managerId: input.managerId || null, birthDate: input.birthDate || null,
      allowEarlyDeparture15_17: Boolean(input.allowEarlyDeparture15_17),
      allowLateArrival8_930: Boolean(input.allowLateArrival8_930),
      passwordHash, createdAt: now.toISOString(),
    };
    const [userResult] = await connection.execute<any>(
      `INSERT INTO users
       (uid, doc_id, email, name, role_id, status, department, phone, avatar_url, raw_data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, NOW(3), NOW(3))`,
      [userUid, userDocId, email, name, roleId, department, input.phone || null, photoUrl, JSON.stringify(userRaw)]
    );
    const userDbId = Number(userResult.insertId);

    await connection.execute(
      'UPDATE employees SET user_id = ?, updated_at = NOW(3) WHERE id = ?',
      [userDbId, employeeDbId]
    );

    const notifId = `notif-collab-${randomUUID()}`;
    const message = `Le collaborateur ${name} (${department}) a été créé et lié à son compte utilisateur (${email}).`;
    const notification = {
      id: notifId, doc_id: notifId, type: 'system',
      title: 'Nouveau collaborateur enregistré', message, content: message,
      recipient: 'Administrateurs & RH', targetUserId: userDbId,
      timestamp: now.toISOString(), read: false,
    };
    await connection.execute(
      `INSERT INTO notifications
       (uid, doc_id, title, message, type, target_user_id, is_read, raw_data, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'system', ?, 0, ?, NOW(3), NOW(3))`,
      [randomUUID(), notifId, notification.title, message, userDbId, JSON.stringify(notification)]
    );

    const employee = {
      ...employeeRaw, id: empDocId, doc_id: empDocId, uid: empUid, _dbId: employeeDbId,
      userId: String(userDbId), roleId, name, firstName: input.firstName, lastName: input.lastName,
      email, phone: input.phone, roleType: input.roleType || 'Employé',
      department, position: input.position || input.roleType || 'Employé',
      hireDate: input.hireDate, birthDate: input.birthDate, salary: Number(input.salary) || 0,
      status: 'en_poste', employmentStatus: 'en_poste', avatarUrl: photoUrl,
    };
    const user = {
      id: String(userDbId), doc_id: userDocId, uid: userUid, name, email,
      role: roleCode === 'ADMIN' ? 'administrateur' : roleCode === 'MANAGER' ? 'responsable' : 'employé',
      roleId, status: 'actif', department, phone: input.phone || '', employeeId: empDocId,
      avatarUrl: photoUrl, team: input.team, teams: input.teams, managerId: input.managerId,
      allowEarlyDeparture15_17: Boolean(input.allowEarlyDeparture15_17),
      allowLateArrival8_930: Boolean(input.allowLateArrival8_930), createdAt: now.toISOString(),
    };
    return { success: true, employee, user, notification };
  });
}
