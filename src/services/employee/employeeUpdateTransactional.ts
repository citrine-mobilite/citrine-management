import { Employee, AppUser } from '../../types';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import { offlineService } from '../offlineService';
import {
  EMPLOYEES_COLLECTION,
  generateUuidV4,
  isIntegerId,
  normalizeEmployeeStatus,
  isEmployeeActive,
  formatEmployeeFullName,
  UpdateCollaboratorWithUserInput,
  UpdateCollaboratorWithUserResult,
} from './employeeHelpers';
import { syncLinkedUserForEmployee } from './employeeUpdateUserSync';

export async function updateCollaboratorWithUserTransactional(
  input: UpdateCollaboratorWithUserInput
): Promise<UpdateCollaboratorWithUserResult> {
  const client = supabaseAdmin || supabase;
  const emp = input.employee;
  const prevEmp = input.previousEmployee;

  const empName = formatEmployeeFullName(emp);
  const userEmail = (emp.email || '').trim();
  const oldEmail = (prevEmp?.email || '').trim().toLowerCase();
  const empDepartment = emp.department?.trim() || 'Direction Générale';
  const rawStatus = emp.status || emp.employmentStatus;
  const employmentStatus = normalizeEmployeeStatus(rawStatus);
  const isActive = isEmployeeActive(emp);

  let resolvedRoleId = 3;
  if (emp.roleId !== undefined && emp.roleId !== null && emp.roleId !== '') {
    resolvedRoleId = Number(emp.roleId);
  } else if (input.userRole) {
    const rLower = input.userRole.toLowerCase();
    resolvedRoleId = rLower.includes('admin') ? 1 : rLower.includes('responsable') ? 2 : 3;
  } else {
    const rTypeLower = String(emp.roleType || emp.role || '').toLowerCase();
    resolvedRoleId = rTypeLower.includes('admin') ? 1 : rTypeLower.includes('responsable') ? 2 : 3;
  }
  const resolvedRole: AppUser['role'] = resolvedRoleId === 1 ? 'administrateur' : resolvedRoleId === 2 ? 'responsable' : 'employé';

  console.log(`🔄 [SYNC COLLABORATEUR ➔ UTILISATEUR] Modification de "${empName}" (${userEmail})`);

  let matchedEmpRow: any = null;
  const isNumEmpId = isIntegerId(emp.id) || (emp._dbId && isIntegerId(emp._dbId));

  if (isNumEmpId) {
    const empDbId = emp._dbId ? Number(emp._dbId) : Number(emp.id);
    const { data } = await client.from('employees').select('*').eq('id', empDbId).maybeSingle();
    matchedEmpRow = data;
  }
  if (!matchedEmpRow && emp.uid) {
    const { data } = await client.from('employees').select('*').eq('uid', emp.uid).maybeSingle();
    matchedEmpRow = data;
  }
  if (!matchedEmpRow && emp.doc_id) {
    const { data } = await client.from('employees').select('*').eq('doc_id', emp.doc_id).maybeSingle();
    matchedEmpRow = data;
  }
  if (!matchedEmpRow && oldEmail) {
    const { data } = await client.from('employees').select('*').ilike('email', oldEmail).maybeSingle();
    matchedEmpRow = data;
  }
  if (!matchedEmpRow && userEmail) {
    const { data } = await client.from('employees').select('*').ilike('email', userEmail).maybeSingle();
    matchedEmpRow = data;
  }

  const existingRaw = matchedEmpRow?.raw_data && typeof matchedEmpRow.raw_data === 'object' ? matchedEmpRow.raw_data : {};
  const updatedEmpRaw = {
    ...existingRaw,
    ...emp,
    name: empName,
    email: userEmail,
    department: empDepartment,
    roleType: emp.roleType || 'Employé',
    roleId: resolvedRoleId,
    status: isActive,
    employmentStatus,
    phone: emp.phone || null,
    avatarUrl: emp.avatarUrl || null,
    team: emp.team || null,
    teams: Array.isArray(emp.teams) ? emp.teams : null,
    managerId: emp.managerId || null,
    managerName: emp.managerName || null,
    hireDate: emp.hireDate || null,
    birthDate: emp.birthDate || null,
    allowEarlyDeparture15_17: Boolean(emp.allowEarlyDeparture15_17),
    allowLateArrival8_930: Boolean(emp.allowLateArrival8_930),
  };

  const empDbPayload: any = {
    name: empName,
    first_name: emp.firstName || null,
    last_name: emp.lastName || null,
    email: userEmail,
    phone: emp.phone || null,
    department: empDepartment,
    role_type: emp.roleType || 'Employé',
    position: emp.position || emp.roleType || 'Employé',
    status: isActive,
    salary: Math.max(0, Number(emp.salary) || 0),
    hire_date: emp.hireDate ? String(emp.hireDate).split('T')[0] : null,
    photo_url: emp.avatarUrl || null,
    role_id: resolvedRoleId,
    raw_data: updatedEmpRaw,
    updated_at: new Date().toISOString(),
  };

  let savedEmpDbId = matchedEmpRow?.id;
  if (savedEmpDbId) {
    await client.from('employees').update(empDbPayload).eq('id', savedEmpDbId);
  } else {
    const { data: insertedEmp } = await client.from('employees').insert({
      ...empDbPayload,
      doc_id: emp.id || `emp-${Date.now()}`,
      uid: emp.uid || generateUuidV4(),
    }).select().single();
    if (insertedEmp) savedEmpDbId = insertedEmp.id;
  }

  const finalUser = await syncLinkedUserForEmployee({
    client, emp, prevEmp, matchedEmpRow, savedEmpDbId,
    empName, userEmail, oldEmail, empDepartment,
    resolvedRoleId, resolvedRole, isActive, employmentStatus,
    userPassword: input.userPassword,
  });

  const finalEmployee: Employee = {
    ...emp,
    id: String(savedEmpDbId || emp.id),
    _dbId: savedEmpDbId,
    userId: finalUser?.id ? String(finalUser.id) : (matchedEmpRow?.user_id ? String(matchedEmpRow.user_id) : emp.userId),
    roleId: resolvedRoleId,
    name: empName,
    email: userEmail,
    department: empDepartment,
    roleType: emp.roleType || 'Employé',
    status: employmentStatus,
    employmentStatus,
    phone: emp.phone,
    avatarUrl: emp.avatarUrl,
  };

  try {
    await offlineService.cacheLocally(EMPLOYEES_COLLECTION, finalEmployee);
    if (finalUser) await offlineService.cacheLocally('users', finalUser);
  } catch {}

  window.dispatchEvent(new CustomEvent('citrine:employee_updated', { detail: finalEmployee }));
  if (finalUser) {
    window.dispatchEvent(new CustomEvent('citrine:user_updated', { detail: finalUser }));
  }

  console.log(`✅ [SYNCHRONISATION TERMINÉE AVEC SUCCÈS] Collaborateur "${empName}" et Utilisateur synchronisés.`);
  return { success: true, employee: finalEmployee, user: finalUser };
}
