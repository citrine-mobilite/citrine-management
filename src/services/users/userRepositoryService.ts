import { AppUser } from '../../types';
import { hashPassword } from '../../utils/cryptoUtils';
import { mariaDbService } from '../mariaDbService';
import { asyncActionTrackerService } from '../asyncActionTrackerService';
import { mapDbUserRow } from './userMapperHelpers';
import { syncUserToEmployeeTable } from './userEmployeeSyncHelper';

export const USERS_COLLECTION = 'users';
export const INITIAL_DEFAULT_USERS: AppUser[] = [];
export function getStoredUsers(): AppUser[] { return []; }

export async function syncUsersFromDatabase(): Promise<AppUser[]> {
  try { return (await mariaDbService.fetchCollection<any>(USERS_COLLECTION)).map(mapDbUserRow); }
  catch (error) { console.warn('[userService] Lecture utilisateurs MariaDB :', error); return []; }
}
export const seedUsersIfEmpty = syncUsersFromDatabase;

export function subscribeToUsers(callback: (users: AppUser[]) => void) {
  return mariaDbService.subscribeToCollection<any>(USERS_COLLECTION, rows => callback(rows.map(mapDbUserRow)));
}

export async function saveUser(user: AppUser, previousUser?: AppUser): Promise<AppUser> {
  return asyncActionTrackerService.track('Enregistrement du compte utilisateur...', async () => {
    const cleanUser: AppUser = {
      ...user, email: user.email.trim().toLowerCase(), name: user.name.trim(),
      department: user.department?.trim() || 'Direction Générale',
    };
    if (cleanUser.passwordHash && !cleanUser.passwordHash.startsWith('pbkdf2:') && !/^\$2[aby]\$/.test(cleanUser.passwordHash)) {
      cleanUser.passwordHash = await hashPassword(cleanUser.passwordHash);
    }

    const existingRows = await mariaDbService.fetchCollection<any>(USERS_COLLECTION);
    const oldEmail = String(previousUser?.email || '').trim().toLowerCase();
    const existing = existingRows.find((row: any) =>
      String(row.id) === String(cleanUser.id) ||
      (cleanUser.uid && String(row.uid) === String(cleanUser.uid)) ||
      (oldEmail && String(row.email || '').toLowerCase() === oldEmail) ||
      String(row.email || '').toLowerCase() === cleanUser.email
    );
    const roleCode = cleanUser.role === 'administrateur' ? 'SUPER_ADMIN' : cleanUser.role === 'responsable' ? 'RESPONSABLE' : 'EMPLOYE';
    const roleRows = await mariaDbService.fetchCollection<any>('roles');
    const roleId = Number(roleRows.find((row: any) => String(row.code || '').toUpperCase() === roleCode)?._dbId) ||
      (cleanUser.role === 'administrateur' ? 1 : cleanUser.role === 'responsable' ? 2 : 3);
    const payload: any = {
      ...(existing || {}), ...cleanUser,
      id: existing?.id || cleanUser.id || `user-${Date.now()}`,
      docId: existing?.docId || existing?.doc_id || cleanUser.doc_id,
      uid: existing?.uid || cleanUser.uid || crypto.randomUUID(),
      roleId,
      status: cleanUser.status === 'actif' ? 'actif' : 'inactif',
      updatedAt: new Date().toISOString(),
    };
    // Ne jamais remplacer le hash existant par une valeur vide/non fournie.
    if (!cleanUser.passwordHash) delete payload.passwordHash;

    const saved = await mariaDbService.saveDocument(USERS_COLLECTION, payload);
    const resolved: AppUser = {
      ...payload, ...(saved || {}),
      id: String((saved as any)?.id || payload.id),
      role: cleanUser.role, roleId,
      status: cleanUser.status === 'actif' ? 'actif' : 'inactif',
      email: cleanUser.email, name: cleanUser.name,
    };
    await syncUserToEmployeeTable(cleanUser, resolved, roleId, oldEmail);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('citrine:user_updated', { detail: resolved }));
    }
    return resolved;
  });
}
