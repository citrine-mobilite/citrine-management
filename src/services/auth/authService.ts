import { AppUser } from '../../types';
import { recordConnectionLog } from '../connectionLogService';
import { storeSecureSession, clearSecureSession, loadSecureSession, storeApiToken, getApiToken } from '../sessionService';
import { clearIdbUserDataStores } from '../../lib/idb';

export interface LoginResult { success: boolean; user?: AppUser; error?: string; }

export const authService = {
  async login(email: string, password: string): Promise<LoginResult> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) return { success: false, error: 'Veuillez renseigner votre adresse email et votre mot de passe.' };
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success || !result.user || !result.token) {
        return { success: false, error: result.error || 'Connexion refusée.' };
      }
      const user = result.user as AppUser;
      await clearIdbUserDataStores();
      storeApiToken(result.token);
      await storeSecureSession(user);
      await recordConnectionLog({
        userId: user.id, userName: user.name, userEmail: user.email,
        authMethod: 'password', status: 'success',
        details: `Connexion MariaDB réussie (Rôle : ${user.role})`,
      }).catch(() => {});
      return { success: true, user };
    } catch (error) {
      console.error('[authService.login]', error);
      return { success: false, error: 'Le serveur de connexion est indisponible.' };
    }
  },

  async logout(): Promise<void> {
    const token = getApiToken();
    try {
      if (token) await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    } catch {}
    await clearIdbUserDataStores();
    clearSecureSession();
  },

  async validateCurrentSession(): Promise<AppUser | null> {
    const token = getApiToken();
    if (!token) { await clearIdbUserDataStores(); clearSecureSession(); return null; }
    try {
      const response = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success || !result.user) { await clearIdbUserDataStores(); clearSecureSession(); return null; }
      const user = result.user as AppUser;
      await storeSecureSession(user);
      return user;
    } catch {
      const cached = await loadSecureSession();
      return cached;
    }
  },
};
