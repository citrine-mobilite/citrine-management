import { AppUser } from '../../types';
import { supabaseService } from '../supabaseService';
import { asyncActionTrackerService } from '../asyncActionTrackerService';
import {
  getUserClient,
  mapDbEmployeeOnlyToAppUser,
  mapDbUserAndEmpToAppUser,
} from './userMapperHelpers';

export async function fetchDatabaseUserByEmail(email: string): Promise<AppUser | null> {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  const client = getUserClient();

  try {
    const { data: dbUser, error: userErr } = await client
      .from('users')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (!userErr && dbUser) {
      const { data: dbEmp } = await client
        .from('employees')
        .select('*')
        .or(`email.ilike.${cleanEmail},user_id.eq.${dbUser.id}`)
        .maybeSingle();

      return mapDbUserAndEmpToAppUser(dbUser, dbEmp, cleanEmail);
    }

    const { data: dbEmp, error: empErr } = await client
      .from('employees')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (!empErr && dbEmp) {
      return mapDbEmployeeOnlyToAppUser(dbEmp, cleanEmail);
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
      const client = getUserClient();
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
  return asyncActionTrackerService.track('Suppression du compte utilisateur...', async () => {
    try {
      await supabaseService.deleteDocument('users', userId).catch(() => {});
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  });
}

export function findUserByEmail(users: AppUser[], email?: string | null): AppUser | undefined {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();
  const found = users?.find((u) => (u?.email || '').trim().toLowerCase() === normalized);
  return found || undefined;
}
