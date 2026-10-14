import React, { useState } from 'react';
import { User, Mail, Building, Smartphone, CheckCircle2, Sparkles } from 'lucide-react';
import { AppUser } from '../../types';
import { saveUser } from '../../services/userService';
import { saveDocument, COLLECTIONS } from '../../services/dataService';
import { storeSecureSession } from '../../services/sessionService';
import { CollaboratorAvatarPickerModal } from '../collaborators/CollaboratorAvatarPickerModal';
import { generateUuidV4 } from '../../services/employeeService';

interface ProfileInfoSubTabProps {
  currentUser: AppUser;
  onAddNotification: (notif: any) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onUpdateUser?: (updated: AppUser) => void;
}

export const ProfileInfoSubTab: React.FC<ProfileInfoSubTabProps> = ({
  currentUser,
  onAddNotification,
  showToast,
  onUpdateUser,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [department, setDepartment] = useState(currentUser.department || '');
  const [phone, setPhone] = useState(currentUser.phone || '+237 699 00 00 00');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = async (newUrl: string) => {
    setAvatarUrl(newUrl);
    try {
      const updated: AppUser = {
        ...currentUser,
        name: name.trim(),
        department: department.trim(),
        phone: phone.trim(),
        avatarUrl: newUrl.trim(),
      };
      await saveUser(updated);

      try {
        const empItem = {
          id: currentUser.employeeId || currentUser.id || `emp-${Date.now()}`,
          uid: generateUuidV4(),
          name: name.trim(),
          email: currentUser.email,
          roleType: currentUser.role || 'employé',
          department: department.trim(),
          phone: phone.trim(),
          avatarUrl: newUrl.trim(),
          status: 'en_poste',
          employmentStatus: 'en_poste',
          hireDate: new Date().toISOString().split('T')[0],
          salary: 0,
        };
        await saveDocument(COLLECTIONS.EMPLOYEES, empItem);
        window.dispatchEvent(new CustomEvent('citrine:employee_updated', { detail: empItem }));
      } catch (err) {
        console.warn('Could not sync employee record to DB:', err);
      }

      showToast?.("Photo de profil / avatar mis à jour avec succès", 'success');
      onAddNotification({
        id: 'notif-avatar-' + Date.now(),
        type: 'system',
        recipient: currentUser.email,
        title: "Modification de l'avatar",
        content: `La photo de profil / avatar de ${name} a été modifiée avec succès.`,
        timestamp: new Date().toISOString(),
      });
      await storeSecureSession(updated).catch(() => {});
      onUpdateUser?.(updated);
    } catch (err) {
      console.error('Error saving avatar:', err);
      showToast?.("Erreur lors de la mise à jour de l'avatar", 'error');
    }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessInfo(null);
    setError(null);
    setLoading(true);
    try {
      const updated: AppUser = {
        ...currentUser,
        name: name.trim(),
        department: department.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl.trim(),
      };
      await saveUser(updated);

      try {
        const empItem = {
          id: currentUser.employeeId || currentUser.id || `emp-${Date.now()}`,
          uid: generateUuidV4(),
          name: name.trim(),
          email: currentUser.email,
          roleType: currentUser.role || 'employé',
          department: department.trim(),
          phone: phone.trim(),
          avatarUrl: avatarUrl.trim(),
          status: 'en_poste',
          employmentStatus: 'en_poste',
          hireDate: new Date().toISOString().split('T')[0],
          salary: 0,
        };
        await saveDocument(COLLECTIONS.EMPLOYEES, empItem);
        window.dispatchEvent(new CustomEvent('citrine:employee_updated', { detail: empItem }));
      } catch (err) {
        console.warn('Could not sync employee record to DB:', err);
      }

      setSuccessInfo('Informations personnelles et photo de profil mises à jour avec succès.');
      showToast?.('Profil mis à jour avec succès', 'success');
      onAddNotification({
        id: 'notif-prof-' + Date.now(),
        type: 'system',
        recipient: currentUser.email,
        title: 'Mise à jour du profil',
        content: `Le profil de ${name} a été mis à jour.`,
        timestamp: new Date().toISOString(),
      });
      await storeSecureSession(updated).catch(() => {});
      onUpdateUser?.(updated);
    } catch {
      setError('Erreur lors de l’enregistrement des modifications.');
      showToast?.('Erreur lors de la mise à jour du profil', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-6 h-6 text-indigo-600" />
              Mon Profil Utilisateur & Collaborateur
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Gérez vos informations personnelles et votre avatar officiel.
            </p>
          </div>
          <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold text-xs rounded-full uppercase tracking-wider">
            {currentUser.role}
          </span>
        </div>

        {successInfo && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successInfo}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8 items-start mb-8 pb-8 border-b border-slate-100 dark:border-slate-700">
          <div className="relative group mx-auto md:mx-0">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-3xl shadow-inner border-4 border-white dark:border-slate-700">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                name ? name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsAvatarPickerOpen(true)}
              className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center"
              title="Changer l'avatar"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 space-y-2 text-center md:text-left">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center md:justify-start gap-1.5">
              <Mail className="w-4 h-4" /> {currentUser.email}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center md:justify-start gap-1.5">
              <Building className="w-4 h-4" /> {department || 'Direction Générale'}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsAvatarPickerOpen(true)}
                className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-medium rounded-xl transition-colors"
              >
                Choisir un avatar ou une photo
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveInfo} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Nom complet
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Votre nom complet"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Département / Service
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Ex: Direction Générale, RH, Technique"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Numéro de téléphone
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Smartphone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="+237 600 00 00 00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Email professionnel (Lecture seule)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-colors disabled:opacity-50 text-sm flex items-center gap-2"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>

      {isAvatarPickerOpen && (
        <CollaboratorAvatarPickerModal
          isOpen={isAvatarPickerOpen}
          currentAvatarUrl={avatarUrl}
          collaboratorName={name}
          onSelectAvatar={(url) => {
            setIsAvatarPickerOpen(false);
            handleAvatarChange(url);
          }}
          onClose={() => setIsAvatarPickerOpen(false)}
        />
      )}
    </div>
  );
};
