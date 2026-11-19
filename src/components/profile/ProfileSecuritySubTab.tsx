import React, { useState } from 'react';
import { Lock, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppUser } from '../../types';
import { saveUser } from '../../services/userService';
import { hashPassword, verifyPassword } from '../../utils/cryptoUtils';

interface ProfileSecuritySubTabProps {
  currentUser: AppUser;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProfileSecuritySubTab: React.FC<ProfileSecuritySubTabProps> = ({
  currentUser,
  showToast,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs de mot de passe.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      if (currentUser.passwordHash && oldPassword) {
        const isValid = await verifyPassword(oldPassword, currentUser.passwordHash);
        if (!isValid) {
          setError('L’ancien mot de passe est incorrect.');
          setLoading(false);
          return;
        }
      }

      const newHash = await hashPassword(newPassword);
      await saveUser({
        ...currentUser,
        passwordHash: newHash,
      });

      setSuccess('Mot de passe mis à jour avec succès.');
      showToast?.('Mot de passe mis à jour', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Erreur lors du changement de mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePasswordChange} className="space-y-4 max-w-xl">
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {currentUser.passwordHash && (
        <div>
          <label className="text-xs font-bold text-stone-700 block mb-1">
            Mot de passe actuel
          </label>
          <div className="relative">
            <Key className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-[#2A7B76] focus:bg-white transition"
            />
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-bold text-stone-700 block mb-1">
          Nouveau mot de passe
        </label>
        <div className="relative">
          <Lock className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimum 6 caractères"
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-[#2A7B76] focus:bg-white transition"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-stone-700 block mb-1">
          Confirmer le nouveau mot de passe
        </label>
        <div className="relative">
          <Lock className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Retapez le mot de passe"
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-[#2A7B76] focus:bg-white transition"
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Modification...' : 'Modifier mon mot de passe'}
        </button>
      </div>
    </form>
  );
};
