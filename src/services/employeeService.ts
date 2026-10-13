import { Employee, EmployeeStatus, AppUser } from '../types';
import { supabase } from '../lib/supabase';
import { supabaseService } from './supabaseService';
import { offlineService } from './offlineService';
import { saveUser } from './userService';

export const EMPLOYEES_COLLECTION = 'employees';

/**
 * Valide si une valeur est un UUID v4 standard
 */
export function isUuidV4(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val) ||
         /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

/**
 * Génère un UUID v4 garanti
 */
export function generateUuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Vérifie si un identifiant est un entier (clé primaire BIGSERIAL)
 */
export function isIntegerId(val: unknown): boolean {
  if (typeof val === 'number') return Number.isInteger(val) && val > 0;
  if (typeof val === 'string') return /^\d+$/.test(val);
  return false;
}

/**
 * Normalise le statut métier du collaborateur
 */
export function normalizeEmployeeStatus(status: unknown): EmployeeStatus {
  if (status === true || status === 'actif') return 'en_poste';
  if (status === false || status === 'inactif') return 'parti';
  const validStatuses: EmployeeStatus[] = ['en_poste', 'en_conge', 'parti', 'renvoye', 'suspendu', 'maladie'];
  if (typeof status === 'string' && validStatuses.includes(status as EmployeeStatus)) {
    return status as EmployeeStatus;
  }
  return 'en_poste';
}

/**
 * Détermine si le collaborateur est actif dans l'entreprise
 */
export function isEmployeeActive(emp?: Partial<Employee> | null): boolean {
  if (!emp) return false;
  if (emp.status === false) return false;
  const s = normalizeEmployeeStatus(emp.status || emp.employmentStatus);
  return s === 'en_poste' || s === 'en_conge';
}

/**
 * Formate le nom complet du collaborateur
 */
export function formatEmployeeFullName(emp: Partial<Employee>): string {
  if (emp.name && emp.name.trim().length > 0) return emp.name.trim();
  const full = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
  return full || 'Collaborateur';
}

/**
 * Récupère la liste des collaborateurs depuis Supabase (avec secours cache local)
 */
export async function getEmployees(): Promise<Employee[]> {
  try {
    const list = await supabaseService.fetchCollection<Employee>(EMPLOYEES_COLLECTION);
    if (list && list.length > 0) {
      try {
        localStorage.setItem('citrine_employees', JSON.stringify(list));
      } catch {}
      return list;
    }
  } catch (err) {
    console.warn('[employeeService] Impossible de récupérer les employés depuis Supabase:', err);
  }

  // Fallback cache local
  try {
    const cached = localStorage.getItem('citrine_employees');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  return [];
}

/**
 * Recherche un collaborateur par id (BIGINT), uid (UUID v4) ou email
 */
export function findEmployee(employees: Employee[], identifier?: string | number | null): Employee | undefined {
  if (!identifier) return undefined;
  const strId = String(identifier).trim().toLowerCase();

  return employees.find((e) => {
    if (String(e.id).toLowerCase() === strId) return true;
    if (e.uid && e.uid.toLowerCase() === strId) return true;
    if (e.email && e.email.trim().toLowerCase() === strId) return true;
    if (e.userId && String(e.userId).toLowerCase() === strId) return true;
    return false;
  });
}

/**
 * Recherche le collaborateur associé à un compte utilisateur connecté
 */
export function findEmployeeForUser(employees: Employee[], user?: AppUser | null): Employee | undefined {
  if (!user) return undefined;
  const userEmail = (user.email || '').trim().toLowerCase();
  const userId = String(user.id || '');
  const employeeId = user.employeeId ? String(user.employeeId) : undefined;

  return employees.find((emp) => {
    if (employeeId && (String(emp.id) === employeeId || emp.uid === employeeId)) return true;
    if (emp.userId && String(emp.userId) === userId) return true;
    if (userEmail && emp.email && emp.email.trim().toLowerCase() === userEmail) return true;
    return false;
  });
}

/**
 * Sauvegarde ou met à jour un collaborateur dans Supabase
 * - Conserve l'id BIGSERIAL auto-incrémenté si existant
 * - Conserve ou génère l'UUID v4 uid
 * - Supprime doc_id
 * - Respecte les contraintes CHECK (salary >= 0)
 */
export async function saveEmployee(employee: Employee): Promise<Employee> {
  const uid = employee.uid && isUuidV4(employee.uid) ? employee.uid : generateUuidV4();
  const employmentStatus = normalizeEmployeeStatus(employee.status || employee.employmentStatus);
  const isActive = employmentStatus === 'en_poste' || employmentStatus === 'en_conge';

  const cleanEmployee: Employee = {
    ...employee,
    uid,
    name: formatEmployeeFullName(employee),
    email: employee.email.trim().toLowerCase(),
    phone: employee.phone ? employee.phone.trim() : '',
    salary: Math.max(0, Number(employee.salary) || 0),
    status: employmentStatus,
    employmentStatus: employmentStatus,
  };

  // 1. Sauvegarde dans le service Supabase
  const saved = await supabaseService.saveDocument(EMPLOYEES_COLLECTION, cleanEmployee);

  // 2. Mettre à jour le cache local
  try {
    const cached = localStorage.getItem('citrine_employees');
    let list: Employee[] = cached ? JSON.parse(cached) : [];
    if (!Array.isArray(list)) list = [];

    const idx = list.findIndex((e) => e.id === saved.id || (e.uid && e.uid === saved.uid) || e.email === saved.email);
    if (idx >= 0) {
      list[idx] = saved;
    } else {
      list.unshift(saved);
    }
    localStorage.setItem('citrine_employees', JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('citrine:employee_updated', { detail: saved }));
  } catch (err) {
    console.warn('[employeeService] Erreur mise à jour cache local:', err);
  }

  return saved;
}

/**
 * Création complète d'un collaborateur avec compte utilisateur associé (Optionnel ou Automatique)
 */
export async function createCollaboratorWithAccount(params: {
  employeeData: Omit<Employee, 'id'> & { id?: string };
  userRole?: string;
  userPassword?: string;
  createAccount?: boolean;
}): Promise<{ employee: Employee; user?: AppUser }> {
  const { employeeData, userRole = 'employé', userPassword = 'Collab@2026', createAccount = true } = params;

  // 1. Génération de l'UUID v4
  const uid = employeeData.uid && isUuidV4(employeeData.uid) ? employeeData.uid : generateUuidV4();
  const employmentStatus = normalizeEmployeeStatus(employeeData.status || employeeData.employmentStatus);

  const newEmployee: Employee = {
    ...employeeData,
    id: employeeData.id || `emp-${Date.now()}`,
    uid,
    name: formatEmployeeFullName(employeeData),
    email: employeeData.email.trim().toLowerCase(),
    phone: employeeData.phone ? employeeData.phone.trim() : '',
    salary: Math.max(0, Number(employeeData.salary) || 0),
    status: employmentStatus,
    employmentStatus,
  };

  // 2. Enregistrer le collaborateur dans Supabase
  const savedEmployee = await saveEmployee(newEmployee);

  let createdUser: AppUser | undefined = undefined;

  // 3. Création automatique du compte utilisateur associé dans la table users
  if (createAccount) {
    try {
      const userEmail = savedEmployee.email;
      const userUid = generateUuidV4();
      const userAccount: AppUser = {
        id: `user-${Date.now()}`,
        name: savedEmployee.name,
        email: userEmail,
        role: (userRole.toLowerCase() as any) || 'employé',
        status: 'actif',
        department: savedEmployee.department || 'Opérations',
        phone: savedEmployee.phone,
        employeeId: String(savedEmployee.id),
        passwordHash: userPassword.trim() || 'Collab@2026',
        authMethod: 'password',
        createdAt: new Date().toISOString(),
      };

      await saveUser(userAccount);
      createdUser = userAccount;

      // Associer l'userId au collaborateur si possible
      if (userAccount.id) {
        savedEmployee.userId = userAccount.id;
        await saveEmployee(savedEmployee).catch(() => {});
      }
    } catch (err) {
      console.warn('[employeeService] Échec création compte utilisateur:', err);
    }
  }

  return { employee: savedEmployee, user: createdUser };
}

/**
 * Suppression d'un collaborateur
 */
export async function deleteEmployee(idOrUid: string | number): Promise<boolean> {
  try {
    const success = await supabaseService.deleteDocument(EMPLOYEES_COLLECTION, String(idOrUid));

    // Mettre à jour le cache local
    try {
      const cached = localStorage.getItem('citrine_employees');
      if (cached) {
        let list: Employee[] = JSON.parse(cached);
        if (Array.isArray(list)) {
          list = list.filter((e) => String(e.id) !== String(idOrUid) && e.uid !== String(idOrUid));
          localStorage.setItem('citrine_employees', JSON.stringify(list));
        }
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('citrine:employee_deleted', { detail: { id: idOrUid } }));
    return success;
  } catch (err) {
    console.error('[employeeService] Erreur lors de la suppression de l\'employé:', err);
    return false;
  }
}
