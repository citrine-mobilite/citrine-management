import { Employee, EmployeeStatus, AppUser, NotificationLog } from '../../types';
import { supabaseService } from '../supabaseService';

export const EMPLOYEES_COLLECTION = 'employees';

export function isUuidV4(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val) ||
         /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

export function generateUuidV4(): string {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  if (typeof cryptoApi?.getRandomValues === 'function') {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
    return [
      hex.slice(0, 4).join(''),
      hex.slice(4, 6).join(''),
      hex.slice(6, 8).join(''),
      hex.slice(8, 10).join(''),
      hex.slice(10, 16).join(''),
    ].join('-');
  }
  throw new Error('Impossible de générer un UUID sécurisé');
}

export function isIntegerId(val: unknown): boolean {
  if (typeof val === 'number') return Number.isInteger(val) && val > 0;
  if (typeof val === 'string') return /^\d+$/.test(val);
  return false;
}

export function normalizeEmployeeStatus(status: unknown): EmployeeStatus {
  if (status === true || status === 'actif') return 'en_poste';
  if (status === false || status === 'inactif') return 'parti';
  const validStatuses: EmployeeStatus[] = [
    'en_poste', 'en_conge', 'en_permission', 'en_mission', 'maladie', 'suspendu', 'demissionne', 'renvoye', 'parti',
  ];
  if (typeof status === 'string' && validStatuses.includes(status as EmployeeStatus)) {
    return status as EmployeeStatus;
  }
  return 'en_poste';
}

export function isEmployeeActive(emp?: Partial<Employee> | null): boolean {
  if (!emp) return false;
  if (emp.status === false) return false;
  const s = normalizeEmployeeStatus(emp.status || emp.employmentStatus);
  return s === 'en_poste' || s === 'en_conge' || s === 'en_permission' || s === 'en_mission' || s === 'maladie';
}

export function formatEmployeeFullName(emp: Partial<Employee>): string {
  if (emp.name && emp.name.trim().length > 0) return emp.name.trim();
  const full = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
  return full || 'Collaborateur';
}

export async function getEmployees(): Promise<Employee[]> {
  try {
    const list = await supabaseService.fetchCollection<Employee>(EMPLOYEES_COLLECTION);
    if (list && list.length > 0) {
      return list;
    }
  } catch (err) {
    console.warn('[employeeService] Impossible de récupérer les employés depuis Supabase:', err);
  }
  return [];
}

export function findEmployee(employees: Employee[], identifier?: string | number | null): Employee | undefined {
  if (!identifier) return undefined;
  const strId = String(identifier).trim().toLowerCase();

  return employees.find((e) => {
    if (e.id && String(e.id).trim().toLowerCase() === strId) return true;
    if (e.uid && String(e.uid).trim().toLowerCase() === strId) return true;
    if (e.userId && String(e.userId).trim().toLowerCase() === strId) return true;
    if (e.email && e.email.trim().toLowerCase() === strId) return true;
    if (e.name && e.name.trim().toLowerCase() === strId) return true;
    return false;
  });
}

export interface TransactionalCollaboratorInput {
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  roleType: string;
  userRole?: string;
  department?: string;
  position?: string;
  managerId?: string;
  team?: string;
  teams?: string[];
  hireDate?: string;
  birthDate?: string;
  salary?: number;
  status?: string;
  departureReason?: string;
  suspensionReason?: string;
  avatarUrl?: string;
  userPassword?: string;
  allowEarlyDeparture15_17?: boolean;
  allowLateArrival8_930?: boolean;
}

export interface TransactionalCollaboratorResult {
  success: boolean;
  employee: Employee;
  user: AppUser;
  notification: NotificationLog;
}

export interface UpdateCollaboratorWithUserInput {
  employee: Employee;
  previousEmployee?: Employee;
  userRole?: string;
  userPassword?: string;
}

export interface UpdateCollaboratorWithUserResult {
  success: boolean;
  employee: Employee;
  user?: AppUser;
}
