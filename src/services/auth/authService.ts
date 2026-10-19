import { AppUser } from '../../types';
import { supabase } from '../../lib/supabase';
import { fetchDatabaseUserByEmail } from '../userService';
import { verifyPassword } from '../../utils/cryptoUtils';
import { recordConnectionLog } from '../connectionLogService';
import { storeSecureSession, clearSecureSession, loadSecureSession } from '../sessionService';

export interface LoginResult {
  success: boolean;
  user?: AppUser;
  error?: string;
}

/**
 * Service d'authentification centralisé et strict basé exclusivement sur la base de données
 */
export const authService = {
  /**
   * Tente la connexion d'un utilisateur avec email et mot de passe.
   * RÈGLE STRICTE : L'utilisateur DOIT obligatoirement exister dans la table 'users' ou 'employees' de la base de données.
   * Aucun utilisateur fictif, seed ou fallback local n'est autorisé.
   */
  async login(email: string, password: string): Promise<LoginResult> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return {
        success: false,
        error: 'Veuillez renseigner votre adresse email et votre mot de passe.',
      };
    }

    try {
      // 1. Vérification stricte en direct dans la base de données Supabase
      const dbUser = await fetchDatabaseUserByEmail(cleanEmail);

      if (!dbUser) {
        await recordConnectionLog({
          userId: 'unknown',
          userName: 'Inconnu',
          userEmail: cleanEmail,
          authMethod: 'password',
          status: 'failed',
          details: 'Tentative de connexion : Utilisateur inexistant en base de données',
        }).catch(() => {});

        return {
          success: false,
          error: `Aucun compte utilisateur avec l'adresse "${cleanEmail}" n'a été trouvé dans la base de données.`,
        };
      }

      // 2. Contrôle du statut du compte et situation contractuelle
      if (dbUser.status !== 'actif') {
        let errorMsg = `Ce compte (${dbUser.email}) est actuellement désactivé. Veuillez contacter un administrateur.`;
        if (dbUser.employmentStatus === 'renvoye') {
          errorMsg = `Connexion refusée : Le collaborateur associé à "${cleanEmail}" est marqué comme renvoyé / licencié.`;
        } else if (dbUser.employmentStatus === 'demissionne') {
          errorMsg = `Connexion refusée : Le collaborateur associé à "${cleanEmail}" a démissionné de l'entreprise.`;
        } else if (dbUser.employmentStatus === 'parti') {
          errorMsg = `Connexion refusée : Le collaborateur associé à "${cleanEmail}" a quitté l'entreprise.`;
        } else if (dbUser.employmentStatus === 'suspendu') {
          errorMsg = `Connexion refusée : Ce compte est actuellement suspendu par la direction.`;
        }

        await recordConnectionLog({
          userId: dbUser.id,
          userName: dbUser.name,
          userEmail: dbUser.email,
          authMethod: 'password',
          status: 'failed',
          details: `Tentative de connexion refusée : ${errorMsg}`,
        }).catch(() => {});

        return {
          success: false,
          error: errorMsg,
        };
      }

      // 3. Vérification du mot de passe
      let passwordValid = false;

      // A) Tentative via Supabase Auth
      try {
        const supaResult = await Promise.race([
          supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPassword,
          }),
          new Promise<{ data: any; error: any }>((resolve) =>
            setTimeout(() => resolve({ data: null, error: { message: 'timeout' } }), 3500)
          ),
        ]);
        if (supaResult?.data?.user && !supaResult.error) {
          passwordValid = true;
        }
      } catch {
        // En cas d'indisponibilité du service Auth distant, passage à la vérification PBKDF2 en BD
      }

      // B) Vérification via l'empreinte PBKDF2 ou le hash enregistré en base
      if (!passwordValid && dbUser.passwordHash) {
        if (dbUser.passwordHash === cleanPassword) {
          passwordValid = true;
        } else {
          const verifyResult = await verifyPassword(cleanPassword, dbUser.passwordHash);
          passwordValid = verifyResult.valid;
        }
      }

      if (!passwordValid) {
        await recordConnectionLog({
          userId: dbUser.id,
          userName: dbUser.name,
          userEmail: dbUser.email,
          authMethod: 'password',
          status: 'failed',
          details: 'Échec de connexion : Mot de passe erroné',
        }).catch(() => {});

        return {
          success: false,
          error: `Mot de passe incorrect pour ${cleanEmail}.`,
        };
      }

      // 4. Succès de la connexion
      const finalUser: AppUser = {
        ...dbUser,
        lastLoginAt: new Date().toISOString(),
      };

      await storeSecureSession(finalUser);

      await recordConnectionLog({
        userId: finalUser.id,
        userName: finalUser.name,
        userEmail: finalUser.email,
        authMethod: 'password',
        status: 'success',
        details: `Connexion sécurisée réussie (Rôle : ${finalUser.role})`,
      }).catch(() => {});

      return {
        success: true,
        user: finalUser,
      };
    } catch (err: any) {
      console.error('[authService.login] Erreur inattendue:', err);
      return {
        success: false,
        error: 'Une erreur technique est survenue lors de la tentative de connexion.',
      };
    }
  },

  /**
   * Déconnexion sécurisée
   */
  async logout(): Promise<void> {
    clearSecureSession();
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.includes('sb-') || key.includes('auth-token') || key.includes('supabase'))) {
          localStorage.removeItem(key);
        }
      }
    } catch {}
  },

  /**
   * Valide la session active par rapport à la base de données
   */
  async validateCurrentSession(): Promise<AppUser | null> {
    const session = await loadSecureSession();
    if (!session || !session.email) {
      clearSecureSession();
      return null;
    }

    const dbUser = await fetchDatabaseUserByEmail(session.email);
    if (!dbUser || dbUser.status !== 'actif') {
      clearSecureSession();
      return null;
    }

    return dbUser;
  },
};
