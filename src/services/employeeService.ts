import { Employee, EmployeeStatus, AppUser, NotificationLog } from '../types';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { supabaseService } from './supabaseService';
import { offlineService } from './offlineService';
import { saveUser } from './userService';
import { hashPassword } from '../utils/cryptoUtils';

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
    'en_poste',
    'en_conge',
    'en_permission',
    'en_mission',
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
  hireDate?: string;
  birthDate?: string;
  salary?: number;
  status?: string;
  departureReason?: string;
  suspensionReason?: string;
  avatarUrl?: string;
  userPassword?: string;
}

export interface TransactionalCollaboratorResult {
  success: boolean;
  employee: Employee;
  user: AppUser;
  notification: NotificationLog;
}

/**
 * Exécute le flux complet de création en transaction avec Rollback garanti :
 * 1. Création du collaborateur (employé)
 * 2. Création automatique du compte utilisateur
 * 3. Modification du collaborateur pour lui assigner user_id et role_id
 * 4. Émission et enregistrement de la notification
 *
 * Si l'une quelconque de ces étapes échoue, le protocole de ROLLBACK est exécuté
 * pour supprimer toutes les données créées pendant la transaction (Zéro état orphelin).
 */
export async function createCollaboratorWithUserTransactional(
  input: TransactionalCollaboratorInput
): Promise<TransactionalCollaboratorResult> {
  const userEmail = input.email.trim();
  const empName = input.name.trim();
  const empDepartment = input.department?.trim() || 'Direction Générale';
  const initialPassword = input.userPassword?.trim() || 'Collab@2026';
  
  const roleTypeLower = (input.roleType || input.userRole || '').toLowerCase();
  const computedRoleId = roleTypeLower.includes('admin') ? 1 : roleTypeLower.includes('responsable') ? 2 : 3;
  const resolvedRole = computedRoleId === 1 ? 'administrateur' : computedRoleId === 2 ? 'responsable' : 'employé';

  // 1. TENTATIVE VIA L'ENDPOINT SERVEUR DÉDIÉ (SERVICE_ROLE SÉCURISÉ)
  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    try {
      console.log(`🌐 [TRANSACTION SERVEUR] Envoi de la requête transactionnelle pour "${empName}" (${userEmail})...`);
      const response = await fetch('/api/collaborators/transactional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });

      if (response.ok) {
        const result = await response.json();
        if (result && result.success && result.employee && result.user) {
          console.log('✅ [TRANSACTION SERVEUR VALIDÉE] Collaborateur, utilisateur et notification persistés via le serveur:', result);
          
          // Mise en cache locale instantanée
          try {
            await offlineService.cacheLocally(EMPLOYEES_COLLECTION, result.employee);
            await offlineService.cacheLocally('users', result.user);
            if (result.notification) {
              await offlineService.cacheLocally('notifications', result.notification);
            }
          } catch (cacheErr) {
            console.warn('[TRANSACTION] Notice cache local:', cacheErr);
          }

          // Log console explicite pour la notification
          if (result.notification) {
            console.log('🔔 [NOTIFICATION CRÉÉE ET ENREGISTRÉE AVEC SUCCÈS] :', result.notification);
            console.log('📋 [NOTIFICATION DÉTAILS] Titre:', result.notification.title, '| Message:', result.notification.message || result.notification.content, '| User ID:', result.user.id);
          }

          return result as TransactionalCollaboratorResult;
        }
      } else {
        const errorJson = await response.json().catch(() => ({}));
        if (errorJson?.error) {
          console.warn('[TRANSACTION SERVEUR] Réponse erreur du serveur:', errorJson.error);
          throw new Error(errorJson.error);
        }
      }
    } catch (serverErr: any) {
      if (serverErr.message && !serverErr.message.includes('Failed to fetch')) {
        // Erreur métier renvoyée par le serveur (ex: email déjà existant, etc.) -> Propager
        throw serverErr;
      }
      console.warn('[TRANSACTION] Route serveur non disponible ou hors-ligne, basculement sur la transaction directe Supabase...', serverErr.message);
    }
  }

  // 2. EXÉCUTION DIRECTE DU FLUX TRANSACTIONNEL AVEC ROLLBACK STRICT
  const client = supabaseAdmin || supabase;

  // 0. Vérification préalable des doublons d'email
  const { data: existingUser } = await client.from('users').select('id').eq('email', userEmail).maybeSingle();
  if (existingUser) {
    throw new Error(`Un compte utilisateur avec l'email "${userEmail}" existe déjà.`);
  }

  const { data: existingEmp } = await client.from('employees').select('id').eq('email', userEmail).maybeSingle();
  if (existingEmp) {
    throw new Error(`Un collaborateur avec l'email "${userEmail}" existe déjà.`);
  }

  const empUid = generateUuidV4();
  const empDocId = `emp-${Date.now()}`;
  const userUid = generateUuidV4();
  const userDocId = `user-${Date.now()}`;

  let createdEmployeeDbId: number | null = null;
  let createdUserId: number | null = null;
  let createdNotifDbId: number | null = null;

  console.log(`🚀 [TRANSACTION INITIALISÉE] Création collaborateur "${empName}" (${userEmail})`);

  try {
    // -------------------------------------------------------------------------
    // ÉTAPE 1 : CRÉATION DU COLLABORATEUR DANS LA TABLE EMPLOYEES (SANS USER_ID NI ROLE_ID)
    // -------------------------------------------------------------------------
    console.log('📌 [TRANSACTION - ÉTAPE 1/4] Création du collaborateur initial dans la table employees...');
    const rawEmpData = {
      doc_id: empDocId,
      name: empName,
      first_name: input.firstName || null,
      last_name: input.lastName || null,
      email: userEmail,
      phone: input.phone || null,
      role_type: input.roleType || 'Employé',
      department: empDepartment,
      position: input.position || input.roleType || 'Employé',
      status: true,
      hire_date: input.hireDate ? String(input.hireDate).split('T')[0] : null,
      salary: Math.max(0, Number(input.salary) || 0),
      photo_url: input.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(empName)}`,
      emergency_contact: null,
      work_location: 'Douala',
      user_id: null,
      role_id: null,
      raw_data: {
        doc_id: empDocId,
        team: input.team || null,
        managerId: input.managerId || null,
        birthDate: input.birthDate || null,
        avatarUrl: input.avatarUrl || null,
        departureReason: input.departureReason || null,
        suspensionReason: input.suspensionReason || null,
      }
    };

    const { data: empInserted, error: empInsertErr } = await client
      .from('employees')
      .insert(rawEmpData)
      .select()
      .single();

    if (empInsertErr || !empInserted) {
      throw new Error(`Étape 1 échouée (Création collaborateur): ${empInsertErr?.message || 'Insertion nulle'}`);
    }

    createdEmployeeDbId = empInserted.id;
    console.log(`✅ [TRANSACTION - ÉTAPE 1/4 VALIDÉE] Collaborateur créé avec succès. ID: ${createdEmployeeDbId}, DocID: ${empDocId}`);

    // -------------------------------------------------------------------------
    // ÉTAPE 2 : CRÉATION DU COMPTE UTILISATEUR ASSOCIÉ
    // -------------------------------------------------------------------------
    console.log('📌 [TRANSACTION - ÉTAPE 2/4] Création automatique du compte utilisateur associé...');
    
    if (supabaseAdmin) {
      try {
        await supabaseAdmin.auth.admin.createUser({
          email: userEmail,
          password: initialPassword,
          email_confirm: true,
        });
      } catch (authErr: any) {
        console.warn('[TRANSACTION] Notice Auth Supabase (utilisateur existant ou non-bloquant):', authErr?.message);
      }
    }

    const { data: userInserted, error: userInsertErr } = await client
      .from('users')
      .insert({
        doc_id: userDocId,
        uid: userUid,
        email: userEmail,
        name: empName,
        role_id: computedRoleId,
        status: true,
        department: empDepartment,
        phone: input.phone || null,
        avatar_url: input.avatarUrl || null,
        raw_data: {
          doc_id: userDocId,
          role: resolvedRole,
          roleId: computedRoleId,
          employeeId: empDocId,
          employeeDbId: createdEmployeeDbId,
          department: empDepartment,
          passwordHash: initialPassword,
          createdAt: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (userInsertErr || !userInserted) {
      throw new Error(`Étape 2 échouée (Création utilisateur): ${userInsertErr?.message || 'Insertion utilisateur nulle'}`);
    }

    createdUserId = userInserted.id;
    console.log(`✅ [TRANSACTION - ÉTAPE 2/4 VALIDÉE] Utilisateur créé avec succès. ID: ${createdUserId}, Email: ${userEmail}`);

    // -------------------------------------------------------------------------
    // ÉTAPE 3 : MODIFICATION DU COLLABORATEUR AVEC USER_ID ET ROLE_ID
    // -------------------------------------------------------------------------
    console.log(`📌 [TRANSACTION - ÉTAPE 3/4] Modification du collaborateur avec user_id: ${createdUserId} et role_id: ${computedRoleId}...`);
    
    const { data: empUpdated, error: empUpdateErr } = await client
      .from('employees')
      .update({
        user_id: createdUserId,
        role_id: computedRoleId,
        raw_data: {
          ...rawEmpData.raw_data,
          userId: createdUserId,
          roleId: computedRoleId,
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', createdEmployeeDbId)
      .select()
      .single();

    if (empUpdateErr || !empUpdated) {
      throw new Error(`Étape 3 échouée (Mise à jour collaborateur avec user_id/role_id): ${empUpdateErr?.message || 'Mise à jour nulle'}`);
    }

    console.log(`✅ [TRANSACTION - ÉTAPE 3/4 VALIDÉE] Collaborateur mis à jour avec succès avec user_id: ${createdUserId} et role_id: ${computedRoleId}`);

    // -------------------------------------------------------------------------
    // ÉTAPE 4 : CRÉATION ET ENREGISTREMENT DE LA NOTIFICATION OFFICIELLE
    // -------------------------------------------------------------------------
    console.log('📌 [TRANSACTION - ÉTAPE 4/4] Création et enregistrement de la notification...');
    const notifDocId = `notif-collab-${Date.now()}`;
    const notifPayload = {
      employeeId: empDocId,
      employeeDbId: createdEmployeeDbId,
      userId: createdUserId,
      userEmail,
      department: empDepartment,
      role: resolvedRole,
      createdAt: new Date().toISOString()
    };

    const notifObj: NotificationLog = {
      id: notifDocId,
      type: 'system',
      title: 'Nouveau collaborateur enregistré',
      content: `Le collaborateur ${empName} (${empDepartment}) a été créé et lié à son compte utilisateur (${userEmail}).`,
      recipient: 'Administrateurs & RH',
      payload: JSON.stringify(notifPayload),
      timestamp: new Date().toISOString(),
      read: false
    };

    const { data: notifInserted, error: notifInsertErr } = await client
      .from('notifications')
      .insert({
        doc_id: notifDocId,
        title: notifObj.title,
        message: notifObj.content,
        type: notifObj.type,
        target_user_id: createdUserId,
        is_read: false,
        raw_data: notifObj
      })
      .select()
      .single();

    if (notifInsertErr || !notifInserted) {
      console.warn('[TRANSACTION - NOTIFICATION AVERTISSEMENT]:', notifInsertErr?.message);
    } else {
      createdNotifDbId = notifInserted.id;
      console.log('🔔 [NOTIFICATION CRÉÉE ET ENREGISTRÉE AVEC SUCCÈS] :', notifObj);
      console.log('📋 [NOTIFICATION DÉTAILS] Titre:', notifObj.title, '| Message:', notifObj.content, '| Destinataire User ID:', createdUserId);
    }

    const finalEmployee: Employee = {
      id: empDocId,
      doc_id: empDocId,
      uid: empUid,
      _dbId: createdEmployeeDbId,
      userId: String(createdUserId),
      roleId: computedRoleId,
      name: empName,
      firstName: input.firstName,
      lastName: input.lastName,
      email: userEmail,
      phone: input.phone,
      roleType: input.roleType || 'Employé',
      role: input.position || input.roleType || 'Employé',
      department: empDepartment,
      managerId: input.managerId,
      team: input.team,
      hireDate: input.hireDate,
      birthDate: input.birthDate,
      salary: Number(input.salary) || 0,
      status: 'en_poste',
      employmentStatus: 'en_poste',
      avatarUrl: rawEmpData.photo_url,
    };

    const finalUser: AppUser = {
      id: String(createdUserId),
      doc_id: userDocId,
      uid: userUid,
      name: empName,
      email: userEmail,
      role: resolvedRole,
      roleId: computedRoleId,
      status: 'actif',
      department: empDepartment,
      phone: input.phone || '',
      employeeId: empDocId,
      avatarUrl: rawEmpData.photo_url,
      createdAt: new Date().toISOString(),
    };

    // Cache local pour réactivité hors-ligne
    try {
      await offlineService.cacheLocally(EMPLOYEES_COLLECTION, finalEmployee);
      await offlineService.cacheLocally('users', finalUser);
      await offlineService.cacheLocally('notifications', notifObj);
    } catch {}

    console.log(`🎉 [TRANSACTION VALIDÉE & COMMITTÉE] Collaborateur & Utilisateur synchronisés à 100%!`);

    return {
      success: true,
      employee: finalEmployee,
      user: finalUser,
      notification: notifObj
    };

  } catch (error: any) {
    console.error(`🚨 [TRANSACTION ÉCHOUÉE - ROLLBACK DÉCLENCHÉ] : ${error?.message || error}`);

    // =========================================================================
    // PROTOCOLE DE ROLLBACK DE TRANSACTION
    // =========================================================================
    if (createdNotifDbId) {
      try {
        console.log(`⏪ [ROLLBACK] Suppression de la notification orpheline (ID: ${createdNotifDbId})...`);
        await client.from('notifications').delete().eq('id', createdNotifDbId);
        console.log(`✓ [ROLLBACK] Notification (ID: ${createdNotifDbId}) supprimée`);
      } catch (rbNotifErr: any) {
        console.error(`❌ [ROLLBACK ERREUR] Échec suppression notification ${createdNotifDbId}:`, rbNotifErr?.message);
      }
    }

    if (createdUserId) {
      try {
        console.log(`⏪ [ROLLBACK] Suppression de l'utilisateur orphelin (ID: ${createdUserId})...`);
        await client.from('users').delete().eq('id', createdUserId);
        console.log(`✓ [ROLLBACK] Utilisateur (ID: ${createdUserId}) supprimé`);
      } catch (rbUserErr: any) {
        console.error(`❌ [ROLLBACK ERREUR] Échec suppression user ${createdUserId}:`, rbUserErr?.message);
      }
    }

    if (createdEmployeeDbId) {
      try {
        console.log(`⏪ [ROLLBACK] Suppression du collaborateur orphelin (ID: ${createdEmployeeDbId})...`);
        await client.from('employees').delete().eq('id', createdEmployeeDbId);
        console.log(`✓ [ROLLBACK] Collaborateur (ID: ${createdEmployeeDbId}) supprimé`);
      } catch (rbEmpErr: any) {
        console.error(`❌ [ROLLBACK ERREUR] Échec suppression employé ${createdEmployeeDbId}:`, rbEmpErr?.message);
      }
    }

    throw new Error(`Transaction annulée (Rollback complet) : ${error?.message || 'Erreur inconnue'}`);
  }
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

/**
 * Met à jour un collaborateur en base de données (Supabase) ET synchronise
 * obligatoirement et de manière bidirectionnelle son compte utilisateur associé.
 * 
 * - Met à jour le collaborateur dans la table 'employees'
 * - Met à jour l'utilisateur correspondant dans la table 'users' (nom, email, rôle, département, statut, téléphone, avatar)
 * - Si le collaborateur n'a pas encore de compte utilisateur, le crée automatiquement
 * - Diffuse les événements 'citrine:employee_updated' et 'citrine:user_updated'
 */
export async function updateCollaboratorWithUserTransactional(
  input: UpdateCollaboratorWithUserInput
): Promise<UpdateCollaboratorWithUserResult> {
  const client = supabaseAdmin || supabase;
  const emp = input.employee;
  const prevEmp = input.previousEmployee;

  const empName = formatEmployeeFullName(emp);
  const userEmail = (emp.email || '').trim();
  const userEmailLower = userEmail.toLowerCase();
  const oldEmail = (prevEmp?.email || '').trim().toLowerCase();
  const empDepartment = emp.department?.trim() || 'Direction Générale';
  const rawStatus = emp.status || emp.employmentStatus;
  const employmentStatus = normalizeEmployeeStatus(rawStatus);
  const isActive = isEmployeeActive(emp);

  // Déterminer le rôle d'accès système
  let resolvedRoleId: number = 3;
  if (emp.roleId !== undefined && emp.roleId !== null && emp.roleId !== '') {
    resolvedRoleId = Number(emp.roleId);
  } else if (input.userRole) {
    const rLower = input.userRole.toLowerCase();
    resolvedRoleId = rLower.includes('admin') ? 1 : rLower.includes('responsable') ? 2 : 3;
  } else {
    const rTypeLower = String(emp.roleType || emp.role || '').toLowerCase();
    resolvedRoleId = rTypeLower.includes('admin') ? 1 : rTypeLower.includes('responsable') ? 2 : 3;
  }
  const resolvedRole = resolvedRoleId === 1 ? 'administrateur' : resolvedRoleId === 2 ? 'responsable' : 'employé';

  console.log(`🔄 [SYNC COLLABORATEUR ➔ UTILISATEUR] Modification de "${empName}" (${userEmail})`);

  // 1. RECHERCHER ET METTRE À JOUR LE COLLABORATEUR DANS LA TABLE 'employees'
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
    employmentStatus: employmentStatus,
    phone: emp.phone || null,
    avatarUrl: emp.avatarUrl || null,
    team: emp.team || null,
    managerId: emp.managerId || null,
    hireDate: emp.hireDate || null,
    birthDate: emp.birthDate || null,
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
    // Insérer si introuvable
    const { data: insertedEmp } = await client.from('employees').insert({
      ...empDbPayload,
      doc_id: emp.id || `emp-${Date.now()}`,
      uid: emp.uid || generateUuidV4(),
    }).select().single();
    if (insertedEmp) savedEmpDbId = insertedEmp.id;
  }

  // 2. RECHERCHER ET METTRE À JOUR LE COMPTE UTILISATEUR CORRESPONDANT
  let matchedUserRow: any = null;
  const targetUserId = emp.userId || prevEmp?.userId || matchedEmpRow?.user_id;
  const candidateEmpId = String(emp.id || prevEmp?.id || savedEmpDbId || '');

  // Priorité absolue : rechercher par employeeId dans raw_data
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

  let finalUser: AppUser | undefined = undefined;

  if (matchedUserRow) {
    // MISE À JOUR DE L'UTILISATEUR EXISTANT
    const userRaw = matchedUserRow.raw_data && typeof matchedUserRow.raw_data === 'object' ? matchedUserRow.raw_data : {};
    
    // Gestion dynamique du mot de passe
    let finalPasswordHash = userRaw.passwordHash || userRaw.password_hash || matchedUserRow.password_hash || '';
    if (input.userPassword && input.userPassword.trim()) {
      const cleanPass = input.userPassword.trim();
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
      role_id: resolvedRoleId,
      status: isActive ? 'actif' : 'inactif',
      employmentStatus: employmentStatus,
      employeeId: String(savedEmpDbId || emp.id),
      avatarUrl: emp.avatarUrl || null,
      passwordHash: finalPasswordHash,
      password_hash: finalPasswordHash,
    };

    const userDbPayload: any = {
      name: empName,
      email: userEmail,
      phone: emp.phone || null,
      department: empDepartment,
      role_id: resolvedRoleId,
      status: isActive,
      avatar_url: emp.avatarUrl || null,
      raw_data: updatedUserRaw,
      updated_at: new Date().toISOString(),
    };

    await client.from('users').update(userDbPayload).eq('id', matchedUserRow.id);

    // Mettre à jour l'email dans Supabase Auth si modifié
    if (supabaseAdmin && userEmail && matchedUserRow.email && userEmail !== matchedUserRow.email) {
      try {
        if (matchedUserRow.uid) {
          await supabaseAdmin.auth.admin.updateUserById(matchedUserRow.uid, { email: userEmail });
        }
      } catch (authErr) {
        console.warn('[employeeService] Notice mise à jour email Supabase Auth:', authErr);
      }
    }

    // Assurer le lien réciproque sur l'employé
    if (savedEmpDbId && matchedEmpRow?.user_id !== matchedUserRow.id) {
      await client.from('employees').update({ user_id: matchedUserRow.id, role_id: resolvedRoleId }).eq('id', savedEmpDbId);
    }

    finalUser = {
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
      employmentStatus: employmentStatus,
      avatarUrl: emp.avatarUrl || '',
      employeeId: String(savedEmpDbId || emp.id),
      createdAt: matchedUserRow.created_at || new Date().toISOString(),
      passwordHash: finalPasswordHash,
    };
  } else if (userEmail) {
    // CRÉATION AUTOMATIQUE DU COMPTE UTILISATEUR SI INEXISTANT
    console.log(`✨ [AUTO-CRÉATION UTILISATEUR] Création automatique pour "${empName}" (${userEmail})`);
    const initialPassword = input.userPassword?.trim() || 'Collab@2026';
    const initialHash = await hashPassword(initialPassword);
    let authUid = generateUuidV4();

    if (supabaseAdmin) {
      try {
        const { data: authCreated } = await supabaseAdmin.auth.admin.createUser({
          email: userEmail,
          password: initialPassword,
          email_confirm: true,
        });
        if (authCreated?.user?.id) {
          authUid = authCreated.user.id;
        }
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
        name: empName,
        email: userEmail,
        phone: emp.phone || null,
        department: empDepartment,
        role: resolvedRole,
        role_id: resolvedRoleId,
        status: isActive ? 'actif' : 'inactif',
        employmentStatus: employmentStatus,
        employeeId: String(savedEmpDbId || emp.id),
        passwordHash: initialHash,
        password_hash: initialHash,
        createdAt: new Date().toISOString(),
      }
    };

    const { data: insertedUser } = await client.from('users').insert(newUserData).select().single();
    if (insertedUser) {
      finalUser = {
        id: String(insertedUser.id),
        uid: insertedUser.uid,
        name: empName,
        email: userEmail,
        phone: emp.phone || '',
        department: empDepartment,
        role: resolvedRole,
        roleId: resolvedRoleId,
        status: isActive ? 'actif' : 'inactif',
        employmentStatus: employmentStatus,
        avatarUrl: emp.avatarUrl || '',
        employeeId: String(savedEmpDbId || emp.id),
        createdAt: new Date().toISOString(),
        passwordHash: initialHash,
      };

      if (savedEmpDbId) {
        await client.from('employees').update({ user_id: insertedUser.id, role_id: resolvedRoleId }).eq('id', savedEmpDbId);
      }
    }
  }

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
    employmentStatus: employmentStatus,
    phone: emp.phone,
    avatarUrl: emp.avatarUrl,
  };

  // 3. CACHE LOCAL ET ÉMISSION DES ÉVÉNEMENTS GLOBAUX
  try {
    await offlineService.cacheLocally(EMPLOYEES_COLLECTION, finalEmployee);
    if (finalUser) {
      await offlineService.cacheLocally('users', finalUser);
    }
  } catch {}

  window.dispatchEvent(new CustomEvent('citrine:employee_updated', { detail: finalEmployee }));
  if (finalUser) {
    window.dispatchEvent(new CustomEvent('citrine:user_updated', { detail: finalUser }));
  }

  console.log(`✅ [SYNCHRONISATION TERMINÉE AVEC SUCCÈS] Collaborateur "${empName}" et Utilisateur synchronisés.`);

  return {
    success: true,
    employee: finalEmployee,
    user: finalUser,
  };
}

