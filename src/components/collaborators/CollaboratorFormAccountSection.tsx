import React from 'react';
import { Camera, KeyRound } from 'lucide-react';
import { AppUser, Employee, UserRole } from '../../types';
import { CollaboratorFormData } from './collaboratorConstants';
import { CollaboratorAccountEditBlock } from './CollaboratorAccountEditBlock';

interface CollaboratorFormAccountSectionProps {
  editingEmployee: Employee | null;
  formData: CollaboratorFormData;
  setFormData: React.Dispatch<React.SetStateAction<CollaboratorFormData>>;
  users: AppUser[];
  onOpenAvatarPicker: () => void;
}

export const CollaboratorFormAccountSection: React.FC<CollaboratorFormAccountSectionProps> = ({
  editingEmployee,
  formData,
  setFormData,
  users,
  onOpenAvatarPicker,
}) => {
  return (
    <>
      {!editingEmployee ? (
        <div className="bg-emerald-50/60 border border-[#2A7B76]/30 rounded-2xl p-4 space-y-3 normal-case">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#2A7B76]" />
            <h4 className="font-serif font-bold text-xs text-stone-900">
              Création obligatoire du Compte Utilisateur & Rôle Système
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                Mot de passe initial de connexion *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.userPassword}
                  onChange={(e) => setFormData({ ...formData, userPassword: e.target.value })}
                  placeholder="Ex: Collab@2026"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-mono font-bold text-stone-800 focus:ring-2 focus:ring-[#2A7B76] outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      userPassword: `Collab@${Math.floor(1000 + Math.random() * 9000)}`,
                    })
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#2A7B76] font-bold hover:underline"
                >
                  Générer
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                Rôle & Niveau d&apos;Accès (Role ID) *
              </label>
              <select
                value={formData.userRole}
                onChange={(e) => {
                  const r = e.target.value as UserRole;
                  const rId = r === 'administrateur' ? 1 : r === 'responsable' ? 2 : 3;
                  setFormData({ ...formData, userRole: r, roleId: rId, roleType: r });
                }}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-800 focus:ring-2 focus:ring-[#2A7B76] outline-none"
              >
                <option value="employé">Employé — Role ID 3 (Portail & Badgeage)</option>
                <option value="responsable">Responsable — Role ID 2 (Gestion & Validation)</option>
                <option value="administrateur">Administrateur — Role ID 1 (Contrôle total)</option>
              </select>
            </div>

            <div className="sm:col-span-2 text-[11px] text-stone-600 bg-white/80 p-2.5 rounded-xl border border-stone-200/80">
              💡 <strong>Liaison automatique :</strong> Le compte utilisateur (email:{' '}
              <strong>{formData.email || 'auto'}</strong>) sera créé avec{' '}
              <strong>User ID (UUID)</strong> et{' '}
              <strong>
                Role ID (
                {formData.userRole === 'administrateur'
                  ? 1
                  : formData.userRole === 'responsable'
                  ? 2
                  : 3}
                )
              </strong>{' '}
              immédiatement rattachés à la fiche collaborateur.
            </div>
          </div>
        </div>
      ) : (
        <CollaboratorAccountEditBlock
          formData={formData}
          setFormData={setFormData}
          users={users}
        />
      )}

      <div className="border border-stone-200/80 p-4 rounded-2xl bg-stone-50 flex items-center justify-between gap-4">
        <div>
          <label className="block text-[10px] text-stone-500 mb-0.5">
            Photo de profil du collaborateur
          </label>
          <span className="text-[9px] text-stone-400 font-medium normal-case">
            Avatars stylés OU Vraie photo compressée (&lt; 350 Ko)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-stone-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-stone-500 text-xs border border-stone-300 shadow-2xs">
            {formData.avatarUrl ? (
              <img src={formData.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>IMG</span>
            )}
          </div>
          <button
            type="button"
            onClick={onOpenAvatarPicker}
            className="px-3.5 py-2 border border-[#2A7B76]/30 hover:bg-[#2A7B76]/10 text-[#2A7B76] bg-white text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer normal-case shadow-2xs"
          >
            <Camera className="h-3.5 w-3.5 text-[#2A7B76]" />
            <span>Choisir photo / avatar</span>
          </button>
        </div>
      </div>
    </>
  );
};
