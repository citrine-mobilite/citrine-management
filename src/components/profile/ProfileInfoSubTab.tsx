import React, { useState } from 'react';
import { User, Mail, Building, Smartphone, CheckCircle2, Shield } from 'lucide-react';
import { AppUser } from '../../types';
import { saveUser } from '../../services/userService';

interface ProfileInfoSubTabProps {
  currentUser: AppUser;
  onAddNotification: (notif: any) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProfileInfoSubTab: React.FC<ProfileInfoSubTabProps> = ({
  currentUser,
  onAddNotification,
  showToast,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [department, setDepartment] = useState(currentUser.department || '');
  const [phone, setPhone] = useState(currentUser.phone || '+237 699 00 00 00');
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        timestamp: new Date().toISOString(),
      });
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
    </form>
  );
};
