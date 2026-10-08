import React from 'react';
import { Shield, Check, FileText } from 'lucide-react';
import { AppUser } from '../../types';

interface ProfilePermissionsSubTabProps {
  currentUser: AppUser;
}

export const ProfilePermissionsSubTab: React.FC<ProfilePermissionsSubTabProps> = ({
  currentUser,
}) => {
  const isAdm = currentUser.role === 'administrateur';
  const isResp = currentUser.role === 'responsable';

  const permissions = [
    { label: 'Accès au pointage & feuille de présence perso', ok: true },
    { label: 'Consultation de mes fiches de paie & prêts', ok: true },
    { label: 'Gestion des tâches & projets assignés', ok: true },
    { label: 'Appels d\'équipe vidéo & audio WebRTC', ok: true },
    { label: 'Validation des demandes de pointages d\'équipe', ok: isAdm || isResp },
    { label: 'Gestion de l\'annuaire des collaborateurs', ok: isAdm || isResp },
    { label: 'Génération des attestations & rapports RH certifiés', ok: isAdm || isResp },
    { label: 'Accès à la gestion des salaires & comptabilité', ok: isAdm },
    { label: 'Gestion des comptes utilisateurs & rôles', ok: isAdm },
    { label: 'Configuration globale de l\'entreprise', ok: isAdm },
  ];

  return (
    <div className="space-y-4 max-w-xl">
      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
            Rôle Actif
          </span>
          <h4 className="font-bold text-sm text-stone-900 capitalize mt-0.5">
            {currentUser.role}
          </h4>
        </div>
        <span className="bg-[#2A7B76]/10 text-[#2A7B76] border border-[#2A7B76]/30 font-bold text-xs px-3 py-1 rounded-xl">
          Statut: {currentUser.status}
        </span>
      </div>

      <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100 bg-white">
        {permissions.map((p, idx) => (
          <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
            <span className={p.ok ? 'font-medium text-stone-800' : 'text-stone-400 line-through'}>
              {p.label}
            </span>
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                p.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-400'
              }`}
            >
              {p.ok ? <Check className="h-3 w-3 stroke-[3px]" /> : <span className="text-[10px]">✕</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
