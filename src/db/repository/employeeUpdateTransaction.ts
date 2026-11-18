import { randomBytes, randomUUID, pbkdf2Sync } from 'node:crypto';
import { withMariaDbTransaction } from '../mariadb';
import type { UpdateCollaboratorWithUserInput } from '../../services/employee/employeeHelpers';

function parseRaw(value: any): any {
  if (value && typeof value === 'object') return value;
  if (typeof value === 'string') { try { return JSON.parse(value); } catch {} }
  return {};
}
function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  return `pbkdf2:${salt.toString('hex')}:${hash.toString('hex')}`;
}
function activeStatus(value: any): boolean {
  const text = String(value || '').toLowerCase();
  return value !== false && !['inactif','parti','renvoye','demissionne','suspendu'].includes(text);
}
function roleDetails(employee: any, input: UpdateCollaboratorWithUserInput) {
  const value = String(input.userRole || employee.roleType || employee.role || '').toLowerCase();
  const id = Number(employee.roleId || 0) || (value.includes('admin') ? 1 : value.includes('responsable') ? 2 : 3);
  return { id, role: id === 1 ? 'administrateur' : id === 2 ? 'responsable' : 'employé' };
}

export async function executeCollaboratorUpdateTransaction(input: UpdateCollaboratorWithUserInput) {
  const emp = input.employee as any;
  const previous = input.previousEmployee as any;
  const name = String(emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`).trim();
  const email = String(emp.email || '').trim().toLowerCase();
  if (!name || !email) throw new Error('Nom et adresse email du collaborateur requis.');
  const department = String(emp.department || 'Direction Générale').trim();
  const { id: roleId, role } = roleDetails(emp, input);
  const employmentStatus = String(emp.employmentStatus || (typeof emp.status === 'string' ? emp.status : 'en_poste'));
  const isActive = activeStatus(employmentStatus) && emp.status !== false;
  const now = new Date();

  return withMariaDbTransaction(async connection => {
    const referenceRoles = [
      ['SUPER_ADMIN', 'Super Administrateur', 'Administrateur système et IT avec accès complet'],
      ['RESPONSABLE', 'Responsable d’Unité', 'Responsable de département et validation'],
      ['EMPLOYE', 'Collaborateur / Employé', 'Accès collaborateur'],
    ];
    for (const [code, label, description] of referenceRoles) {
      await connection.execute(
        `INSERT INTO roles (uid, name, code, description, permissions, raw_data, created_at, updated_at)
         VALUES (?, ?, ?, ?, JSON_OBJECT(), JSON_OBJECT('name', ?, 'code', ?), NOW(3), NOW(3))
         ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
        [randomUUID(), label, code, description, label, code]
      );
    }
    const roleCode = roleId === 1 ? 'SUPER_ADMIN' : roleId === 2 ? 'RESPONSABLE' : 'EMPLOYE';
    const [roleRows] = await connection.execute<any[]>('SELECT id FROM roles WHERE code = ? LIMIT 1', [roleCode]);
    const resolvedRoleId = Number(roleRows[0]?.id || roleId);

    let employeeRow: any = null;
    const employeeId = String(emp._dbId || emp.id || '').trim();
    if (/^\d+$/.test(employeeId)) {
      const [rows] = await connection.execute<any[]>('SELECT * FROM employees WHERE id = ? LIMIT 1', [Number(employeeId)]);
      employeeRow = rows[0];
    }
    if (!employeeRow && emp.uid) {
      const [rows] = await connection.execute<any[]>('SELECT * FROM employees WHERE uid = ? LIMIT 1', [emp.uid]);
      employeeRow = rows[0];
    }
    if (!employeeRow && (emp.docId || emp.doc_id)) {
      const [rows] = await connection.execute<any[]>('SELECT * FROM employees WHERE doc_id = ? LIMIT 1', [emp.docId || emp.doc_id]);
      employeeRow = rows[0];
    }
    const oldEmail = String(previous?.email || '').trim().toLowerCase();
    if (!employeeRow && oldEmail) {
      const [rows] = await connection.execute<any[]>('SELECT * FROM employees WHERE LOWER(email) = ? LIMIT 1', [oldEmail]);
      employeeRow = rows[0];
    }
    if (!employeeRow) {
      const [rows] = await connection.execute<any[]>('SELECT * FROM employees WHERE LOWER(email) = ? LIMIT 1', [email]);
      employeeRow = rows[0];
    }
    const [emailConflicts] = await connection.execute<any[]>(
      'SELECT id FROM employees WHERE LOWER(email) = ? AND id <> ? LIMIT 1', [email, Number(employeeRow?.id || 0)]
    );
    if (emailConflicts[0]) throw new Error('Cette adresse email est déjà utilisée par un autre collaborateur.');

    const employeeUid = employeeRow?.uid || emp.uid || randomUUID();
    const employeeDocId = employeeRow?.doc_id || emp.docId || emp.doc_id || (employeeId && !/^\d+$/.test(employeeId) ? employeeId : `emp-${randomUUID()}`);
    const employeeRaw = {
      ...parseRaw(employeeRow?.raw_data), ...emp,
      name, email, department, roleType: emp.roleType || emp.role || 'Employé',
      roleId: resolvedRoleId, status: isActive, employmentStatus,
      userId: employeeRow?.user_id || emp.userId || null,
      team: emp.team || null, teams: Array.isArray(emp.teams) ? emp.teams : null,
      managerId: emp.managerId || null, managerName: emp.managerName || null,
      birthDate: emp.birthDate || null,
      allowEarlyDeparture15_17: Boolean(emp.allowEarlyDeparture15_17),
      allowLateArrival8_930: Boolean(emp.allowLateArrival8_930),
      updatedAt: now.toISOString(),
    };
    const employeeFields = {
      name, first_name: emp.firstName || null, last_name: emp.lastName || null, email,
      phone: emp.phone || null, department, position: emp.position || emp.roleType || 'Employé',
      role_type: emp.roleType || emp.role || 'Employé', status: isActive ? 1 : 0,
      salary: Math.max(0, Number(emp.salary) || 0),
      hire_date: emp.hireDate ? String(emp.hireDate).slice(0,10) : null,
      photo_url: emp.avatarUrl || null, role_id: resolvedRoleId,
      raw_data: JSON.stringify(employeeRaw), updated_at: now,
    };
    let employeeDbId: number;
    if (employeeRow) {
      const keys = Object.keys(employeeFields);
      await connection.execute(`UPDATE employees SET ${keys.map(k => `\x60${k}\x60 = ?`).join(', ')} WHERE id = ?`,
        [...keys.map(k => (employeeFields as any)[k]), employeeRow.id]);
      employeeDbId = Number(employeeRow.id);
    } else {
      const keys = Object.keys(employeeFields);
      const [inserted] = await connection.execute<any>(
        `INSERT INTO employees (uid, doc_id, ${keys.map(k => `\x60${k}\x60`).join(', ')}, created_at)
         VALUES (?, ?, ${keys.map(() => '?').join(', ')}, NOW(3))`,
        [employeeUid, employeeDocId, ...keys.map(k => (employeeFields as any)[k])]
      );
      employeeDbId = Number(inserted.insertId);
    }

    let userRow: any = null;
    const linkedUserId = employeeRow?.user_id || emp.userId || previous?.userId;
    if (linkedUserId && /^\d+$/.test(String(linkedUserId))) {
      const [rows] = await connection.execute<any[]>('SELECT * FROM users WHERE id = ? LIMIT 1', [Number(linkedUserId)]);
      userRow = rows[0];
    }
    if (!userRow && oldEmail) {
      const [rows] = await connection.execute<any[]>('SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1', [oldEmail]);
      userRow = rows[0];
    }
    if (!userRow) {
      const [rows] = await connection.execute<any[]>('SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1', [email]);
      userRow = rows[0];
    }
    const [userConflicts] = await connection.execute<any[]>(
      'SELECT id FROM users WHERE LOWER(email) = ? AND id <> ? LIMIT 1', [email, Number(userRow?.id || 0)]
    );
    if (userConflicts[0]) throw new Error('Cette adresse email est déjà utilisée par un autre compte utilisateur.');

    const userUid = userRow?.uid || randomUUID();
    const userDocId = userRow?.doc_id || `user-${randomUUID()}`;
    const userRawOld = parseRaw(userRow?.raw_data);
    const passwordHash = input.userPassword
      ? hashPassword(String(input.userPassword))
      : (userRawOld.passwordHash || userRawOld.password_hash || hashPassword('Collab@2026'));
    const userRaw = {
      ...userRawOld, name, email, role, roleId: resolvedRoleId, role_id: resolvedRoleId,
      status: isActive ? 'actif' : 'inactif', employmentStatus,
      employeeId: employeeDocId, employeeDbId, department, phone: emp.phone || null,
      birthDate: emp.birthDate || null, team: emp.team || null, teams: emp.teams || null,
      managerId: emp.managerId || null, managerName: emp.managerName || null,
      allowEarlyDeparture15_17: Boolean(emp.allowEarlyDeparture15_17),
      allowLateArrival8_930: Boolean(emp.allowLateArrival8_930),
      passwordHash, updatedAt: now.toISOString(),
    };
    const userFields = {
      email, name, role_id: resolvedRoleId, status: isActive ? 1 : 0, department,
      phone: emp.phone || null, avatar_url: emp.avatarUrl || null,
      raw_data: JSON.stringify(userRaw), updated_at: now,
    };
    let userDbId: number;
    if (userRow) {
      const keys = Object.keys(userFields);
      await connection.execute(`UPDATE users SET ${keys.map(k => `\x60${k}\x60 = ?`).join(', ')} WHERE id = ?`,
        [...keys.map(k => (userFields as any)[k]), userRow.id]);
      userDbId = Number(userRow.id);
    } else {
      const keys = Object.keys(userFields);
      const [inserted] = await connection.execute<any>(
        `INSERT INTO users (uid, doc_id, ${keys.map(k => `\x60${k}\x60`).join(', ')}, created_at)
         VALUES (?, ?, ${keys.map(() => '?').join(', ')}, NOW(3))`,
        [userUid, userDocId, ...keys.map(k => (userFields as any)[k])]
      );
      userDbId = Number(inserted.insertId);
    }
    await connection.execute('UPDATE employees SET user_id = ?, role_id = ? WHERE id = ?', [userDbId, resolvedRoleId, employeeDbId]);

    const finalEmployee = {
      ...employeeRaw, id: String(employeeDbId), docId: employeeDocId, _dbId: employeeDbId,
      uid: employeeUid, userId: String(userDbId), roleId: resolvedRoleId,
      name, email, department, status: employmentStatus, employmentStatus,
    };
    const finalUser = {
      id: String(userDbId), docId: userDocId, uid: userUid, name, email, role,
      roleId: resolvedRoleId, status: isActive ? 'actif' : 'inactif',
      department, phone: emp.phone || '', employeeId: employeeDocId,
      avatarUrl: emp.avatarUrl || '', employmentStatus,
    };
    return { success: true, employee: finalEmployee, user: finalUser };
  });
}
