import { AppUser } from '../types';
import { hashPassword } from '../utils/cryptoUtils';
import { supabase, supabaseAdmin } from '../lib/supabase';
import rawDatabaseExport from '../data/citrineDatabaseExport.json';

export const USERS_COLLECTION = 'users';

// Compte Administrateur Principal Citrine Mobilité avec mot de passe "Citrine2026!" chiffré PBKDF2 + salt
export const CITRINE_MOBILITE_ADMIN_USER: AppUser = {
  id: 'user-admin-citrine-mob',
  name: 'Citrine Mobilité',
  email: 'citrinemobilite@gmail.com',
  role: 'administrateur',
  status: 'actif',
  phone: '+237 600 000 099',
  authMethod: 'password',
  department: 'Direction Générale',
  passwordHash: 'pbkdf2:c623b3faebf9ba3c38f47273a303e218:5beb725b10c47a811cac27ba53cb762d2ff94af8cc847520aabda912c9ee9424',
  createdAt: '2026-01-01T00:00:00.000Z'
};

// Compte Collaborateur Employé Landry Moutongo avec mot de passe "123456789" chiffré PBKDF2 + salt
export const LANDRY_EMPLOYEE_USER: AppUser = {
  id: 'usr-emp-landrymouns',
  name: 'Landry Moutongo',
  email: 'landrymouns@gmail.com',
  role: 'employé',
  status: 'actif',
  phone: '+237 600 000 001',
  authMethod: 'password',
  department: 'Logistique & Terrain',
  passwordHash: 'pbkdf2:5f4af53c9702106b1487e4289c2ef906:a54d68de1d57dc115a8689d6c2bcdd6340f97b511f24cad526ead492a75327d5',
  createdAt: '2026-01-01T00:00:00.000Z'
};

const rawUsers: AppUser[] = (rawDatabaseExport?.collections?.users && Array.isArray(rawDatabaseExport.collections.users))
  ? (rawDatabaseExport.collections.users as AppUser[])
  : [];

// S'assurer que les comptes citrinemobilite@gmail.com et landrymouns@gmail.com sont toujours garantis
const mergedDefaultUsers: AppUser[] = [
  CITRINE_MOBILITE_ADMIN_USER,
  LANDRY_EMPLOYEE_USER,
  ...rawUsers.filter(u => {
    const e = u.email?.trim().toLowerCase();
    return e !== 'citrinemobilite@gmail.com' && e !== 'landrymouns@gmail.com';
  })
];

export const INITIAL_DEFAULT_USERS: AppUser[] = mergedDefaultUsers;

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

// Seed users collection in Supabase / Local storage if empty
export async function seedUsersIfEmpty(): Promise<AppUser[]> {
  const current = getStoredUsers();
  return current;
}

import { supabaseService } from './supabaseService';

// Subscribe to real-time users collection via Supabase Realtime & LocalStorage
export function subscribeToUsers(callback: (users: AppUser[]) => void) {
  // 1. Délivrer immédiatement la liste locale pour 0ms d'attente
  const localList = getStoredUsers();
  callback(localList);

  // 2. Récupérer depuis Supabase et synchroniser
  supabaseService.fetchCollection<AppUser>('users').then((items) => {
    if (items && items.length > 0) {
      try {
        localStorage.setItem('citrine_users', JSON.stringify(items));
      } catch {}
      callback(items);
    }
  }).catch(() => {});

  // 3. Écouter les mises à jour en direct via Supabase Realtime
  const channelName = `realtime_users_${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'users' },
      async () => {
        const updated = await supabaseService.fetchCollection<AppUser>('users');
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

import { cloudSqlService } from './cloudSqlService';

// Save or update user (automatically enforces PBKDF2 encryption on plaintext passwords)
export async function saveUser(user: AppUser): Promise<void> {
  try {
    const cleanUser: AppUser = {
      ...user,
      email: user.email.trim().toLowerCase(),
      name: user.name.trim()
    };

    // Si le mot de passe est en clair, le hacher immédiatement avec sel cryptographique
    if (cleanUser.passwordHash && !cleanUser.passwordHash.startsWith('pbkdf2:')) {
      cleanUser.passwordHash = await hashPassword(cleanUser.passwordHash);
    }

    // 1. Synchronisation instantanée dans localStorage
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
    } catch (e) {}

    // 2. Persistance sur le serveur Cloud SQL (/api/data/users)
    cloudSqlService.saveDocument('users', cleanUser).catch((err) => {
      console.warn('[Cloud SQL users sync notice]:', err.message);
    });

    // 3. Synchronisation avec Supabase
    Promise.race([
      supabaseAdmin.from('users').upsert({
        doc_id: cleanUser.id,
        uid: cleanUser.id,
        email: cleanUser.email,
        name: cleanUser.name,
        role: cleanUser.role,
        status: cleanUser.status === 'actif',
        department: cleanUser.department || null,
        phone: cleanUser.phone || null,
        raw_data: cleanUser
      }, { onConflict: 'doc_id' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), 2000))
    ]).catch((err) => {
      console.warn('[Supabase users sync notice]:', err.message);
    });
  } catch (error) {
    console.error('Error saving user:', error);
  }
}

// Récupère l'utilisateur le plus frais depuis le serveur/Supabase
export async function fetchFreshUser(emailOrId: string): Promise<AppUser | null> {
  try {
    const norm = emailOrId.trim().toLowerCase();
    // 1. Tenter Cloud SQL
    try {
      const serverUsers = await cloudSqlService.fetchCollection<AppUser>('users');
      if (serverUsers && serverUsers.length > 0) {
        const found = serverUsers.find(u => u.id === emailOrId || u.email?.trim().toLowerCase() === norm);
        if (found) return found;
      }
    } catch {}

    // 2. Tenter Supabase
    try {
      const supaUsers = await supabaseService.fetchCollection<AppUser>('users');
      if (supaUsers && supaUsers.length > 0) {
        const found = supaUsers.find(u => u.id === emailOrId || u.email?.trim().toLowerCase() === norm);
        if (found) return found;
      }
    } catch {}

    // 3. Fallback localStorage
    const localUsers = getStoredUsers();
    return localUsers.find(u => u.id === emailOrId || u.email?.trim().toLowerCase() === norm) || null;
  } catch {
    return null;
  }
}

// Delete user
export async function deleteUser(userId: string): Promise<void> {
  try {
    // 1. Sync localStorage immediately
    try {
      const saved = localStorage.getItem('citrine_users');
      if (saved) {
        const currentUsers: AppUser[] = JSON.parse(saved);
        if (Array.isArray(currentUsers)) {
          const filtered = currentUsers.filter(u => u.id !== userId);
          localStorage.setItem('citrine_users', JSON.stringify(filtered));
        }
      }
    } catch (e) {}

    // 2. Delete from Supabase asynchronously
    Promise.race([
      supabaseAdmin.from('users').delete().match({ doc_id: userId }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), 2000))
    ]).catch((err) => {
      console.warn('[Supabase users delete notice]:', err.message);
    });
  } catch (error) {
    console.error('Error deleting user:', error);
  }
}

// Helper to authenticate user via email and password
export function findUserByEmail(users: AppUser[], email?: string | null): AppUser | undefined {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();

  // Cas prioritaire : citrinemobilite@gmail.com (Superadmin)
  if (normalized === 'citrinemobilite@gmail.com') {
    const fromList = users?.find((u) => (u?.email || '').trim().toLowerCase() === normalized);
    if (fromList) {
      return {
        ...fromList,
        passwordHash: fromList.passwordHash || CITRINE_MOBILITE_ADMIN_USER.passwordHash,
      };
    }
    return CITRINE_MOBILITE_ADMIN_USER;
  }

  // Cas prioritaire : landrymouns@gmail.com (Collaborateur Employé)
  if (normalized === 'landrymouns@gmail.com') {
    const fromList = users?.find((u) => (u?.email || '').trim().toLowerCase() === normalized);
    if (fromList) {
      return {
        ...fromList,
        role: 'employé',
        status: 'actif',
        passwordHash: fromList.passwordHash || LANDRY_EMPLOYEE_USER.passwordHash,
      };
    }
    return LANDRY_EMPLOYEE_USER;
  }

  // 1. Chercher dans la liste state
  let found = users?.find((u) => (u?.email || '').trim().toLowerCase() === normalized);
  if (found) return found;

  // 2. Chercher dans INITIAL_DEFAULT_USERS
  found = INITIAL_DEFAULT_USERS.find((u) => (u?.email || '').trim().toLowerCase() === normalized);
  if (found) return found;

  // 3. Chercher dans les collaborateurs (employees) enregistrés
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
