import { AppUser, Role, UserRole } from '../types';
import { createSessionChecksum, verifySessionChecksum } from '../utils/cryptoUtils';
import { safeStorage } from '../utils/safeStorage';

const SESSION_USER_KEY = 'citrine_current_user';
const SESSION_SIGNATURE_KEY = 'citrine_session_sig';
const SESSION_EXPIRY_KEY = 'citrine_token_expiry';
const SESSION_DURATION_MS = 90 * 24 * 60 * 60 * 1000; // 90 jours

/**
 * Normalise un rôle en format UI (Capitalisé : 'Administrateur', 'Responsable', 'Employé')
 */
export function normalizeRole(role?: string | null): Role {
  if (!role) return 'Employé';
  const lower = role.trim().toLowerCase();
  if (lower === 'administrateur' || lower === 'admin') return 'Administrateur';
  if (lower === 'responsable' || lower === 'manager') return 'Responsable';
  return 'Employé';
}

/**
 * Normalise un rôle en format base de données / UserRole ('administrateur', 'responsable', 'employé')
 */
export function toUserRole(role?: string | null): UserRole {
  if (!role) return 'employé';
  const lower = role.trim().toLowerCase();
  if (lower === 'administrateur' || lower === 'admin') return 'administrateur';
  if (lower === 'responsable' || lower === 'manager') return 'responsable';
  return 'employé';
}

/**
 * Enregistre une session utilisateur avec signature d'intégrité anti-altération
 */
export async function storeSecureSession(user: AppUser): Promise<void> {
  try {
    const signature = await createSessionChecksum(user.id, user.role, user.email);
    const expiry = Date.now() + SESSION_DURATION_MS;

    safeStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    safeStorage.setItem(SESSION_SIGNATURE_KEY, signature);
    safeStorage.setItem(SESSION_EXPIRY_KEY, String(expiry));
  } catch (error) {
    console.error('Erreur lors du stockage sécurisé de session:', error);
  }
}

/**
 * Charge et vérifie la validité cryptographique et temporelle de la session locale
 */
export async function loadSecureSession(): Promise<AppUser | null> {
  try {
    const rawUser = safeStorage.getItem(SESSION_USER_KEY);
    const signature = safeStorage.getItem(SESSION_SIGNATURE_KEY);
    const expiry = safeStorage.getItem(SESSION_EXPIRY_KEY);

    if (!rawUser || !signature || !expiry) {
      clearSecureSession();
      return null;
    }

    if (Date.now() > Number(expiry)) {
      clearSecureSession();
      return null;
    }

    const user: AppUser = JSON.parse(rawUser);
    if (!user || !user.id || !user.role || !user.email) {
      clearSecureSession();
      return null;
    }

    const isValidSig = await verifySessionChecksum(user.id, user.role, user.email, signature);
    if (!isValidSig) {
      console.warn('⚠️ Alerte de sécurité : Détection de falsification de session locale.');
      clearSecureSession();
      return null;
    }

    return user;
  } catch (error) {
    console.error('Erreur lors du chargement de la session:', error);
    clearSecureSession();
    return null;
  }
}

/**
 * Supprime proprement tous les jetons et identifiants de session locale
 */
export function clearSecureSession(): void {
  safeStorage.removeItem(SESSION_USER_KEY);
  safeStorage.removeItem(SESSION_SIGNATURE_KEY);
  safeStorage.removeItem(SESSION_EXPIRY_KEY);
}

/**
 * Vérifie l'état d'un utilisateur connecté par rapport à la base de données réelle
 * Détecte les comptes supprimés, désactivés, ou dont les droits ont changé
 */
export function validateSessionIntegrity(
  current: AppUser | null,
  databaseUsers: AppUser[]
): { valid: boolean; user?: AppUser; reason?: string } {
  if (!current) return { valid: false, reason: 'Pas de session active' };
  if (!databaseUsers || databaseUsers.length === 0) return { valid: true, user: current };

  const matched = databaseUsers.find((u) => u.id === current.id || u.email.toLowerCase() === current.email.toLowerCase());
  
  if (!matched) {
    return { valid: false, reason: 'Compte supprimé de la base de données' };
  }

  if (matched.status !== 'actif') {
    return { valid: false, reason: 'Compte utilisateur désactivé ou suspendu' };
  }

  return { valid: true, user: matched };
}

/**
 * Détermine les onglets autorisés en fonction du rôle
 */
export function canAccessTab(role: Role | UserRole, tab: string): boolean {
  const normRole = normalizeRole(role);
  
  if (normRole === 'Administrateur') return true;

  if (normRole === 'Responsable') {
    // Les responsables ont accès à l'opérationnel mais pas aux finances ni à la gestion des utilisateurs racine
    const forbiddenTabs = ['users', 'finances'];
    return !forbiddenTabs.includes(tab);
  }

  // Pour les employés standards, accès restreint au portail collaborateur et outils directs
  const allowedEmployeeTabs = [
    'employee_portal',
    'calls',
    'tasks',
    'reminders',
    'documents'
  ];

  return allowedEmployeeTabs.includes(tab);
}

/**
 * Vérifie si l'utilisateur possède les privilèges d'administration
 */
export function canPerformAdminAction(user: AppUser | null): boolean {
  if (!user) return false;
  return toUserRole(user.role) === 'administrateur';
}

/**
 * Vérifie si l'utilisateur possède au moins les privilèges de responsable
 */
export function canPerformManagerAction(user: AppUser | null): boolean {
  if (!user) return false;
  const role = toUserRole(user.role);
  return role === 'administrateur' || role === 'responsable';
}
