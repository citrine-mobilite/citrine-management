import { Employee, EmployeeStatus, AppUser } from '../../types';
import { supabaseAdmin } from '../../lib/supabase';
import { hashPassword } from '../../utils/cryptoUtils';
import { generateUuidV4, isIntegerId, isUuidV4 } from './employeeHelpers';

interface SyncUserParams {
  client: any;
  emp: Employee;
  prevEmp?: Employee;
  matchedEmpRow: any;
  savedEmpDbId: any;
  empName: string;
  userEmail: string;
  oldEmail: string;
  empDepartment: string;
  resolvedRoleId: number;
  resolvedRole: AppUser['role'];
  isActive: boolean;
  employmentStatus: EmployeeStatus;
  userPassword?: string;
}

export async function syncLinkedUserForEmployee({
  client,
  emp,
  prevEmp,
  matchedEmpRow,
  savedEmpDbId,
  empName,
  userEmail,
  oldEmail,
  empDepartment,
  resolvedRoleId,
  resolvedRole,
  isActive,
  employmentStatus,
  userPassword,
}: SyncUserParams): Promise<AppUser | undefined> {
  let matchedUserRow: any = null;
  const targetUserId = emp.userId || prevEmp?.userId || matchedEmpRow?.user_id;
  const candidateEmpId = String(emp.id || prevEmp?.id || savedEmpDbId || '');

  if (candidateEmpId) {
    const { data: usersList } = await client.from('users').select('*');
    if (usersList) {
      matchedUserRow = usersList.find((u: any) => {
        const uRaw = u.raw_data && typeof u.raw_data === 'object' ? u.raw_data : {};
        return String(uRaw.employeeId) === candidateEmpId || String(u.employee_id) === candidateEmpId;
      });
    }
  }

  if (!matchedUserRow && targetUserId && isIntegerId(targetUserId)) {
    const { data } = await client.from('users').select('*').eq('id', Number(targetUserId)).maybeSingle();
    matchedUserRow = data;
  }
  if (!matchedUserRow && targetUserId && typeof targetUserId === 'string' && isUuidV4(targetUserId)) {
    const { data } = await client.from('users').select('*').eq('uid', targetUserId).maybeSingle();
    matchedUserRow = data;
  }
  if (!matchedUserRow && oldEmail) {
    const { data } = await client.from('users').select('*').ilike('email', oldEmail).maybeSingle();
    matchedUserRow = data;
  }
  if (!matchedUserRow && userEmail) {
    const { data } = await client.from('users').select('*').ilike('email', userEmail).maybeSingle();
    matchedUserRow = data;
  }

  if (matchedUserRow) {
    const userRaw = matchedUserRow.raw_data && typeof matchedUserRow.raw_data === 'object' ? matchedUserRow.raw_data : {};
    let finalPasswordHash = userRaw.passwordHash || userRaw.password_hash || matchedUserRow.password_hash || '';

    if (userPassword && userPassword.trim()) {
      const cleanPass = userPassword.trim();
      finalPasswordHash = await hashPassword(cleanPass);
      if (supabaseAdmin && matchedUserRow.uid) {
        try {
          await supabaseAdmin.auth.admin.updateUserById(matchedUserRow.uid, { password: cleanPass });
        } catch (authErr) {
          console.warn('[employeeService] Notice update password Supabase Auth:', authErr);
        }
      }
    }

    const updatedUserRaw = {
      ...userRaw,
      name: empName,
      email: userEmail,
      phone: emp.phone || null,
      department: empDepartment,
      role: resolvedRole,
      roleId: resolvedRoleId,
      role_id: resolvedRoleId,
      status: isActive ? 'actif' : 'inactif',
      employmentStatus,
      employeeId: String(savedEmpDbId || emp.id),
      avatarUrl: emp.avatarUrl || null,
      birthDate: emp.birthDate ?? userRaw.birthDate ?? null,
      team: emp.team ?? userRaw.team ?? null,
      teams: Array.isArray(emp.teams) ? emp.teams : (userRaw.teams ?? null),
      managerId: emp.managerId ?? userRaw.managerId ?? null,
      managerName: emp.managerName ?? userRaw.managerName ?? null,
      allowEarlyDeparture15_17: Boolean(emp.allowEarlyDeparture15_17),
      allowLateArrival8_930: Boolean(emp.allowLateArrival8_930),
      passwordHash: finalPasswordHash,
      password_hash: finalPasswordHash,
    };

    await client.from('users').update({
      name: empName,
      email: userEmail,
      phone: emp.phone || null,
      department: empDepartment,
      role_id: resolvedRoleId,
      status: isActive,
      avatar_url: emp.avatarUrl || null,
      raw_data: updatedUserRaw,
      updated_at: new Date().toISOString(),
    }).eq('id', matchedUserRow.id);

    if (supabaseAdmin && userEmail && matchedUserRow.email && userEmail !== matchedUserRow.email && matchedUserRow.uid) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(matchedUserRow.uid, { email: userEmail });
      } catch (authErr) {
        console.warn('[employeeService] Notice mise à jour email Supabase Auth:', authErr);
      }
    }

    if (savedEmpDbId && matchedEmpRow?.user_id !== matchedUserRow.id) {
      await client.from('employees').update({ user_id: matchedUserRow.id, role_id: resolvedRoleId }).eq('id', savedEmpDbId);
    }

    return {
      id: String(matchedUserRow.id),
      uid: matchedUserRow.uid,
      doc_id: matchedUserRow.doc_id || `user_${matchedUserRow.id}`,
      name: empName,
      email: userEmail,
      phone: emp.phone || '',
      department: empDepartment,
      role: resolvedRole,
      roleId: resolvedRoleId,
      status: isActive ? 'actif' : 'inactif',
      employmentStatus,
      avatarUrl: emp.avatarUrl || '',
      employeeId: String(savedEmpDbId || emp.id),
      birthDate: emp.birthDate,
      team: emp.team,
      teams: Array.isArray(emp.teams) ? emp.teams : undefined,
      managerId: emp.managerId,
      managerName: emp.managerName,
      allowEarlyDeparture15_17: Boolean(emp.allowEarlyDeparture15_17),
      allowLateArrival8_930: Boolean(emp.allowLateArrival8_930),
      createdAt: matchedUserRow.created_at || new Date().toISOString(),
      passwordHash: finalPasswordHash,
    };
  }

  if (userEmail) {
    console.log(`✨ [AUTO-CRÉATION UTILISATEUR] Création automatique pour "${empName}" (${userEmail})`);
    const initialPassword = userPassword?.trim() || 'Collab@2026';
    const initialHash = await hashPassword(initialPassword);
    let authUid = generateUuidV4();

    if (supabaseAdmin) {
      try {
        const { data: authCreated } = await supabaseAdmin.auth.admin.createUser({
          email: userEmail,
          password: initialPassword,
          email_confirm: true,
        });
        if (authCreated?.user?.id) authUid = authCreated.user.id;
      } catch (authErr) {
        console.warn('[employeeService] Notice création Auth user:', authErr);
      }
    }

    const newUserData = {
      doc_id: `user-${Date.now()}`,
      uid: authUid,
      email: userEmail,
      name: empName,
      phone: emp.phone || null,
      department: empDepartment,
      role_id: resolvedRoleId,
      status: isActive,
      avatar_url: emp.avatarUrl || null,
      raw_data: {
        name: empName, email: userEmail, phone: emp.phone || null, department: empDepartment,
        role: resolvedRole, roleId: resolvedRoleId, role_id: resolvedRoleId,
        status: isActive ? 'actif' : 'inactif', employmentStatus,
        employeeId: String(savedEmpDbId || emp.id),
        birthDate: emp.birthDate || null, team: emp.team || null,
        teams: Array.isArray(emp.teams) ? emp.teams : null,
        managerId: emp.managerId || null, managerName: emp.managerName || null,
        allowEarlyDeparture15_17: Boolean(emp.allowEarlyDeparture15_17),
        allowLateArrival8_930: Boolean(emp.allowLateArrival8_930),
        passwordHash: initialHash, password_hash: initialHash,
        createdAt: new Date().toISOString(),
      },
    };

    const { data: insertedUser } = await client.from('users').insert(newUserData).select().single();
    if (insertedUser) {
      if (savedEmpDbId) {
        await client.from('employees').update({ user_id: insertedUser.id, role_id: resolvedRoleId }).eq('id', savedEmpDbId);
      }
      return {
        id: String(insertedUser.id),
        uid: insertedUser.uid,
        name: empName,
        email: userEmail,
        phone: emp.phone || '',
        department: empDepartment,
        role: resolvedRole,
        roleId: resolvedRoleId,
        status: isActive ? 'actif' : 'inactif',
        employmentStatus,
        avatarUrl: emp.avatarUrl || '',
        employeeId: String(savedEmpDbId || emp.id),
        birthDate: emp.birthDate,
        team: emp.team,
        teams: Array.isArray(emp.teams) ? emp.teams : undefined,
        managerId: emp.managerId,
        managerName: emp.managerName,
        allowEarlyDeparture15_17: Boolean(emp.allowEarlyDeparture15_17),
        allowLateArrival8_930: Boolean(emp.allowLateArrival8_930),
        createdAt: new Date().toISOString(),
        passwordHash: initialHash,
      };
    }
  }

  return undefined;
}
