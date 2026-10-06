import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  Lock, 
  Mail, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  Key,
  Clock,
  Building,
  Smartphone,
  Globe,
  Activity,
  FileText,
  Bell,
  Check,
  ArrowLeft,
  UserCheck
} from 'lucide-react';
import { AppUser, ConnectionLog } from '../types';
import { saveUser } from '../services/userService';
import { hashPassword, verifyPassword } from '../utils/cryptoUtils';
import { subscribeToConnectionLogs } from '../services/connectionLogService';

interface ProfilePageProps {
  currentUser: AppUser;
  onBackToDashboard: () => void;
  onLogout: () => void;
  onAddNotification: (notif: any) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ProfilePage({
  currentUser,
  onBackToDashboard,
  onLogout,
  onAddNotification,
  showToast
}: ProfilePageProps) {
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'security' | 'activity' | 'permissions'>('info');
  const [connectionLogs, setConnectionLogs] = useState<ConnectionLog[]>([]);

  useEffect(() => {
    const unsub = subscribeToConnectionLogs((logs) => {
      setConnectionLogs(logs);
    });
    return () => unsub();
  }, []);

  const [name, setName] = useState(currentUser.name);
  const [department, setDepartment] = useState(currentUser.department || '');
  const [phone, setPhone] = useState(currentUser.phone || '+237 699 00 00 00');
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessInfo(null);
    try {
      const updated: AppUser = {
        ...currentUser,
        name: name.trim(),
        department: department.trim(),
        phone: phone.trim()
      };
      await saveUser(updated);
      setSuccessInfo('Informations personnelles mises à jour avec succès.');
      showToast?.('Profil mis à jour avec succès', 'success');
      onAddNotification({
        id: 'notif-prof-' + Date.now(),
        type: 'system',
        recipient: currentUser.email,
        title: 'Mise à jour du profil',
        content: `Le profil de ${name} a été mis à jour.`,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      setError('Erreur lors de la mise à jour.');
      showToast?.('Erreur lors de la mise à jour', 'error');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs de mot de passe.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (currentUser.passwordHash) {
      if (!oldPassword) {
        setError('Veuillez saisir votre mot de passe actuel.');
        return;
      }
      const verifyRes = await verifyPassword(oldPassword, currentUser.passwordHash);
      if (!verifyRes.valid) {
        setError('Ancien mot de passe incorrect.');
        return;
      }
    }

    setLoading(true);
    try {
      const hashed = await hashPassword(newPassword);
      const updatedUser: AppUser = {
        ...currentUser,
        passwordHash: hashed
      };
      await saveUser(updatedUser);

      setSuccess('Votre mot de passe a été chiffré et mis à jour avec succès.');
      showToast?.('Mot de passe mis à jour avec succès', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

      onAddNotification({
        id: 'notif-pwd-' + Date.now(),
        type: 'system',
        recipient: currentUser.email,
        title: 'Modification du mot de passe',
        content: `Le mot de passe du compte ${currentUser.email} a été mis à jour et chiffré avec succès.`,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      setError('Erreur lors de l\'enregistrement du mot de passe.');
      showToast?.('Erreur lors de la mise à jour du mot de passe', 'error');
    } finally {
      setLoading(false);
    }
  };

  const userLogs = connectionLogs.filter(
    (l) => l.userId === currentUser.id || (l.userEmail && l.userEmail.toLowerCase() === currentUser.email.toLowerCase())
  ).slice(0, 15);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumbs & Back Button */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 px-3.5 py-2 rounded-xl shadow-2xs transition cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Retour au Tableau de Bord</span>
        </button>

        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3.5 py-2 rounded-xl transition cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Déconnexion</span>
        </button>
      </div>

      {/* Main Profile Header Banner - Clean Light Design */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          <div className="relative">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="h-20 w-20 rounded-2xl object-cover border-2 border-stone-200 shadow-sm"
              />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center text-2xl shadow-sm">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 border-2 border-white rounded-full" title="En ligne" />
          </div>

          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight">{currentUser.name}</h1>
                <p className="text-xs text-stone-500 font-mono mt-0.5">{currentUser.email}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 uppercase tracking-wide">
                  {currentUser.role}
                </span>
                <span className="px-3 py-1 bg-stone-100 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200">
                  {currentUser.department || 'Opérations'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs text-stone-500">
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-emerald-600" />
                Auth : Mot de passe sécurisé (PBKDF2 Salé)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-stone-400" />
                Dernière session : {new Date().toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-stone-100 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('info')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeSubTab === 'info'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Informations Personnelles
          </button>
          <button
            onClick={() => setActiveSubTab('security')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeSubTab === 'security'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Sécurité & Mot de Passe
          </button>
          <button
            onClick={() => setActiveSubTab('permissions')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeSubTab === 'permissions'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Rôles & Privilèges
          </button>
          <button
            onClick={() => setActiveSubTab('activity')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeSubTab === 'activity'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Journal de Connexions
          </button>
        </div>
      </div>

      {/* Tab 1: Informations Personnelles */}
      {activeSubTab === 'info' && (
        <form onSubmit={handleSaveInfo} className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-600" />
              Coordonnées Professionnelles
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Mettez à jour vos informations de contact et votre rattachement au sein de Citrine Management.
            </p>
          </div>

          {successInfo && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successInfo}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 uppercase">Nom complet</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:bg-white focus:border-emerald-500 outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 uppercase">Adresse Email (Identifiant permanent)</label>
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="w-full px-4 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-xs font-mono text-stone-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 uppercase">Département / Service</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:bg-white focus:border-emerald-500 outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 uppercase">Numéro de téléphone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:bg-white focus:border-emerald-500 outline-none transition font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
            >
              Enregistrer les modifications
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Sécurité & Mot de Passe */}
      {activeSubTab === 'security' && (
        <form onSubmit={handlePasswordChange} className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-600" />
              Modifier mon mot de passe
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Protégez votre compte avec un mot de passe robuste (chiffré selon la norme PBKDF2 SHA-256).
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-4 max-w-md">
            {currentUser.passwordHash && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 uppercase">Mot de passe actuel</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:bg-white focus:border-emerald-500 outline-none transition"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 uppercase">Nouveau mot de passe</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6 caractères minimum"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:bg-white focus:border-emerald-500 outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 uppercase">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:bg-white focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Rôles & Privilèges */}
      {activeSubTab === 'permissions' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              Droits d'Accès et Périmètre de Gestion
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Vos privilèges sont déterminés par votre rôle au sein de Citrine Management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-5 rounded-2xl border ${currentUser.role === 'administrateur' ? 'bg-emerald-50/70 border-emerald-300' : 'bg-stone-50 border-stone-200 opacity-60'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-stone-900">Administrateur</span>
                {currentUser.role === 'administrateur' && <Check className="h-4 w-4 text-emerald-600" />}
              </div>
              <p className="text-[11px] text-stone-600">Accès intégral : gestion des utilisateurs, paramètres généraux, clôtures de paie et configuration système.</p>
            </div>

            <div className={`p-5 rounded-2xl border ${currentUser.role === 'responsable' ? 'bg-emerald-50/70 border-emerald-300' : 'bg-stone-50 border-stone-200 opacity-60'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-stone-900">Responsable / Manager</span>
                {currentUser.role === 'responsable' && <Check className="h-4 w-4 text-emerald-600" />}
              </div>
              <p className="text-[11px] text-stone-600">Supervision d'équipe : validation des pointages, planification des tâches, discipline et communications.</p>
            </div>

            <div className={`p-5 rounded-2xl border ${currentUser.role === 'employé' ? 'bg-emerald-50/70 border-emerald-300' : 'bg-stone-50 border-stone-200 opacity-60'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-stone-900">Collaborateur / Employé</span>
                {currentUser.role === 'employé' && <Check className="h-4 w-4 text-emerald-600" />}
              </div>
              <p className="text-[11px] text-stone-600">Espace personnel : pointage quotidien, consultation des fiches de paie et suivi de mes tâches.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Journal & Connexions */}
      {activeSubTab === 'activity' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              Historique des Connexions Récentes
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Traçabilité et audit de sécurité de vos sessions d'accès.
            </p>
          </div>

          {userLogs.length === 0 ? (
            <p className="text-xs text-stone-500 text-center py-8">Aucune connexion récente enregistrée.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-100 text-stone-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Date & Heure</th>
                    <th className="pb-3">Méthode</th>
                    <th className="pb-3">Statut</th>
                    <th className="pb-3">Appareil / Navigateur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {userLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50 transition">
                      <td className="py-3 font-mono text-stone-700">
                        {new Date(log.timestamp).toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3 capitalize text-stone-700">
                        Mot de passe (PBKDF2 Salé)
                      </td>
                      <td className="py-3">
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                            <CheckCircle2 className="h-3 w-3" /> Réussie
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                            <AlertCircle className="h-3 w-3" /> Échouée
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-stone-500 max-w-xs truncate">
                        {log.userAgent ? log.userAgent.split(' ')[0] : 'Navigateur Web'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
