import { AppUser, Employee } from '../../types';
import { mariaDbService } from '../mariaDbService';

export async function syncUserToEmployeeTable(
  cleanUser: AppUser, resolvedUser: AppUser, resolvedRoleId: number, oldEmail: string
): Promise<void> {
  try {
    const employees = await mariaDbService.fetchCollection<Employee>('employees');
    const employee = employees.find((emp: any) =>
      (cleanUser.employeeId && [emp.id, emp.docId, emp.doc_id, emp._dbId].some(x => String(x) === String(cleanUser.employeeId))) ||
      (resolvedUser.id && String(emp.userId) === String(resolvedUser.id)) ||
      (oldEmail && String(emp.email || '').toLowerCase() === oldEmail) ||
      String(emp.email || '').toLowerCase() === cleanUser.email.toLowerCase()
    ) as any;
    if (!employee) return;

    let employmentStatus = cleanUser.employmentStatus || employee.employmentStatus || 'en_poste';
    if (cleanUser.status === 'inactif' && ['en_poste','en_conge','en_permission'].includes(employmentStatus)) employmentStatus = 'suspendu';
    if (cleanUser.status === 'actif' && employmentStatus === 'suspendu') employmentStatus = 'en_poste';
    const active = cleanUser.status === 'actif' && !['renvoye','demissionne','suspendu','parti'].includes(employmentStatus);
    const roleType = cleanUser.role === 'administrateur' ? 'Super Administrateur' :
      cleanUser.role === 'responsable' ? 'Responsable' : employee.roleType || 'Employé';

    const updated: Employee = {
      ...employee,
      id: String(employee.id),
      userId: String(resolvedUser.id),
      roleId: resolvedRoleId,
      name: cleanUser.name,
      email: cleanUser.email,
      phone: cleanUser.phone || employee.phone || '',
      department: cleanUser.department || employee.department || 'Direction Générale',
      roleType, role: roleType, position: employee.position || roleType,
      status: active ? 'en_poste' : employmentStatus,
      employmentStatus,
      avatarUrl: cleanUser.avatarUrl || employee.avatarUrl || '',
      birthDate: cleanUser.birthDate ?? employee.birthDate,
      team: cleanUser.team ?? employee.team,
      teams: cleanUser.teams ?? employee.teams,
      managerId: cleanUser.managerId ?? employee.managerId,
      managerName: cleanUser.managerName ?? employee.managerName,
      allowEarlyDeparture15_17: cleanUser.allowEarlyDeparture15_17 ?? employee.allowEarlyDeparture15_17,
      allowLateArrival8_930: cleanUser.allowLateArrival8_930 ?? employee.allowLateArrival8_930,
    };
    await mariaDbService.saveDocument('employees', updated as any);
    if (!resolvedUser.employeeId) resolvedUser.employeeId = String(employee.docId || employee.id);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('citrine:employee_updated', { detail: updated }));
  } catch (error) {
    console.warn('[userService] Synchronisation employé via MariaDB :', error);
  }
}
