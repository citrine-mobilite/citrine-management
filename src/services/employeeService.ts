import { Employee, EmployeeStatus, AppUser } from '../types';
import { supabase, supabaseAdmin } from '../lib/supabase';
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
 * Génère un UUID version 4 conforme au format RFC 4122.
 *
 * Priorité :
 * 1. crypto.randomUUID()
 * 2. crypto.getRandomValues()
 * 3. Erreur explicite si aucune source cryptographique n'est disponible.
 */
export function generateUuidV4(): string {
  const cryptoApi = globalThis.crypto;

  // Méthode native, privilégiée.
  if (typeof cryptoApi?.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }

  // Solution de secours cryptographiquement sécurisée.
  if (typeof cryptoApi?.getRandomValues === 'function') {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));

    // Version 4 : les 4 bits de poids fort du 7e octet valent 0100.
    bytes[6] = (bytes[6] & 0x0f) | 0x40;

    // Variante RFC : les 2 bits de poids fort du 9e octet valent 10.
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, '0')
    );

    return [
      hex.slice(0, 4).join(''),
      hex.slice(4, 6).join(''),
      hex.slice(6, 8).join(''),
      hex.slice(8, 10).join(''),
      hex.slice(10, 16).join(''),
    ].join('-');
  }

  // Ne jamais revenir silencieusement à Math.random().
  throw new Error(
    'Impossible de générer un UUID sécurisé : ' +
    'crypto.randomUUID() et crypto.getRandomValues() sont indisponibles.'
  );
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
  const validStatuses: EmployeeStatus[] = [
    'en_poste',
    'en_conge',
    'en_permission',
    'maladie',
    'suspendu',
    'demissionne',
    'renvoye',
    'parti'
  ];
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
  return s === 'en_poste' || s === 'en_conge' || s === 'en_permission' || s === 'maladie';
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

  // 3. Synchronisation bidirectionnelle : Mise à jour du compte utilisateur associé dans la table 'users'
  try {
    const client = supabaseAdmin || supabase;
    const userEmail = cleanEmployee.email;
    const employeeUserId = cleanEmployee.userId ? String(cleanEmployee.userId) : null;
    
    // Rechercher l'utilisateur associé par email ou userId
    let userQuery = client.from('users').select('*');
    if (employeeUserId && /^\d+$/.test(employeeUserId)) {
      userQuery = userQuery.or(`email.ilike.${userEmail},id.eq.${employeeUserId}`);
    } else {
      userQuery = userQuery.ilike('email', userEmail);
    }
    const { data: matchedUser } = await userQuery.maybeSingle();

    if (matchedUser) {
      const isUserActive =
        isActive &&
        String(employmentStatus) !== 'renvoye' &&
        String(employmentStatus) !== 'demissionne' &&
        String(employmentStatus) !== 'parti' &&
        String(employmentStatus) !== 'suspendu';

      const existingRaw = matchedUser.raw_data && typeof matchedUser.raw_data === 'object' ? matchedUser.raw_data : {};
      const updatedUserPayload: AppUser = {
        id: String(matchedUser.id),
        uid: matchedUser.uid,
        name: cleanEmployee.name,
        email: cleanEmployee.email,
        phone: cleanEmployee.phone || matchedUser.phone || '',
        department: cleanEmployee.department || matchedUser.department || 'Direction Générale',
        role: matchedUser.role_id === 1 ? 'administrateur' : matchedUser.role_id === 2 ? 'responsable' : 'employé',
        status: isUserActive ? 'actif' : 'inactif',
        employmentStatus: employmentStatus,
        avatarUrl: cleanEmployee.avatarUrl || matchedUser.avatar_url || '',
        employeeId: String(saved.id),
        createdAt: matchedUser.created_at || existingRaw.createdAt || new Date().toISOString(),
        passwordHash: existingRaw.passwordHash || existingRaw.password_hash || '',
      };

      // Mettre à jour dans Supabase users
      await supabaseService.saveDocument('users', updatedUserPayload);

      // Mettre à jour dans le cache local users
      try {
        const cachedUsers = localStorage.getItem('citrine_users');
        if (cachedUsers) {
          let uList: AppUser[] = JSON.parse(cachedUsers);
          if (Array.isArray(uList)) {
            const uIdx = uList.findIndex(u => u.id === updatedUserPayload.id || u.email === updatedUserPayload.email);
            if (uIdx >= 0) uList[uIdx] = updatedUserPayload;
            else uList.push(updatedUserPayload);
            localStorage.setItem('citrine_users', JSON.stringify(uList));
            window.dispatchEvent(new CustomEvent('citrine:user_updated', { detail: updatedUserPayload }));
          }
        }
      } catch {}
    }
  } catch (syncErr) {
    console.warn('[employeeService] Notice synchronisation user associé:', syncErr);
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
      const initialPassword = userPassword.trim() || 'Collab@2026';
      const empDept = savedEmployee.department ? savedEmployee.department.trim() : 'Direction Générale';

      // 3.1 Création dans Supabase Auth
      try {
        if (supabaseAdmin) {
          await supabaseAdmin.auth.admin.createUser({
            email: userEmail,
            password: initialPassword,
            email_confirm: true,
          });
        }
      } catch (authErr) {
        console.warn('[employeeService] Notice Auth creation:', authErr);
      }

      // 3.2 Création dans la table users
      const userAccount: AppUser = {
        id: `user-${Date.now()}`,
        name: savedEmployee.name,
        email: userEmail,
        role: (userRole.toLowerCase() as any) || 'employé',
        status: 'actif',
        department: empDept,
        phone: savedEmployee.phone,
        employeeId: String(savedEmployee.id),
        passwordHash: initialPassword,
        authMethod: 'password',
        createdAt: new Date().toISOString(),
      };

      await saveUser(userAccount);
      createdUser = userAccount;

      // Associer l'userId au collaborateur si possible
      if (userAccount.id) {
        savedEmployee.userId = userAccount.id;
        savedEmployee.department = empDept;
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
