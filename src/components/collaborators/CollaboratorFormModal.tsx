import React from 'react';
import { Pencil, RefreshCw, X } from 'lucide-react';
import { AppUser, Employee } from '../../types';
import { CollaboratorFormData } from './collaboratorConstants';
import { CollaboratorFormWorkSection } from './CollaboratorFormWorkSection';
import { CollaboratorFormAccountSection } from './CollaboratorFormAccountSection';

interface CollaboratorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingEmployee: Employee | null;
  formData: CollaboratorFormData;
  setFormData: React.Dispatch<React.SetStateAction<CollaboratorFormData>>;
  employees: Employee[];
  users: AppUser[];
  isSaving: boolean;
  onOpenAvatarPicker: () => void;
}

export const CollaboratorFormModal: React.FC<CollaboratorFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingEmployee,
  formData,
  setFormData,
  employees,
  users,
  isSaving,
  onOpenAvatarPicker,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-[#2A7B76]" />
            <h3 className="font-serif font-bold text-base text-stone-900">
              {editingEmployee ? 'Modifier la Fiche Collaborateur' : 'Créer une Fiche Collaborateur'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-[10px] uppercase font-bold text-stone-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-stone-500">Nom complet *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800 text-xs font-medium uppercase"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-stone-500">Nature du Rôle / Métier *</label>
              <select
                value={formData.roleType}
                onChange={(e) => setFormData({ ...formData, roleType: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800 text-xs font-semibold"
              >
                <option value="employé">Employé</option>
                <option value="gestionnaire de projet">Gestionnaire de Projet</option>
                <option value="stagiaire">Stagiaire</option>
                <option value="informaticien">Informaticien / IT</option>
                <option value="comptable">Comptable</option>
                <option value="rh">RH</option>
                <option value="finance">Finance</option>
              </select>
            </div>
          </div>

          <CollaboratorFormWorkSection
            editingEmployee={editingEmployee}
            formData={formData}
            setFormData={setFormData}
            employees={employees}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-stone-500">Adresse E-mail</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800 text-xs font-medium lowercase"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-stone-500">Téléphone (WhatsApp)</label>
              <input
                type="text"
                placeholder="+237 655500443"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800 text-xs font-mono font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1.5 text-stone-500">Date d&apos;arrivée</label>
              <input
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800 text-xs font-mono font-medium"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-stone-500">Date d&apos;anniversaire</label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800 text-xs font-mono font-medium"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-stone-500">Salaire Mensuel Brut (XAF)</label>
              <input
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border bg-amber-50/50 border-amber-200/80 space-y-2 normal-case">
            <h4 className="font-bold text-stone-900 text-xs">Dérogations d&apos;assiduité spéciales :</h4>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-800 text-xs">
              <input
                type="checkbox"
                checked={formData.allowLateArrival8_930}
                onChange={(e) => setFormData({ ...formData, allowLateArrival8_930: e.target.checked })}
                className="rounded border-stone-300 text-[#2A7B76] focus:ring-[#2A7B76] h-4 w-4"
              />
              <span>Autoriser l&apos;arrivée entre 08:00 et 09:30 sans création de retard</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-800 text-xs">
              <input
                type="checkbox"
                checked={formData.allowEarlyDeparture15_17}
                onChange={(e) => setFormData({ ...formData, allowEarlyDeparture15_17: e.target.checked })}
                className="rounded border-stone-300 text-[#2A7B76] focus:ring-[#2A7B76] h-4 w-4"
              />
              <span>Autoriser le départ entre 15:00 et 17:00 sans création de sortie prématurée</span>
            </label>
          </div>

          <CollaboratorFormAccountSection
            editingEmployee={editingEmployee}
            formData={formData}
            setFormData={setFormData}
            users={users}
            onOpenAvatarPicker={onOpenAvatarPicker}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100 normal-case">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-[#2A7B76] text-white hover:bg-[#20635F] disabled:opacity-50 font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
            >
              {isSaving && <RefreshCw className="h-4 w-4 animate-spin" />}
              <span>
                {isSaving
                  ? 'Enregistrement transactionnel...'
                  : editingEmployee
                  ? 'Enregistrer les Modifications'
                  : 'Créer le Collaborateur & Lier le Compte'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
