import React from 'react';
import { AlertCircle, Check, KeyRound } from 'lucide-react';
import { AppUser, UserRole } from '../../types';
import { generateUuidV4 } from '../../services/employeeService';
import { CollaboratorFormData } from './collaboratorConstants';

interface CollaboratorAccountEditBlockProps {
  formData: CollaboratorFormData;
  setFormData: React.Dispatch<React.SetStateAction<CollaboratorFormData>>;
  users: AppUser[];
}

export const CollaboratorAccountEditBlock: React.FC<CollaboratorAccountEditBlockProps> = ({
  formData,
  setFormData,
  users,
}) => {
  return (
    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3 normal-case">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-[#2A7B76]" />
          <h4 className="font-serif font-bold text-xs text-stone-900">
            Compte Utilisateur Associé & Rôle Système (User ID & Role ID)
          </h4>
        </div>
        {formData.userId ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <Check className="h-3 w-3" /> Compte Lié
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            <AlertCircle className="h-3 w-3" /> Non Lié
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
            Identifiant Utilisateur (User ID)
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              placeholder="Ex: 82b0325a-... ou ID compte"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-mono font-medium text-stone-800 focus:ring-2 focus:ring-[#2A7B76] outline-none truncate"
            />
            {users.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  const matched = users.find((u) => u.id === e.target.value || u.uid === e.target.value);
                  if (matched) {
                    const rId = matched.roleId || (matched.role === 'administrateur' ? 1 : matched.role === 'responsable' ? 2 : 3);
                    setFormData({
                      ...formData,
                      userId: matched.id,
                      roleId: rId,
                      userRole: matched.role || 'employé',
                      email: formData.email || matched.email,
                    });
                  }
                }}
                className="px-2 py-2 rounded-xl border border-stone-200 bg-white text-[10px] text-stone-600 cursor-pointer"
                title="Choisir parmi les comptes existants"
              >
                <option value="">Lier...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
            Rôle & Niveau d&apos;Accès (Role ID) *
          </label>
          <select
            value={formData.roleId}
            onChange={(e) => {
              const rId = Number(e.target.value);
              const r: UserRole = rId === 1 ? 'administrateur' : rId === 2 ? 'responsable' : 'employé';
              setFormData({ ...formData, roleId: rId, userRole: r, roleType: r });
            }}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-800 focus:ring-2 focus:ring-[#2A7B76] outline-none"
          >
            <option value={3}>3 — Employé (Espace Personnel & Pointage)</option>
            <option value={2}>2 — Responsable (Génération QR 30s & Validation)</option>
            <option value={1}>1 — Administrateur (Accès et Contrôle Total)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
            Mot de passe de connexion (optionnel)
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.userPassword}
              onChange={(e) => setFormData({ ...formData, userPassword: e.target.value })}
              placeholder="Laissez vide pour conserver l'actuel"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-mono font-bold text-stone-800 focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
            <button
              type="button"
              onClick={() => setFormData({ ...formData, userPassword: `Collab@${Math.floor(1000 + Math.random() * 9000)}` })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#2A7B76] font-bold hover:underline"
            >
              Générer
            </button>
          </div>
        </div>

        <div className="sm:col-span-2 text-[11px] text-stone-600 bg-white/80 p-2.5 rounded-xl border border-stone-200/80">
          🔄 <strong>Synchronisation bidirectionnelle :</strong> Toute modification de l&apos;adresse e-mail, du nom ou du statut mettra instantanément à jour le compte utilisateur correspondant en base de données.
        </div>

        {!formData.userId && (
          <div className="sm:col-span-2 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-[11px] text-amber-800">
              Ce collaborateur n&apos;a pas encore de compte utilisateur lié.
            </span>
            <button
              type="button"
              onClick={() => {
                const newUid = generateUuidV4();
                const rId = formData.roleId ? Number(formData.roleId) : 3;
                const r: UserRole = rId === 1 ? 'administrateur' : rId === 2 ? 'responsable' : 'employé';
                setFormData({ ...formData, userId: newUid, roleId: rId, userRole: r });
              }}
              className="px-3 py-1.5 bg-[#2A7B76] text-white rounded-lg text-xs font-bold whitespace-nowrap hover:bg-[#23635f] transition cursor-pointer"
            >
              Auto-Générer User ID
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
