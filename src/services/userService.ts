import { AppUser } from '../types';
import { hashPassword } from '../utils/cryptoUtils';
import { supabase } from '../lib/supabase';
import { supabaseService } from './supabaseService';
import { cloudSqlService } from './cloudSqlService';

export const USERS_COLLECTION = 'users';

export const INITIAL_DEFAULT_USERS: AppUser[] = [];

// Récupère les utilisateurs locaux mis en cache
export function getStoredUsers(): AppUser[] {
  try {
    const saved = localStorage.getItem('citrine_users');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

// Synchronise la liste des comptes depuis Supabase
export async function syncUsersFromDatabase(): Promise<AppUser[]> {
  try {
    const existing = await supabaseService.fetchCollection<AppUser>(USERS_COLLECTION);
    if (existing && existing.length > 0) {
      try {
        localStorage.setItem('citrine_users', JSON.stringify(existing));
      } catch {}
      return existing;
    }
    return getStoredUsers();
  } catch (err) {
    console.warn('[userService] Récupération utilisateurs depuis BD:', err);
    return getStoredUsers();
  }
}

export const seedUsersIfEmpty = syncUsersFromDatabase;

// Subscribe to real-time users collection via Supabase Realtime & LocalStorage
export function subscribeToUsers(callback: (users: AppUser[]) => void) {
  const localList = getStoredUsers();
  if (localList.length > 0) {
    callback(localList);
  }

  syncUsersFromDatabase().then((dbUsers) => {
    if (dbUsers && dbUsers.length > 0) {
      callback(dbUsers);
    }
  });

  supabaseService.fetchCollection<AppUser>(USERS_COLLECTION).then((items) => {
    if (items && items.length > 0) {
      try {
        localStorage.setItem('citrine_users', JSON.stringify(items));
      } catch {}
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
          try {
            localStorage.setItem('citrine_users', JSON.stringify(updated));
          } catch {}
          callback(updated);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Save or update user
export async function saveUser(user: AppUser): Promise<void> {
  try {
    const cleanUser: AppUser = {
      ...user,
      email: user.email.trim().toLowerCase(),
      name: user.name.trim()
    };

    if (cleanUser.passwordHash && !cleanUser.passwordHash.startsWith('pbkdf2:')) {
      cleanUser.passwordHash = await hashPassword(cleanUser.passwordHash);
    }

    try {
      const saved = localStorage.getItem('citrine_users');
      let currentUsers: AppUser[] = saved ? JSON.parse(saved) : [];
      if (Array.isArray(currentUsers)) {
        const idx = currentUsers.findIndex(u => u.id === cleanUser.id || u.email === cleanUser.email);
        if (idx >= 0) {
          currentUsers[idx] = cleanUser;
        } else {
          currentUsers.push(cleanUser);
        }
        localStorage.setItem('citrine_users', JSON.stringify(currentUsers));
      }
    } catch {}

    cloudSqlService.saveDocument('users', cleanUser).catch(() => {});
    await supabaseService.saveDocument('users', cleanUser).catch(() => {});
  } catch (error) {
    console.error('Error saving user:', error);
  }
}

export async function fetchFreshUser(emailOrId: string): Promise<AppUser | null> {
  try {
    const norm = emailOrId.trim().toLowerCase();
    try {
      const serverUsers = await cloudSqlService.fetchCollection<AppUser>('users');
      if (serverUsers && serverUsers.length > 0) {
        const found = serverUsers.find(u => u.id === emailOrId || u.email?.trim().toLowerCase() === norm);
        if (found) return found;
      }
    } catch {}

    try {
      const supaUsers = await supabaseService.fetchCollection<AppUser>('users');
      if (supaUsers && supaUsers.length > 0) {
        const found = supaUsers.find(u => u.id === emailOrId || u.email?.trim().toLowerCase() === norm);
        if (found) return found;
      }
    } catch {}

    const localUsers = getStoredUsers();
    return localUsers.find(u => u.id === emailOrId || u.email?.trim().toLowerCase() === norm) || null;
  } catch {
    return null;
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    try {
      const saved = localStorage.getItem('citrine_users');
      if (saved) {
        const currentUsers: AppUser[] = JSON.parse(saved);
        if (Array.isArray(currentUsers)) {
          const filtered = currentUsers.filter(u => u.id !== userId);
          localStorage.setItem('citrine_users', JSON.stringify(filtered));
        }
      }
    } catch {}

    await supabaseService.deleteDocument('users', userId).catch(() => {});
  } catch (error) {
    console.error('Error deleting user:', error);
  }
}

export function findUserByEmail(users: AppUser[], email?: string | null): AppUser | undefined {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();

  let found = users?.find((u) => (u?.email || '').trim().toLowerCase() === normalized);
  if (found) return found;

  const stored = getStoredUsers();
  found = stored.find((u) => (u?.email || '').trim().toLowerCase() === normalized);
  if (found) return found;

  try {
    const savedEmployees = localStorage.getItem('citrine_employees');
    if (savedEmployees) {
      const parsedEmployees = JSON.parse(savedEmployees);
      if (Array.isArray(parsedEmployees)) {
        const emp = parsedEmployees.find((e: any) => (e?.email || '').trim().toLowerCase() === normalized);
        if (emp) {
          return {
            id: emp.id || `user-emp-${Date.now()}`,
            name: emp.name || 'Collaborateur',
            email: emp.email,
            role: 'employé',
            status: 'actif',
            phone: emp.phone || '',
            department: emp.department || 'Opérations',
            authMethod: 'password',
            createdAt: emp.hireDate || new Date().toISOString(),
          };
        }
      }
    }
  } catch {}

  return undefined;
}
