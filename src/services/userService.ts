import { AppUser } from '../types';
import { hashPassword } from '../utils/cryptoUtils';
import { supabase } from '../lib/supabase';
import rawDatabaseExport from '../data/citrineDatabaseExport.json';
import { supabaseService } from './supabaseService';
import { cloudSqlService } from './cloudSqlService';

export const USERS_COLLECTION = 'users';

const rawUsers: AppUser[] = (rawDatabaseExport?.collections?.users && Array.isArray(rawDatabaseExport.collections.users))
  ? (rawDatabaseExport.collections.users as AppUser[])
  : [];

export const INITIAL_DEFAULT_USERS: AppUser[] = rawUsers;

// Récupère les utilisateurs locaux ou par défaut
export function getStoredUsers(): AppUser[] {
  try {
    const saved = localStorage.getItem('citrine_users');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_DEFAULT_USERS;
}

// Seeder dynamique : insère les comptes par défaut dans la base de données s'ils n'y sont pas encore
export async function seedUsersIfEmpty(): Promise<AppUser[]> {
  try {
    const existing = await supabaseService.fetchCollection<AppUser>(USERS_COLLECTION);
    if (existing && existing.length > 0) {
      try {
        localStorage.setItem('citrine_users', JSON.stringify(existing));
      } catch {}
      return existing;
    }

    // Comptes par défaut injectés dynamiquement par le seeder de base de données
    const defaultAdmin: AppUser = {
      id: 'user-admin-citrine-mob',
      name: 'Citrine Mobilité',
      email: 'citrinemobilite@gmail.com',
      role: 'administrateur',
      status: 'actif',
      phone: '+237 600 000 099',
      authMethod: 'password',
      department: 'Direction Générale',
      passwordHash: 'pbkdf2:c623b3faebf9ba3c38f47273a303e218:5beb725b10c47a811cac27ba53cb762d2ff94af8cc847520aabda912c9ee9424',
      createdAt: new Date().toISOString()
    };

    const defaultEmployee: AppUser = {
      id: 'usr-emp-landrymouns',
      name: 'Landry Moutongo',
      email: 'landrymouns@gmail.com',
      role: 'employé',
      status: 'actif',
      phone: '+237 600 000 001',
      authMethod: 'password',
      department: 'Logistique & Terrain',
      passwordHash: 'pbkdf2:5f4af53c9702106b1487e4289c2ef906:a54d68de1d57dc115a8689d6c2bcdd6340f97b511f24cad526ead492a75327d5',
      createdAt: new Date().toISOString()
    };

    const seeded = [defaultAdmin, defaultEmployee, ...rawUsers];
    for (const u of seeded) {
      await saveUser(u);
    }
    return seeded;
  } catch (err) {
    console.warn('Seed users error:', err);
    return getStoredUsers();
  }
}

// Subscribe to real-time users collection via Supabase Realtime & LocalStorage
export function subscribeToUsers(callback: (users: AppUser[]) => void) {
  const localList = getStoredUsers();
  callback(localList);

  seedUsersIfEmpty().then((seeded) => {
    if (seeded && seeded.length > 0) {
      callback(seeded);
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
