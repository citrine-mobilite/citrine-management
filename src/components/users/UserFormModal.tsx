import React, { useState } from 'react';
import { X, User, Mail, Lock, Building, Sparkles } from 'lucide-react';
import { AppUser, UserRole, UserStatus } from '../../types';
import { generateStrongPassword } from '../../utils/cryptoUtils';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser: AppUser | null;
  onSave: (data: {
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    department: string;
    password?: string;
  }) => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  editingUser,
  onSave,
}) => {
  const [name, setName] = useState(editingUser?.name || '');
  const [email, setEmail] = useState(editingUser?.email || '');
  const [role, setRole] = useState<UserRole>(editingUser?.role || 'employé');
  const [status, setStatus] = useState<UserStatus>(editingUser?.status || 'actif');
  const [department, setDepartment] = useState(editingUser?.department || '');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, email, role, status, department, password });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 p-4 text-white flex items-center justify-between">
          <h3 className="font-serif font-bold text-sm">
            {editingUser ? 'Modifier le compte utilisateur' : 'Créer un nouvel utilisateur'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="font-bold text-stone-700 block mb-1">Nom complet</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Adresse Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={Boolean(editingUser)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl disabled:bg-stone-100 focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Rôle</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76]"
              >
                <option value="employé">Employé</option>
                <option value="responsable">Responsable</option>
                <option value="administrateur">Administrateur</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76]"
              >
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Département</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Ex: Informatique, Comptabilité, RH..."
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-stone-700">
                {editingUser ? 'Nouveau mot de passe (laisser vide si inchangé)' : 'Mot de passe'}
              </label>
              <button
                type="button"
                onClick={() => setPassword(generateStrongPassword())}
                className="text-[10px] text-[#2A7B76] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <Sparkles className="h-3 w-3" /> Générer
              </button>
            </div>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!editingUser}
              placeholder="Minimum 6 caractères"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76] font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold rounded-xl transition shadow-xs cursor-pointer"
            >
              {editingUser ? 'Sauvegarder' : 'Créer le compte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
