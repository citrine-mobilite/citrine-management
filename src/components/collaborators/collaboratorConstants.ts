import { AppUser, Employee, EmployeeStatus, UserRole } from '../../types';

export type CollaboratorViewMode = 'list' | 'detail';
export type CollaboratorDetailTab =
  | 'statistics'
  | 'payslips'
  | 'presences'
  | 'map'
  | 'alerts'
  | 'tasks'
  | 'missions';

export const COLLABORATOR_STATUS_MAP = {
  en_poste: { label: 'En poste', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  en_conge: { label: 'En congés', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  en_permission: { label: 'Permission', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  en_mission: { label: 'En mission', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  maladie: { label: 'Maladie', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  suspendu: { label: 'Suspendu', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  parti: { label: 'Départ', color: 'bg-stone-100 text-stone-700 border-stone-300' },
  renvoye: { label: 'Renvoyé', color: 'bg-red-50 text-red-700 border-red-200' },
};

export const AVAILABLE_TEAMS = [
  'Équipe IT & Développement',
  'Équipe Commerciale & Partenariats',
  'Équipe RH, Paie & Administration',
  'Équipe Finance & Comptabilité',
  'Équipe Support & Opérations',
  'Équipe Direction Générale',
  'Équipe Logistique & Terrain',
  'Sécurité & HSE',
];

export interface CollaboratorFormData {
  name: string;
  email: string;
  phone: string;
  roleType: Employee['roleType'];
  department: string;
  managerId: string;
  team: string;
  teams: string[];
  hireDate: string;
  birthDate: string;
  salary: number;
  status: EmployeeStatus;
  departureReason: string;
  suspensionReason: string;
  avatarUrl: string;
  userId: string;
  roleId: number | string;
  createUserAccount: boolean;
  userPassword: string;
  userRole: UserRole;
  allowEarlyDeparture15_17: boolean;
  allowLateArrival8_930: boolean;
}

export function getEmployeeStatusKey(emp: Employee): keyof typeof COLLABORATOR_STATUS_MAP {
  const s =
    emp.employmentStatus ||
    (typeof emp.status === 'string' ? emp.status : emp.status ? 'en_poste' : 'parti');
  if (s && s in COLLABORATOR_STATUS_MAP) {
    return s as keyof typeof COLLABORATOR_STATUS_MAP;
  }
  return 'en_poste';
}

export function formatCollaboratorXAF(val: number = 0): string {
  return `${val.toLocaleString('fr-FR')} XAF`;
}

export function createEmptyCollaboratorFormData(): CollaboratorFormData {
  return {
    name: '',
    email: '',
    phone: '',
    roleType: 'employé',
    department: 'Informatique & IT',
    managerId: '',
    team: 'Équipe IT & Développement',
    teams: ['Équipe IT & Développement'],
    hireDate: new Date().toISOString().split('T')[0],
    birthDate: '',
    salary: 200000,
    status: 'en_poste',
    departureReason: '',
    suspensionReason: '',
    avatarUrl: '',
    userId: '',
    roleId: 3,
    createUserAccount: true,
    userPassword: '',
    userRole: 'employé',
    allowEarlyDeparture15_17: false,
    allowLateArrival8_930: false,
  };
}

export function buildEditCollaboratorFormData(
  emp: Employee,
  users: AppUser[] = []
): CollaboratorFormData {
  const linkedUser = users.find(
    (u) =>
      (emp.userId && (u.id === String(emp.userId) || u.uid === String(emp.userId))) ||
      (u.employeeId && u.employeeId === emp.id) ||
      (emp.email && u.email && u.email.toLowerCase() === emp.email.toLowerCase())
  );

  let resolvedRoleId = 3;
  if (emp.roleId !== undefined && emp.roleId !== null && emp.roleId !== '') {
    resolvedRoleId = Number(emp.roleId);
  } else if (linkedUser?.roleId) {
    resolvedRoleId = Number(linkedUser.roleId);
  } else {
    const rLower = String(emp.roleType || '').toLowerCase();
    if (rLower.includes('admin') || rLower.includes('directeur')) {
      resolvedRoleId = 1;
    } else if (rLower.includes('responsable') || rLower.includes('manager')) {
      resolvedRoleId = 2;
    }
  }

  const resolvedUserRole: UserRole =
    resolvedRoleId === 1
      ? 'administrateur'
      : resolvedRoleId === 2
      ? 'responsable'
      : 'employé';

  const resolvedTeams: string[] =
    Array.isArray(emp.teams) && emp.teams.length > 0
      ? emp.teams
      : emp.team
      ? emp.team
          .split(',')
          .map((t: string) => t.trim())
          .filter(Boolean)
      : ['Équipe IT & Développement'];

  return {
    name: emp.name || '',
    email: emp.email || '',
    phone: emp.phone || '',
    roleType: emp.roleType || 'employé',
    department: emp.department || 'Informatique & IT',
    managerId: String(emp.managerId || ''),
    team: resolvedTeams.join(', ') || emp.team || 'Équipe IT & Développement',
    teams: resolvedTeams,
    hireDate: emp.hireDate || new Date().toISOString().split('T')[0],
    birthDate: emp.birthDate || linkedUser?.birthDate || '',
    salary: emp.salary || 200000,
    status: (emp.employmentStatus ||
      (typeof emp.status === 'string' ? emp.status : 'en_poste')) as EmployeeStatus,
    departureReason: emp.departureReason || '',
    suspensionReason: emp.suspensionReason || '',
    avatarUrl: emp.avatarUrl || '',
    userId: emp.userId ? String(emp.userId) : linkedUser ? linkedUser.id : '',
    roleId: resolvedRoleId,
    createUserAccount: !linkedUser,
    userPassword: '',
    userRole: resolvedUserRole,
    allowEarlyDeparture15_17: Boolean(
      emp.allowEarlyDeparture15_17 || linkedUser?.allowEarlyDeparture15_17
    ),
    allowLateArrival8_930: Boolean(emp.allowLateArrival8_930 || linkedUser?.allowLateArrival8_930),
  };
}
