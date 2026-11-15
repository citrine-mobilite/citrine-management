import { AppUser, Employee } from '../../types';
import { getUserClient } from './userMapperHelpers';

export async function syncUserToEmployeeTable(
  cleanUser: AppUser,
  resolvedUser: AppUser,
  resolvedRoleId: number,
  oldEmail: string
): Promise<void> {
  const client = getUserClient();
  const userEmail = cleanUser.email;

  try {
    const userEmployeeId = cleanUser.employeeId;
    let matchedEmp: any = null;

    if (userEmployeeId) {
      if (/^\d+$/.test(String(userEmployeeId))) {
        const { data } = await client.from('employees').select('*').eq('id', Number(userEmployeeId)).maybeSingle();
        matchedEmp = data;
      }
      if (!matchedEmp) {
        const { data } = await client.from('employees').select('*').eq('doc_id', String(userEmployeeId)).maybeSingle();
        matchedEmp = data;
      }
    }

    if (!matchedEmp && /^\d+$/.test(String(resolvedUser.id))) {
      const { data } = await client.from('employees').select('*').eq('user_id', Number(resolvedUser.id)).maybeSingle();
      matchedEmp = data;
    }

    if (!matchedEmp && oldEmail) {
      const { data } = await client.from('employees').select('*').ilike('email', oldEmail).maybeSingle();
      matchedEmp = data;
    }

    if (!matchedEmp && userEmail) {
      const { data } = await client.from('employees').select('*').ilike('email', userEmail).maybeSingle();
      matchedEmp = data;
    }

    if (!matchedEmp) return;

    const rawEmp = matchedEmp.raw_data && typeof matchedEmp.raw_data === 'object' ? matchedEmp.raw_data : {};

    let newEmploymentStatus = cleanUser.employmentStatus || matchedEmp.employment_status || rawEmp.employmentStatus || 'en_poste';
    if (cleanUser.status === 'inactif') {
      if (newEmploymentStatus === 'en_poste' || newEmploymentStatus === 'en_conge' || newEmploymentStatus === 'en_permission') {
        newEmploymentStatus = 'suspendu';
      }
    } else if (cleanUser.status === 'actif' && newEmploymentStatus === 'suspendu') {
      newEmploymentStatus = 'en_poste';
    }

    const isEmpActive =
      cleanUser.status === 'actif' &&
      newEmploymentStatus !== 'renvoye' &&
      newEmploymentStatus !== 'demissionne' &&
      newEmploymentStatus !== 'suspendu' &&
      newEmploymentStatus !== 'parti';

    const resolvedRoleType =
      cleanUser.role === 'administrateur'
        ? 'Super Administrateur'
        : cleanUser.role === 'responsable'
        ? 'Responsable'
        : matchedEmp.role_type || 'Employé';

    const resolvedEmpAllowEarly =
      cleanUser.allowEarlyDeparture15_17 !== undefined
        ? Boolean(cleanUser.allowEarlyDeparture15_17)
        : Boolean(rawEmp.allowEarlyDeparture15_17);
    const resolvedEmpAllowLate =
      cleanUser.allowLateArrival8_930 !== undefined
        ? Boolean(cleanUser.allowLateArrival8_930)
        : Boolean(rawEmp.allowLateArrival8_930);

    const updatedEmpRaw = {
      ...rawEmp,
      id: String(matchedEmp.id),
      doc_id: matchedEmp.doc_id || rawEmp.doc_id || `emp_${matchedEmp.id}`,
      uid: matchedEmp.uid,
      userId: resolvedUser.id,
      name: cleanUser.name,
      email: cleanUser.email,
      phone: cleanUser.phone || matchedEmp.phone || '',
      department: cleanUser.department || matchedEmp.department || 'Direction Générale',
      roleType: resolvedRoleType,
      roleId: resolvedRoleId,
      status: isEmpActive,
      employmentStatus: newEmploymentStatus,
      avatarUrl: cleanUser.avatarUrl || matchedEmp.photo_url || rawEmp.avatarUrl || '',
      salary: matchedEmp.salary || 0,
      hireDate: matchedEmp.hire_date || rawEmp.hireDate || new Date().toISOString().split('T')[0],
      birthDate: cleanUser.birthDate ?? rawEmp.birthDate ?? null,
      team: cleanUser.team ?? rawEmp.team ?? null,
      teams: cleanUser.teams ?? rawEmp.teams ?? null,
      managerId: cleanUser.managerId ?? rawEmp.managerId ?? null,
      managerName: cleanUser.managerName ?? rawEmp.managerName ?? null,
      allowEarlyDeparture15_17: resolvedEmpAllowEarly,
      allowLateArrival8_930: resolvedEmpAllowLate,
    };

    const updatedEmp: Employee = { ...updatedEmpRaw, id: String(matchedEmp.id) };

    await client.from('employees').update({
      name: cleanUser.name,
      email: cleanUser.email,
      phone: cleanUser.phone || matchedEmp.phone || null,
      department: cleanUser.department || matchedEmp.department || 'Direction Générale',
      role_type: resolvedRoleType,
      position: matchedEmp.position || resolvedRoleType,
      role_id: resolvedRoleId,
      user_id: /^\d+$/.test(String(resolvedUser.id)) ? Number(resolvedUser.id) : matchedEmp.user_id,
      status: isEmpActive,
      photo_url: cleanUser.avatarUrl || matchedEmp.photo_url || null,
      raw_data: updatedEmpRaw,
      updated_at: new Date().toISOString(),
    }).eq('id', matchedEmp.id);

    if (!resolvedUser.employeeId) {
      resolvedUser.employeeId = String(matchedEmp.id);
    }

    try {
      const cachedEmps = localStorage.getItem('citrine_employees');
      if (cachedEmps) {
        const eList: Employee[] = JSON.parse(cachedEmps);
        if (Array.isArray(eList)) {
          const eIdx = eList.findIndex(
            (e) =>
              String(e.id) === String(matchedEmp.id) ||
              (oldEmail && e.email?.toLowerCase() === oldEmail) ||
              e.email?.toLowerCase() === cleanUser.email
          );
          if (eIdx >= 0) eList[eIdx] = updatedEmp;
          else eList.push(updatedEmp);
          localStorage.setItem('citrine_employees', JSON.stringify(eList));
        }
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('citrine:employee_updated', { detail: updatedEmp }));
    console.log(`✅ [SYNC USER ➔ COLLABORATEUR] Employé "${cleanUser.name}" (${cleanUser.email}) synchronisé (départ 15-17h: ${resolvedEmpAllowEarly}).`);
  } catch (syncErr) {
    console.warn('[userService] Notice synchronisation collaborateur associé:', syncErr);
  }
}
