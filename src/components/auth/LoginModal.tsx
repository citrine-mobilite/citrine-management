import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, ArrowRight, UserCheck, Eye, EyeOff, Shield } from 'lucide-react';
import { AppUser } from '../../types';
import { authService } from '../../services/auth/authService';
import { HeroCabLogo } from '../CMLogo';

export interface LoginModalProps {
  users?: AppUser[];
  onLoginSuccess: (user: AppUser) => void;
  onAddNotification?: (notif: any) => void;
}

export function LoginModal({
  onLoginSuccess,
  onAddNotification,
}: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authService.login(email, password);

      if (!result.success || !result.user) {
        setError(result.error || 'Identifiants incorrects.');
        setLoading(false);
        return;
      }

      if (onAddNotification) {
        onAddNotification({
          id: 'notif-login-' + Date.now(),
          type: 'email',
          recipient: result.user.email,
          title: 'Connexion réussie',
          content: `Connexion établie pour ${result.user.name} (${result.user.role}).`,
          timestamp: new Date().toISOString(),
        });
      }

      setLoading(false);
      onLoginSuccess(result.user);
    } catch (err: any) {
      console.error('[LoginModal] Erreur:', err);
      setError('Une erreur est survenue lors de la tentative de connexion.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 overflow-y-auto" id="login-modal-overlay">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden" id="login-card">
        
        {/* Header Institutionnel */}
        <div className="p-6 text-center border-b border-stone-100 flex flex-col items-center justify-center">
          <HeroCabLogo size="xl" showSubtitle={true} className="mb-2" />
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Citrine Management</h1>
          <p className="text-xs text-stone-500 mt-1">Portail d'authentification sécurisé d'entreprise</p>
        </div>

        {/* Formulaire Connexion */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-xl space-y-2 text-xs text-red-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Champ Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                Adresse Email Professionnelle
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@entreprise.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:border-emerald-600 outline-none transition font-medium"
                />
              </div>
            </div>

            {/* Champ Mot de Passe */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                Mot de Passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
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

          {/* Mentions de sécurité */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-center gap-2 text-[10px] text-stone-600">
            <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Accès sécurisé réservé aux collaborateurs Citrine SARL</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default LoginModal;
