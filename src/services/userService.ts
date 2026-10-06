import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppUser } from '../types';
import { hashPassword } from '../utils/cryptoUtils';
import rawDatabaseExport from '../data/firestoreDatabaseExport.json';

export const USERS_COLLECTION = 'users';

export const INITIAL_DEFAULT_USERS: AppUser[] = (rawDatabaseExport?.collections?.users && rawDatabaseExport.collections.users.length > 0)
  ? (rawDatabaseExport.collections.users as AppUser[])
  : [
  {
    id: 'user-admin-citrine-mob',
    name: 'Citrine Mobilité',
    email: 'citrinemobilite@gmail.com',
    role: 'administrateur',
    status: 'actif',
    phone: '+237 600 000 099',
    authMethod: 'password',
    department: 'Direction Générale',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'user-admin-1',
    name: 'Landry Moutongo',
    email: 'landrymouns@gmail.com',
    role: 'administrateur',
    status: 'actif',
    phone: '+237 600 000 001',
    authMethod: 'password',
    department: 'Direction Générale',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'user-admin-2',
    name: 'Administrateur Citrine',
    email: 'admin@citrine.cm',
    role: 'administrateur',
    status: 'actif',
    phone: '+237 600 000 000',
    authMethod: 'password',
    department: 'Direction Générale',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'user-manager-1',
    name: 'Responsable Opérations',
    email: 'responsable@citrine.cm',
    role: 'responsable',
    status: 'actif',
    phone: '+237 600 000 004',
    authMethod: 'password',
    department: 'Opérations',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'user-emp-1',
    name: 'Employé Terrain',
    email: 'employe@citrine.cm',
    role: 'employé',
    status: 'actif',
    phone: '+237 600 000 005',
    authMethod: 'password',
    department: 'Logistique & Terrain',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

// Seed users collection in Firestore if empty
export async function seedUsersIfEmpty(): Promise<AppUser[]> {
  try {
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    const list: AppUser[] = [];
    if (!snap.empty) {
      snap.forEach((d) => list.push(d.data() as AppUser));
      return list;
    }

    // Auto-seed default users if database collection is empty
    const batch = writeBatch(db);
    for (const u of INITIAL_DEFAULT_USERS) {
      const ref = doc(db, USERS_COLLECTION, u.id);
      batch.set(ref, u);
    }
    await batch.commit().catch(() => {});
    return INITIAL_DEFAULT_USERS;
  } catch (error) {
    console.warn('Firestore users offline or using fallback defaults:', error);
    return INITIAL_DEFAULT_USERS;
  }
}

// Subscribe to real-time users collection
export function subscribeToUsers(callback: (users: AppUser[]) => void) {
  const colRef = collection(db, USERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: AppUser[] = [];
      snapshot.forEach((d) => list.push(d.data() as AppUser));
      callback(list);
    },
    (err) => {
      console.warn('Firestore subscription error for users:', err);
      callback([]);
    }
  );
}

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

    const ref = doc(db, USERS_COLLECTION, cleanUser.id);
    await setDoc(ref, cleanUser, { merge: true });

    // Sync localStorage
    try {
      const saved = localStorage.getItem('citrine_users');
      let currentUsers: AppUser[] = saved ? JSON.parse(saved) : [];
      if (Array.isArray(currentUsers)) {
        const idx = currentUsers.findIndex(u => u.id === cleanUser.id);
        if (idx >= 0) {
          currentUsers[idx] = cleanUser;
        } else {
          currentUsers.push(cleanUser);
        }
        localStorage.setItem('citrine_users', JSON.stringify(currentUsers));
      }
    } catch (e) {}
  } catch (error) {
    console.error('Error saving user in Firestore:', error);
  }
}

// Delete user
export async function deleteUser(userId: string): Promise<void> {
  try {
    const ref = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(ref);

    // Sync localStorage immediately
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
  } catch (error) {
    console.error('Error deleting user from Firestore:', error);
  }
}

// Helper to authenticate user via email and password
export function findUserByEmail(users: AppUser[], email?: string | null): AppUser | undefined {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();
  const pool = users && users.length > 0 ? users : INITIAL_DEFAULT_USERS;
  return pool.find((u) => (u?.email || '').trim().toLowerCase() === normalized);
}
