import { AppUser, Employee, EmployeeStatus } from '../types';
import { hashPassword } from '../utils/cryptoUtils';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { supabaseService } from './supabaseService';
import { cloudSqlService } from './cloudSqlService';

export const USERS_COLLECTION = 'users';

export const INITIAL_DEFAULT_USERS: AppUser[] = [];

const getClient = () => supabaseAdmin || supabase;

export function getStoredUsers(): AppUser[] {
  return [];
}

export async function syncUsersFromDatabase(): Promise<AppUser[]> {
  try {
    const client = getClient();
    const { data: users, error } = await client.from('users').select('*');
    if (!error && users && users.length > 0) {
      const mapped: AppUser[] = users.map((u: any) => {
        const raw = u.raw_data && typeof u.raw_data === 'object' ? u.raw_data : {};
        const isUserActive = 
          u.status === true || 
          u.status === 1 || 
          String(u.status).toLowerCase() === 'actif' || 
          String(u.status).toLowerCase() === 'active' || 
          String(raw.status).toLowerCase() === 'actif' || 
          String(raw.status).toLowerCase() === 'active' || 
          String(raw.status).toLowerCase() === 'en_poste';

        let resolvedRole: 'administrateur' | 'responsable' | 'employé' = 'employé';
        if (u.role_id === 1 || String(raw.role).toUpperCase().includes('ADMIN') || String(raw.role).toLowerCase() === 'administrateur') {
          resolvedRole = 'administrateur';
        } else if (u.role_id === 2 || String(raw.role).toUpperCase() === 'RESPONSABLE') {
          resolvedRole = 'responsable';
        }

        return {
          id: String(u.id),
          uid: u.uid,
          name: u.name || raw.name || (u.email ? u.email.split('@')[0] : 'Utilisateur'),
          email: u.email,
          role: resolvedRole,
          status: isUserActive ? 'actif' : 'inactif',
          department: u.department || raw.department || 'Général',
          phone: u.phone || raw.phone || '',
          avatarUrl: u.avatar_url || raw.avatarUrl || '',
          passwordHash: raw.passwordHash || raw.password_hash || u.password_hash || '',
          createdAt: u.created_at || raw.createdAt || new Date().toISOString()
        };
      });
      return mapped;
    }
    return [];
  } catch (err) {
    console.warn('[userService] Récupération utilisateurs depuis BD:', err);
    return [];
  }
}

export const seedUsersIfEmpty = syncUsersFromDatabase;

export function subscribeToUsers(callback: (users: AppUser[]) => void) {
  syncUsersFromDatabase().then((dbUsers) => {
    if (dbUsers && dbUsers.length > 0) {
      callback(dbUsers);
    }
  });

  supabaseService.fetchCollection<AppUser>(USERS_COLLECTION).then((items) => {
    if (items && items.length > 0) {
      callback(items);
    }
  }).catch(() => {});

  const channelName = `realtime_users_${Date.now()}_${Math.random()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'users' },
      async () => {
        const updated = await supabaseService.fetchCollection<AppUser>(USERS_COLLECTION);
        if (updated && updated.length > 0) {
          callback(updated);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function saveUser(user: AppUser): Promise<AppUser> {
  try {
    const cleanUser: AppUser = {
      ...user,
      email: user.email.trim().toLowerCase(),
      name: user.name.trim(),
      department: user.department?.trim() || 'Direction Générale',
    };

    if (cleanUser.passwordHash && !cleanUser.passwordHash.startsWith('pbkdf2:')) {
      cleanUser.passwordHash = await hashPassword(cleanUser.passwordHash);
    }

    cloudSqlService.saveDocument('users', cleanUser).catch(() => {});
    const saved = await supabaseService.saveDocument('users', cleanUser);
    const resolvedUser: AppUser = (saved as AppUser) || cleanUser;

    try {
      const client = getClient();
      const userEmail = cleanUser.email;
      const userEmployeeId = cleanUser.employeeId;

      let empQuery = client.from('employees').select('*');
      const isNumUserId = /^\d+$/.test(String(cleanUser.id));
      const isNumEmpId = userEmployeeId && /^\d+$/.test(String(userEmployeeId));

      const conditions: string[] = [`email.ilike.${userEmail}`];
      if (isNumEmpId) conditions.push(`id.eq.${userEmployeeId}`);
      if (userEmployeeId) conditions.push(`doc_id.eq.${userEmployeeId}`);
      if (isNumUserId) conditions.push(`user_id.eq.${cleanUser.id}`);

      empQuery = empQuery.or(conditions.join(','));
      const { data: matchedEmp } = await empQuery.maybeSingle();

      if (matchedEmp) {
        const rawEmp = matchedEmp.raw_data && typeof matchedEmp.raw_data === 'object' ? matchedEmp.raw_data : {};
        
        let newEmploymentStatus = cleanUser.employmentStatus || matchedEmp.employment_status || 'en_poste';
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

        const updatedEmp: Employee = {
          ...rawEmp,
          id: String(matchedEmp.id),
          doc_id: matchedEmp.doc_id || rawEmp.doc_id || `emp_${matchedEmp.id}`,
          uid: matchedEmp.uid,
          userId: cleanUser.id,
          name: cleanUser.name,
          email: cleanUser.email,
          phone: cleanUser.phone || matchedEmp.phone || '',
          department: cleanUser.department || matchedEmp.department || 'Direction Générale',
          roleType: cleanUser.role === 'administrateur' ? 'Super Administrateur' : cleanUser.role === 'responsable' ? 'Responsable' : (matchedEmp.role_type || 'Employé'),
          roleId: cleanUser.role === 'administrateur' ? 1 : cleanUser.role === 'responsable' ? 2 : 3,
          status: isEmpActive,
          employmentStatus: newEmploymentStatus,
          avatarUrl: cleanUser.avatarUrl || matchedEmp.avatar_url || '',
          salary: matchedEmp.salary || 0,
          hireDate: matchedEmp.hire_date || rawEmp.hireDate || new Date().toISOString().split('T')[0],
        };

        await supabaseService.saveDocument('employees', updatedEmp);
        window.dispatchEvent(new CustomEvent('citrine:employee_updated', { detail: updatedEmp }));
      }
    } catch (syncErr) {
      console.warn('[userService] Notice synchronisation collaborateur associé:', syncErr);
    }
    return resolvedUser;
  } catch (error) {
    console.error('Error saving user:', error);
    return user;
  }
}

export async function fetchDatabaseUserByEmail(email: string): Promise<AppUser | null> {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  const client = getClient();

  try {
    const { data: dbUser, error: userErr } = await client
      .from('users')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (!userErr && dbUser) {
      const raw = dbUser.raw_data && typeof dbUser.raw_data === 'object' ? dbUser.raw_data : {};
      
      const { data: dbEmp } = await client
        .from('employees')
        .select('*')
        .or(`email.ilike.${cleanEmail},user_id.eq.${dbUser.id}`)
        .maybeSingle();

      const empStatus: EmployeeStatus =
        dbEmp?.employment_status ||
        raw.employmentStatus ||
        (dbEmp?.status === false ? 'parti' : 'en_poste');

      const isBlockedBySituation =
        empStatus === 'renvoye' ||
        empStatus === 'demissionne' ||
        empStatus === 'parti' ||
        empStatus === 'suspendu';

      const isBaseActive =
        dbUser.status === true ||
        dbUser.status === 1 ||
        String(dbUser.status).toLowerCase() === 'actif' ||
        String(dbUser.status).toLowerCase() === 'active' ||
        String(dbUser.status).toLowerCase() === 'true';

      const isUserActive = isBaseActive && !isBlockedBySituation;

      let resolvedRole: 'administrateur' | 'responsable' | 'employé' = 'employé';
      if (
        dbUser.role_id === 1 ||
        String(raw.role).toUpperCase() === 'SUPER_ADMIN' ||
        String(raw.role).toLowerCase() === 'administrateur' ||
        String(raw.role).toLowerCase().includes('admin')
      ) {
        resolvedRole = 'administrateur';
      } else if (
        dbUser.role_id === 2 ||
        String(raw.role).toUpperCase() === 'RESPONSABLE' ||
        String(raw.role).toLowerCase() === 'responsable' ||
        String(raw.role).toLowerCase().includes('manager')
      ) {
        resolvedRole = 'responsable';
      } else if (
        dbUser.role_id === 3 ||
        String(raw.role).toUpperCase() === 'EMPLOYE' ||
        String(raw.role).toLowerCase() === 'employé'
      ) {
        resolvedRole = 'employé';
      }

      return {
        id: String(dbUser.id),
        uid: dbUser.uid,
        name: dbUser.name || raw.name || cleanEmail.split('@')[0],
        email: dbUser.email || cleanEmail,
        role: resolvedRole,
        status: isUserActive ? 'actif' : 'inactif',
        employmentStatus: empStatus,
        department: dbUser.department || dbEmp?.department || raw.department || 'Direction Générale',
        phone: dbUser.phone || dbEmp?.phone || raw.phone || '',
        avatarUrl: dbUser.avatar_url || dbEmp?.avatar_url || raw.avatarUrl || '',
        passwordHash: raw.passwordHash || raw.password_hash || dbUser.password_hash || '',
        employeeId: dbEmp?.id ? String(dbEmp.id) : raw.employeeId,
        createdAt: dbUser.created_at || raw.createdAt || new Date().toISOString()
      };
    }

    const { data: dbEmp, error: empErr } = await client
      .from('employees')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (!empErr && dbEmp) {
      const raw = dbEmp.raw_data && typeof dbEmp.raw_data === 'object' ? dbEmp.raw_data : {};
      const empStatus: EmployeeStatus = dbEmp.employment_status || (dbEmp.status ? 'en_poste' : 'parti');

      const isBlockedBySituation =
        empStatus === 'renvoye' ||
        empStatus === 'demissionne' ||
        empStatus === 'parti' ||
        empStatus === 'suspendu';

      const isEmpActive =
        (dbEmp.status === true ||
          dbEmp.status === 1 ||
          String(dbEmp.status).toLowerCase() === 'actif' ||
          String(dbEmp.status).toLowerCase() === 'true') &&
        !isBlockedBySituation;

      let resolvedRole: 'administrateur' | 'responsable' | 'employé' = 'employé';
      if (dbEmp.role_id === 1 || String(dbEmp.role_type).toLowerCase().includes('admin')) {
        resolvedRole = 'administrateur';
      } else if (
        dbEmp.role_id === 2 ||
        String(dbEmp.role_type).toLowerCase().includes('responsable') ||
        String(dbEmp.position).toLowerCase().includes('responsable')
      ) {
        resolvedRole = 'responsable';
      } else {
        resolvedRole = 'employé';
      }

      return {
        id: String(dbEmp.id),
        uid: dbEmp.uid,
        name: dbEmp.name || `${dbEmp.first_name || ''} ${dbEmp.last_name || ''}`.trim() || raw.name || 'Collaborateur',
        email: dbEmp.email || cleanEmail,
        role: resolvedRole,
        status: isEmpActive ? 'actif' : 'inactif',
        employmentStatus: empStatus,
        department: dbEmp.department || raw.department || 'Direction Générale',
        phone: dbEmp.phone || raw.phone || '',
        avatarUrl: dbEmp.avatar_url || raw.avatarUrl || '',
        passwordHash: raw.passwordHash || raw.password_hash || '',
        employeeId: String(dbEmp.id),
        createdAt: dbEmp.created_at || dbEmp.hire_date || new Date().toISOString()
      };
    }

    return null;
  } catch (err) {
    console.error('[fetchDatabaseUserByEmail] Erreur:', err);
    return null;
  }
}

export async function fetchFreshUser(emailOrId: string): Promise<AppUser | null> {
  try {
    const norm = emailOrId.trim().toLowerCase();
    const dbUser = await fetchDatabaseUserByEmail(norm);
    if (dbUser) return dbUser;

    try {
      const client = getClient();
      const { data: idUser } = await client
        .from('users')
        .select('*')
        .or(`id.eq.${emailOrId},uid.eq.${emailOrId}`)
        .maybeSingle();
      if (idUser && idUser.email) {
        return fetchDatabaseUserByEmail(idUser.email);
      }
    } catch {}

    return null;
  } catch {
    return null;
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    await supabaseService.deleteDocument('users', userId).catch(() => {});
  } catch (error) {
    console.error('Error deleting user:', error);
  }
}

export function findUserByEmail(users: AppUser[], email?: string | null): AppUser | undefined {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();
  const found = users?.find((u) => (u?.email || '').trim().toLowerCase() === normalized);
  if (found) return found;
  return undefined;
}
