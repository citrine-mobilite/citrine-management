import { AppUser } from '../../types';
import { hashPassword } from '../../utils/cryptoUtils';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import { supabaseService } from '../supabaseService';
import { cloudSqlService } from '../cloudSqlService';
import { asyncActionTrackerService } from '../asyncActionTrackerService';
import { getUserClient, mapDbUserRow } from './userMapperHelpers';
import { syncUserToEmployeeTable } from './userEmployeeSyncHelper';

export const USERS_COLLECTION = 'users';
export const INITIAL_DEFAULT_USERS: AppUser[] = [];

export function getStoredUsers(): AppUser[] {
  return [];
}

export async function syncUsersFromDatabase(): Promise<AppUser[]> {
  try {
    const client = getUserClient();
    const { data: users, error } = await client.from('users').select('*');
    if (!error && users && users.length > 0) {
      return users.map(mapDbUserRow);
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
    if (dbUsers && dbUsers.length > 0) callback(dbUsers);
  });

  supabaseService.fetchCollection<AppUser>(USERS_COLLECTION).then((items) => {
    if (items && items.length > 0) callback(items);
  }).catch(() => {});

  const channelName = `realtime_users_${Date.now()}_${Math.random()}`;
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, async () => {
      const updated = await supabaseService.fetchCollection<AppUser>(USERS_COLLECTION);
      if (updated && updated.length > 0) callback(updated);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function saveUser(user: AppUser, previousUser?: AppUser): Promise<AppUser> {
  return asyncActionTrackerService.track('Enregistrement du compte utilisateur...', async () => {
    try {
      const cleanUser: AppUser = {
        ...user,
        email: user.email.trim(),
        name: user.name.trim(),
        department: user.department?.trim() || 'Direction Générale',
      };

      if (cleanUser.passwordHash && !cleanUser.passwordHash.startsWith('pbkdf2:')) {
        cleanUser.passwordHash = await hashPassword(cleanUser.passwordHash);
      }

      try {
        const saved = localStorage.getItem('citrine_users');
        const currentUsers: AppUser[] = saved ? JSON.parse(saved) : [];
        if (Array.isArray(currentUsers)) {
          const oldEmail = previousUser?.email?.trim().toLowerCase();
          const idx = currentUsers.findIndex(
            (u) =>
              u.id === cleanUser.id ||
              u.email.toLowerCase() === cleanUser.email ||
              (oldEmail && u.email.toLowerCase() === oldEmail)
          );
          if (idx >= 0) currentUsers[idx] = cleanUser;
          else currentUsers.push(cleanUser);
          localStorage.setItem('citrine_users', JSON.stringify(currentUsers));
        }
      } catch {}

      const client = getUserClient();
      const oldEmail = (previousUser?.email || '').trim().toLowerCase();
      const userEmail = cleanUser.email;
      const isEmailChanged = Boolean(oldEmail && oldEmail !== userEmail);

      let matchedUserRow: any = null;
      if (typeof cleanUser.id === 'string' && /^\d+$/.test(cleanUser.id)) {
        const { data } = await client.from('users').select('*').eq('id', Number(cleanUser.id)).maybeSingle();
        matchedUserRow = data;
      } else if (typeof cleanUser.id === 'number') {
        const { data } = await client.from('users').select('*').eq('id', cleanUser.id).maybeSingle();
        matchedUserRow = data;
      }
      if (!matchedUserRow && cleanUser.uid) {
        const { data } = await client.from('users').select('*').eq('uid', cleanUser.uid).maybeSingle();
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

      const resolvedRoleId = cleanUser.role === 'administrateur' ? 1 : cleanUser.role === 'responsable' ? 2 : 3;
      const isUserActive = cleanUser.status === 'actif';
      let resolvedUser: AppUser;

      if (matchedUserRow) {
        const existingRaw = matchedUserRow.raw_data && typeof matchedUserRow.raw_data === 'object' ? matchedUserRow.raw_data : {};
        const updatedUserRaw = {
          ...existingRaw,
          ...cleanUser,
          name: cleanUser.name,
          email: cleanUser.email,
          phone: cleanUser.phone || null,
          department: cleanUser.department,
          role: cleanUser.role,
          roleId: resolvedRoleId,
          role_id: resolvedRoleId,
          status: cleanUser.status,
          employmentStatus: cleanUser.employmentStatus,
          employeeId: cleanUser.employeeId || existingRaw.employeeId || null,
          allowEarlyDeparture15_17: Boolean(cleanUser.allowEarlyDeparture15_17),
          allowLateArrival8_930: Boolean(cleanUser.allowLateArrival8_930),
          birthDate: cleanUser.birthDate ?? existingRaw.birthDate ?? null,
          team: cleanUser.team ?? existingRaw.team ?? null,
          teams: cleanUser.teams ?? existingRaw.teams ?? null,
          managerId: cleanUser.managerId ?? existingRaw.managerId ?? null,
          managerName: cleanUser.managerName ?? existingRaw.managerName ?? null,
          passwordHash: cleanUser.passwordHash || existingRaw.passwordHash || existingRaw.password_hash || '',
          password_hash: cleanUser.passwordHash || existingRaw.passwordHash || existingRaw.password_hash || '',
          updatedAt: new Date().toISOString(),
        };

        await client.from('users').update({
          name: cleanUser.name,
          email: cleanUser.email,
          phone: cleanUser.phone || null,
          department: cleanUser.department,
          role_id: resolvedRoleId,
          status: isUserActive,
          avatar_url: cleanUser.avatarUrl || null,
          raw_data: updatedUserRaw,
          updated_at: new Date().toISOString(),
        }).eq('id', matchedUserRow.id);

        if (supabaseAdmin && matchedUserRow.uid) {
          try {
            if (isEmailChanged) {
              await supabaseAdmin.auth.admin.updateUserById(matchedUserRow.uid, { email: cleanUser.email });
            }
            if (cleanUser.passwordHash && !cleanUser.passwordHash.startsWith('pbkdf2:')) {
              await supabaseAdmin.auth.admin.updateUserById(matchedUserRow.uid, { password: cleanUser.passwordHash });
            }
          } catch (authErr) {
            console.warn('[userService] Notice update Supabase Auth user:', authErr);
          }
        }

        resolvedUser = { ...cleanUser, id: String(matchedUserRow.id), uid: matchedUserRow.uid };
      } else {
        cloudSqlService.saveDocument('users', cleanUser).catch(() => {});
        const saved = await supabaseService.saveDocument('users', cleanUser);
        resolvedUser = (saved as AppUser) || cleanUser;
      }

      await syncUserToEmployeeTable(cleanUser, resolvedUser, resolvedRoleId, oldEmail);
      window.dispatchEvent(new CustomEvent('citrine:user_updated', { detail: resolvedUser }));
      return resolvedUser;
    } catch (error) {
      console.error('Error saving user:', error);
      return user;
    }
  });
}
