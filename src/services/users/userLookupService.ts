import { AppUser } from '../../types';
import { supabaseService } from '../supabaseService';
import { asyncActionTrackerService } from '../asyncActionTrackerService';
import { mapDbEmployeeOnlyToAppUser, mapDbUserAndEmpToAppUser, mapDbUserRow } from './userMapperHelpers';

export async function fetchDatabaseUserByEmail(email: string): Promise<AppUser | null> {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  try {
    const [users, employees] = await Promise.all([
      supabaseService.fetchCollection<any>('users'),
      supabaseService.fetchCollection<any>('employees'),
    ]);
    const user = users.find((row: any) => String(row.email || '').trim().toLowerCase() === cleanEmail);
    const employee = employees.find((row: any) =>
      String(row.email || '').trim().toLowerCase() === cleanEmail ||
      (user && String(row.userId || '') === String(user.id))
    );
    if (user) return employee ? mapDbUserAndEmpToAppUser(user, employee, cleanEmail) : mapDbUserRow(user);
    return employee ? mapDbEmployeeOnlyToAppUser(employee, cleanEmail) : null;
  } catch (error) {
    console.error('[fetchDatabaseUserByEmail MariaDB]', error);
    return null;
  }
}

export async function fetchFreshUser(emailOrId: string): Promise<AppUser | null> {
  const value = String(emailOrId || '').trim();
  if (!value) return null;
  if (value.includes('@')) return fetchDatabaseUserByEmail(value);
  try {
    const users = await supabaseService.fetchCollection<any>('users');
    const user = users.find((row: any) =>
      String(row.id) === value || String(row._dbId) === value ||
      String(row.uid || '') === value || String(row.docId || row.doc_id || '') === value
    );
    return user ? mapDbUserRow(user) : null;
  } catch { return null; }
}

export async function deleteUser(userId: string): Promise<void> {
  return asyncActionTrackerService.track('Suppression du compte utilisateur...', async () => {
    await supabaseService.deleteDocument('users', userId);
  });
}

export function findUserByEmail(users: AppUser[], email?: string | null): AppUser | undefined {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();
  return users?.find(u => (u?.email || '').trim().toLowerCase() === normalized);
}
