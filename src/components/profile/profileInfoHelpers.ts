import { AppUser, Employee } from '../../types';
import { getCollection, COLLECTIONS } from '../../services/dataService';
import { generateUuidV4 } from '../../services/employeeService';

export function calculateAge(dateStr?: string): string | null {
  if (!dateStr) return null;
  const birth = new Date(dateStr);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age > 0 ? `${age} ans` : null;
}

export async function fetchResolvedEmployeeDetails(currentUser: AppUser): Promise<{
  employeeData: Employee | null;
  birthDate?: string;
  department?: string;
  phone?: string;
  assignedTeams: string[];
  managerName: string;
}> {
  const empList: Employee[] = await getCollection(COLLECTIONS.EMPLOYEES);
  if (!Array.isArray(empList)) {
    return {
      employeeData: null,
      assignedTeams: currentUser.teams?.length ? currentUser.teams : currentUser.team ? [currentUser.team] : ['Équipe Principale'],
      managerName: currentUser.managerName || 'Direction Générale',
    };
  }

  const myEmp = empList.find(
    (e) =>
      (currentUser.employeeId && e.id === currentUser.employeeId) ||
      (currentUser.email && e.email && e.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      e.id === currentUser.id
  );

  if (!myEmp) {
    return {
      employeeData: null,
      assignedTeams: currentUser.teams?.length ? currentUser.teams : currentUser.team ? [currentUser.team] : ['Équipe Principale'],
      managerName: currentUser.managerName || 'Direction Générale',
    };
  }

  let assignedTeams: string[] = ['Équipe IT & Développement'];
  if (Array.isArray(myEmp.teams) && myEmp.teams.length > 0) assignedTeams = myEmp.teams;
  else if (myEmp.team) assignedTeams = myEmp.team.split(',').map((t) => t.trim()).filter(Boolean);
  else if (currentUser.teams && currentUser.teams.length > 0) assignedTeams = currentUser.teams;
  else if (currentUser.team) assignedTeams = currentUser.team.split(',').map((t) => t.trim()).filter(Boolean);

  let managerName = 'Direction Générale';
  if (myEmp.managerId) {
    const mgr = empList.find((m) => m.id === String(myEmp.managerId));
    managerName = mgr ? `${mgr.name} (${mgr.roleType || 'Responsable'})` : myEmp.managerName || 'Direction Générale';
  } else if (myEmp.managerName) {
    managerName = myEmp.managerName;
  } else if (currentUser.managerName) {
    managerName = currentUser.managerName;
  }

  return {
    employeeData: myEmp,
    birthDate: !currentUser.birthDate && myEmp.birthDate ? myEmp.birthDate : undefined,
    department: myEmp.department && !currentUser.department ? myEmp.department : undefined,
    phone: myEmp.phone && (!currentUser.phone || currentUser.phone === '+237 699 00 00 00') ? myEmp.phone : undefined,
    assignedTeams,
    managerName,
  };
}

export function buildEmployeeSyncPayload(params: {
  employeeData: Employee | null;
  currentUser: AppUser;
  name: string;
  department: string;
  phone: string;
  birthDate: string;
  avatarUrl: string;
  assignedTeams: string[];
  managerName: string;
}): Employee {
  const { employeeData, currentUser, name, department, phone, birthDate, avatarUrl, assignedTeams, managerName } = params;
  return {
    ...(employeeData || {}),
    id: employeeData?.id || currentUser.employeeId || currentUser.id || `emp-${Date.now()}`,
    uid: employeeData?.uid || generateUuidV4(),
    name: name.trim(),
    email: currentUser.email,
    roleType: employeeData?.roleType || currentUser.role || 'employé',
    department: department.trim(),
    phone: phone.trim(),
    birthDate: birthDate.trim() || undefined,
    avatarUrl: avatarUrl.trim(),
    team: assignedTeams.join(', '),
    teams: assignedTeams,
    managerId: employeeData?.managerId || currentUser.managerId || undefined,
    managerName,
    status: employeeData?.status || 'en_poste',
    employmentStatus: employeeData?.employmentStatus || 'en_poste',
    hireDate: employeeData?.hireDate || new Date().toISOString().split('T')[0],
  };
}
