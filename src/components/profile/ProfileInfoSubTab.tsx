import React, { useState } from 'react';
import { User, Mail, Building, Smartphone, CheckCircle2, Sparkles } from 'lucide-react';
import { AppUser } from '../../types';
import { saveUser } from '../../services/userService';
import { saveDocument, COLLECTIONS } from '../../services/dataService';
import { storeSecureSession } from '../../services/sessionService';
import { CollaboratorAvatarPickerModal } from '../collaborators/CollaboratorAvatarPickerModal';

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
        const savedEmps = localStorage.getItem('citrine_employees');
        let emps = savedEmps ? JSON.parse(savedEmps) : [];
        if (!Array.isArray(emps)) emps = [];
        
        const idx = emps.findIndex((e: any) => 
          (e.email && e.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase()) ||
          e.id === currentUser.id ||
          e.name === currentUser.name
        );

        if (idx >= 0) {
          emps[idx] = {
            ...emps[idx],
            avatarUrl: newUrl.trim(),
          };
          localStorage.setItem('citrine_employees', JSON.stringify(emps));
          await saveDocument(COLLECTIONS.EMPLOYEES, emps[idx]).catch(() => {});
        } else {
          const newEmp = {
            id: currentUser.id || `emp-${Date.now()}`,
            name: name.trim(),
            email: currentUser.email,
            roleType: currentUser.role || 'employé',
            department: department.trim(),
            phone: phone.trim(),
            avatarUrl: newUrl.trim(),
            status: 'en_poste',
            hireDate: new Date().toISOString().split('T')[0],
            salary: 0,
          };
          emps.push(newEmp);
          localStorage.setItem('citrine_employees', JSON.stringify(emps));
          await saveDocument(COLLECTIONS.EMPLOYEES, newEmp).catch(() => {});
        }

        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('citrine:employee_updated'));
      } catch (err) {
        console.warn('Could not sync employee record:', err);
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

      // Also sync employee record in citrine_employees and Supabase employees collection
      try {
        const savedEmps = localStorage.getItem('citrine_employees');
        let emps = savedEmps ? JSON.parse(savedEmps) : [];
        if (!Array.isArray(emps)) emps = [];
        
        const idx = emps.findIndex((e: any) => 
          (e.email && e.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase()) ||
          e.id === currentUser.id ||
          e.name === currentUser.name
        );

        if (idx >= 0) {
          emps[idx] = {
            ...emps[idx],
            name: name.trim(),
            department: department.trim(),
            phone: phone.trim(),
            avatarUrl: avatarUrl.trim(),
          };
          localStorage.setItem('citrine_employees', JSON.stringify(emps));
          await saveDocument(COLLECTIONS.EMPLOYEES, emps[idx]).catch(() => {});
        } else {
          const newEmp = {
            id: currentUser.id || `emp-${Date.now()}`,
            name: name.trim(),
            email: currentUser.email,
            roleType: currentUser.role || 'employé',
            department: department.trim(),
            phone: phone.trim(),
            avatarUrl: avatarUrl.trim(),
            status: 'en_poste',
            hireDate: new Date().toISOString().split('T')[0],
            salary: 0,
          };
          emps.push(newEmp);
          localStorage.setItem('citrine_employees', JSON.stringify(emps));
          await saveDocument(COLLECTIONS.EMPLOYEES, newEmp).catch(() => {});
        }

        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('citrine:employee_updated'));
      } catch (err) {
        console.warn('Could not sync employee record:', err);
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
      setError('Erreur lors de la mise à jour.');
      showToast?.('Erreur lors de la mise à jour', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSaveInfo} className="space-y-4 max-w-xl">
      {successInfo && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successInfo}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-2xl">
          {error}
        </div>
      )}

      {/* Avatar / Photo de profil section */}
      <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-200">
        <div className="relative group shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-[#2A7B76]/15 text-[#2A7B76] font-bold text-lg flex items-center justify-center overflow-hidden border-2 border-stone-200 shadow-xs">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span>{name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsAvatarPickerOpen(true)}
            className="absolute -bottom-1 -right-1 bg-[#2A7B76] text-white p-1.5 rounded-xl shadow-md hover:bg-[#20615d] transition cursor-pointer"
            title="Changer de photo ou d'avatar"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
        <div>
          <h4 className="font-bold text-stone-900 text-xs">Photo de Profil & Avatar</h4>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Choisissez une vraie photo (compressée automatiquement &lt; 350 Ko) ou un avatar stylé.
          </p>
          <button
            type="button"
            onClick={() => setIsAvatarPickerOpen(true)}
            className="mt-2.5 px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 text-[#2A7B76] font-bold text-xs rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modifier ma photo / mon avatar</span>
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-stone-700 block mb-1">Nom complet</label>
        <div className="relative">
          <User className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-[#2A7B76] focus:bg-white transition"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-stone-700 block mb-1">Adresse Email</label>
        <div className="relative">
          <Mail className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            value={currentUser.email}
            disabled
            className="w-full pl-9 pr-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-xs font-medium text-stone-500 cursor-not-allowed"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-stone-700 block mb-1">Département</label>
          <div className="relative">
            <Building className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Ex: Direction, Technique..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-[#2A7B76] focus:bg-white transition"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-stone-700 block mb-1">Téléphone WhatsApp</label>
          <div className="relative">
            <Smartphone className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+237 ..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-[#2A7B76] focus:bg-white transition"
            />
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>

      {/* Avatar Picker Modal */}
      <CollaboratorAvatarPickerModal
        isOpen={isAvatarPickerOpen}
        onClose={() => setIsAvatarPickerOpen(false)}
        currentAvatarUrl={avatarUrl}
        collaboratorName={name}
        onSelectAvatar={(url) => {
          handleAvatarChange(url);
        }}
        showToast={showToast}
      />
    </form>
  );
};
