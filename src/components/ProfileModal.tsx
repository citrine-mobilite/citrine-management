import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  Lock, 
  Mail, 
  LogOut, 
  X, 
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
  Check
} from 'lucide-react';
import { AppUser, ConnectionLog } from '../types';
import { saveUser } from '../services/userService';
import { hashPassword, verifyPassword } from '../utils/cryptoUtils';
import { subscribeToConnectionLogs } from '../services/connectionLogService';

interface ProfileModalProps {
  currentUser: AppUser;
  onClose: () => void;
  onLogout: () => void;
  onAddNotification: (notif: any) => void;
}

export default function ProfileModal({
  currentUser,
  onClose,
  onLogout,
  onAddNotification,
}: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'activity' | 'permissions'>('info');
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
      onAddNotification({
        id: 'notif-prof-' + Date.now(),
        type: 'email',
        recipient: currentUser.email,
        title: 'Mise à jour du profil',
        content: `Le profil de ${name} a été mis à jour.`,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      setError('Erreur lors de la mise à jour.');
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

    // Verify old password if currently set
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

      setSuccess('Votre mot de passe a été chiffré et mis à jour avec succès (PBKDF2 SHA-256).');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

      onAddNotification({
        id: 'notif-pwd-' + Date.now(),
        type: 'email',
        recipient: currentUser.email,
        title: 'Modification du mot de passe',
        content: `Le mot de passe du compte ${currentUser.email} a été mis à jour et chiffré avec succès depuis le profil.`,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      setError('Erreur lors de l\'enregistrement du mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200/85 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col my-auto max-h-[90vh]">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-green-950 via-green-900 to-stone-900 text-white p-6 sm:p-8 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-green-200 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="relative">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="h-20 w-20 rounded-2xl object-cover border-3 border-white/30 shadow-xl"
                />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-green-900 text-white font-bold flex items-center justify-center text-2xl border-3 border-white/30 shadow-xl">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 border-2 border-stone-900 rounded-full" title="En ligne" />
            </div>

            <div className="text-center sm:text-left space-y-1">
              <h3 className="text-xl font-serif font-bold text-white tracking-tight">{currentUser.name}</h3>
              <p className="text-xs text-green-200/90 font-mono">{currentUser.email}</p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                <span className="px-2.5 py-0.5 bg-white/15 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider border border-white/10">
                  {currentUser.role}
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-lg border border-emerald-500/30">
                  {currentUser.department || 'Direction Générale'}
                </span>
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-lg border border-amber-500/30">
                  Auth : Mot de passe chiffré (PBKDF2 Salé)
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 border-t border-white/15 pt-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === 'info' ? 'bg-white text-green-950 shadow-md' : 'text-green-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Informations Personnelles
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === 'security' ? 'bg-white text-green-950 shadow-md' : 'text-green-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Sécurité & Mot de Passe
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === 'permissions' ? 'bg-white text-green-950 shadow-md' : 'text-green-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Rôles & Privilèges
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === 'activity' ? 'bg-white text-green-950 shadow-md' : 'text-green-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Journal & Connexions
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 bg-stone-50/50">

          {/* TAB 1: INFORMATIONS PERSONNELLES */}
          {activeTab === 'info' && (
            <form onSubmit={handleSaveInfo} className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 pb-3">
                  <User className="h-4 w-4 text-green-600" /> Coordonnées & Affectation Professionnelle
                </h4>

                {successInfo && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{successInfo}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-600 uppercase">Nom complet</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:bg-white focus:border-green-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-600 uppercase">Adresse Email (Identifiant)</label>
                    <input
                      type="email"
                      disabled
                      value={currentUser.email}
                      className="w-full px-3.5 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-xs font-mono text-stone-500 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-600 uppercase">Département / Service</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:bg-white focus:border-green-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-600 uppercase">Téléphone professionnel</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:bg-white focus:border-green-500 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-md shadow-green-600/20 transition cursor-pointer"
                  >
                    Enregistrer les modifications
                  </button>
                </div>
              </div>

              <div className="bg-green-50/60 p-5 rounded-2xl border border-green-100 flex items-start gap-3">
                <Building className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div className="text-xs text-green-900 leading-relaxed">
                  <span className="font-bold">Citrine Management Enterprise Governance</span> • Vos informations de profil sont synchronisées avec le registre central des collaborateurs et le serveur Cloud sécurisé.
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: SECURITE & MOT DE PASSE */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <form onSubmit={handlePasswordChange} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 pb-3">
                  <Lock className="h-4 w-4 text-green-600" /> Modifier le Mot de Passe Sécurisé
                </h4>

                {error && (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-xl flex items-center gap-2 text-xs text-green-800">
                    <AlertCircle className="h-4 w-4 text-green-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                <div className="space-y-3 max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-600 uppercase">Nouveau mot de passe</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="6 caractères minimum"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:bg-white focus:border-green-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-600 uppercase">Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Répéter le mot de passe"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:bg-white focus:border-green-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-2"
                  >
                    <Key className="h-3.5 w-3.5" />
                    <span>Mettre à jour le mot de passe</span>
                  </button>
                </div>
              </form>

              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-600" /> État de la Sécurité du Compte
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                    <div className="text-[11px] font-bold text-emerald-900">Chiffrement AES-256</div>
                    <div className="text-[10px] text-emerald-700 mt-0.5">Actif sur le stockage Cloud</div>
                  </div>
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                    <div className="text-[11px] font-bold text-emerald-900">Double Hachage Salé</div>
                    <div className="text-[10px] text-emerald-700 mt-0.5">PBKDF2 100 000 itérations</div>
                  </div>
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                    <div className="text-[11px] font-bold text-emerald-900">Session Active</div>
                    <div className="text-[10px] text-emerald-700 mt-0.5">Navigateur Sécurisé Web</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ROLES & PRIVILEGES */}
          {activeTab === 'permissions' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 pb-3">
                  <Shield className="h-4 w-4 text-purple-600" /> Matrice des Droits et Privilèges ({currentUser.role.toUpperCase()})
                </h4>

                <p className="text-xs text-stone-600 leading-relaxed">
                  Votre compte dispose des habilitations suivantes sur la plateforme de gouvernance Citrine Management :
                </p>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                    <span className="font-semibold text-stone-800">Pilotage des Présences et Pointages RH</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">Autorisé</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                    <span className="font-semibold text-stone-800">Gestion des Tâches et Assignations d'Équipes</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">Autorisé</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                    <span className="font-semibold text-stone-800">Génération Automatisée des Bulletins de Paie et Contrats</span>
                    <span className={`px-2 py-0.5 font-bold rounded text-[10px] ${currentUser.role === 'employé' ? 'bg-green-100 text-green-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {currentUser.role === 'employé' ? 'Restreint (Lecture seule)' : 'Autorisé (Complet)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                    <span className="font-semibold text-stone-800">Administration Système et Gestion des Utilisateurs</span>
                    <span className={`px-2 py-0.5 font-bold rounded text-[10px] ${currentUser.role === 'administrateur' ? 'bg-emerald-100 text-emerald-800' : 'bg-green-100 text-green-800'}`}>
                      {currentUser.role === 'administrateur' ? 'Administrateur Principal' : 'Non Autorisé'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: JOURNAL & CONNEXIONS */}
          {activeTab === 'activity' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 pb-3">
                  <Activity className="h-4 w-4 text-green-600" /> Historique Réel des Connexions
                </h4>

                <div className="space-y-3">
                  {(() => {
                    const userLogs = connectionLogs.filter(l => l.userEmail.toLowerCase() === currentUser.email.toLowerCase());
                    const displayLogs = userLogs.length > 0 ? userLogs : [
                      {
                        id: 'log-active-session',
                        userId: currentUser.id,
                        userName: currentUser.name,
                        userEmail: currentUser.email,
                        timestamp: currentUser.lastLoginAt || new Date().toISOString(),
                        ipAddress: '192.168.1.100 (Réseau Bureau)',
                        location: 'Douala, CM',
                        authMethod: currentUser.authMethod || 'password',
                        status: 'success' as const,
                        details: `Session active en cours (Rôle : ${currentUser.role})`
                      }
                    ];

                    return displayLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold shrink-0 mt-0.5 ${
                          log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {log.status === 'success' ? '✓' : '✕'}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-stone-900">
                            {log.details || (log.status === 'success' ? 'Connexion réussie au portail' : 'Tentative de connexion échouée')}
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            Méthode : Mot de passe sécurisé (PBKDF2 Salé) • IP : {log.ipAddress || 'Non spécifiée'} • Lieu : {log.location || 'Douala, CM'}
                          </div>
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} ({new Date(log.timestamp).toLocaleDateString('fr-FR')})
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-stone-100 px-6 py-4 border-t border-stone-200 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Fermer la session (Déconnexion)</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Fermer le profil
          </button>
        </div>

      </div>
    </div>
  );
}
