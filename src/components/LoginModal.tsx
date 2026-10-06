import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, ArrowRight, UserCheck, Eye, EyeOff, Shield, KeyRound } from 'lucide-react';
import { AppUser } from '../types';
import { findUserByEmail, saveUser, INITIAL_DEFAULT_USERS } from '../services/userService';
import { recordConnectionLog } from '../services/connectionLogService';
import { verifyPassword } from '../utils/cryptoUtils';
import { HeroCabLogo } from './CMLogo';

interface LoginModalProps {
  users: AppUser[];
  onLoginSuccess: (user: AppUser) => void;
  onAddNotification: (notif: any) => void;
}

export default function LoginModal({
  users,
  onLoginSuccess,
  onAddNotification,
}: LoginModalProps) {
  const [email, setEmail] = useState('citrinemobilite@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const availableUsers = users && users.length > 0 ? users : INITIAL_DEFAULT_USERS;

  // Handle Email + Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Veuillez renseigner votre adresse email et votre mot de passe.');
      return;
    }

    setLoading(true);

    const user = findUserByEmail(availableUsers, cleanEmail);

    if (!user) {
      setError('Aucun compte associé à cette adresse email.');
      setLoading(false);
      return;
    }

    if (user.status !== 'actif') {
      setError('Ce compte est désactivé.');
      recordConnectionLog({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        authMethod: 'password',
        status: 'failed',
        details: 'Tentative de connexion refusée : Compte désactivé'
      });
      setLoading(false);
      return;
    }

    const storedPass = user.passwordHash || 'Citrine Management2026!';
    const verifyResult = await verifyPassword(cleanPassword, storedPass);

    // Mots de passe valides par défaut pour accès administrateur / utilisateur
    const isDefaultMatch =
      cleanPassword === 'admin123' ||
      cleanPassword === 'Citrine Management2026!' ||
      cleanPassword === 'admin' ||
      cleanPassword.toLowerCase() === 'citrine';

    if (!verifyResult.valid && !isDefaultMatch) {
      setError('Mot de passe incorrect. Le mot de passe par défaut est admin123 ou Citrine Management2026!');
      recordConnectionLog({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        authMethod: 'password',
        status: 'failed',
        details: 'Échec de connexion : Mot de passe erroné'
      });
      setLoading(false);
      return;
    }

    // Migration automatique du hash PBKDF2 sécurisé si nécessaire
    let finalUser = { ...user };
    if (verifyResult.needsMigration && verifyResult.newHash) {
      finalUser.passwordHash = verifyResult.newHash;
      await saveUser(finalUser);
    }

    recordConnectionLog({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      authMethod: 'password',
      status: 'success',
      details: `Connexion sécurisée réussie (Rôle : ${user.role})`
    });

    setLoading(false);
    onLoginSuccess({
      ...finalUser,
      lastLoginAt: new Date().toISOString()
    });

    onAddNotification({
      id: 'notif-login-' + Date.now(),
      type: 'email',
      recipient: user.email,
      title: 'Connexion réussie',
      content: `Connexion établie pour ${user.name} (${user.role}).`,
      timestamp: new Date().toISOString()
    });
  };

  const handleSelectAccount = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setPassword('admin123');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 overflow-y-auto" id="login-modal-overlay">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden" id="login-card">
        
        {/* Header - Logo Hero uniquement */}
        <div className="p-6 text-center border-b border-stone-100 flex flex-col items-center justify-center">
          <HeroCabLogo size="xl" showSubtitle={true} className="mb-2" />
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Citrine Management</h1>
        </div>

        {/* Formulaire Connexion Email & Mot de Passe */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-xl space-y-2 text-xs text-red-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            {/* Champ Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                Adresse Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="citrinemobilite@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:border-emerald-600 outline-none transition font-medium"
                />
              </div>
            </div>

            {/* Champ Mot de Passe avec bouton Afficher/Masquer */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                  Mot de Passe
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-stone-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer font-medium"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>Masquer</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span>Afficher</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:border-emerald-600 outline-none transition font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Bouton de Soumission */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  <span>Se connecter</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
