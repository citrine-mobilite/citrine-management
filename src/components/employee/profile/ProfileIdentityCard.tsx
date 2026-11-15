import React from 'react';
import { User, Phone, Calendar, Pencil, Check } from 'lucide-react';
import { AppUser, Employee } from '../../../types';

interface ProfileIdentityCardProps {
  employeeProfile: Employee;
  currentUser?: AppUser | null;
  currentBirthDate?: string;
  ageDisplay: string | null;
  isEditingBirthDate: boolean;
  setIsEditingBirthDate: (v: boolean) => void;
  draftBirthDate: string;
  setDraftBirthDate: (v: string) => void;
  isSavingBirthDate: boolean;
  onSaveBirthDate: () => void;
  currentPhone: string;
  isEditingPhone: boolean;
  setIsEditingPhone: (v: boolean) => void;
  draftPhone: string;
  setDraftPhone: (v: string) => void;
  isSavingPhone: boolean;
  onSavePhone: () => void;
}

export const ProfileIdentityCard: React.FC<ProfileIdentityCardProps> = ({
  employeeProfile,
  currentUser,
  currentBirthDate,
  ageDisplay,
  isEditingBirthDate,
  setIsEditingBirthDate,
  draftBirthDate,
  setDraftBirthDate,
  isSavingBirthDate,
  onSaveBirthDate,
  currentPhone,
  isEditingPhone,
  setIsEditingPhone,
  draftPhone,
  setDraftPhone,
  isSavingPhone,
  onSavePhone,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-4">
      <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
        <div className="p-2 rounded-xl bg-emerald-50 text-[#2A7B76]">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-stone-800 text-sm">Identité & Date de Naissance</h3>
          <p className="text-[11px] text-stone-500">Coordonnées et état civil</p>
        </div>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <span className="text-stone-400 block text-[11px]">Nom complet</span>
          <span className="font-semibold text-stone-800">{employeeProfile.name}</span>
        </div>

        <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-stone-500 font-bold text-[11px] flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" />
              Date de naissance
            </span>
            {!isEditingBirthDate && (
              <button
                type="button"
                onClick={() => {
                  setDraftBirthDate(currentBirthDate || '');
                  setIsEditingBirthDate(true);
                }}
                className="text-[10px] font-bold text-[#2A7B76] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Pencil className="h-3 w-3" />
                <span>Modifier</span>
              </button>
            )}
          </div>

          {isEditingBirthDate ? (
            <div className="space-y-2 pt-1 animate-in fade-in">
              <input
                type="date"
                value={draftBirthDate}
                onChange={(e) => setDraftBirthDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 bg-white font-mono font-bold text-xs text-stone-900 outline-none focus:ring-2 focus:ring-[#2A7B76]"
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditingBirthDate(false)}
                  className="px-2.5 py-1 text-stone-500 hover:bg-stone-200 rounded-lg text-[10px] font-bold transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isSavingBirthDate}
                  onClick={onSaveBirthDate}
                  className="px-3 py-1 bg-[#2A7B76] hover:bg-[#20635F] text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-3xs"
                >
                  <Check className="h-3 w-3" />
                  <span>{isSavingBirthDate ? 'Sauvegarde...' : 'Enregistrer'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-900 font-mono text-sm">
                {currentBirthDate || 'Non renseignée'}
              </span>
              {ageDisplay && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {ageDisplay}
                </span>
              )}
            </div>
          )}
        </div>

        <div>
          <span className="text-stone-400 block text-[11px]">Adresse e-mail professionnelle</span>
          <span className="font-semibold text-stone-800">{employeeProfile.email || currentUser?.email || 'N/A'}</span>
        </div>

        <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-stone-500 font-bold text-[11px] flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-[#2A7B76]" />
              Téléphone direct
            </span>
            {!isEditingPhone && (
              <button
                type="button"
                onClick={() => {
                  setDraftPhone(currentPhone);
                  setIsEditingPhone(true);
                }}
                className="text-[10px] font-bold text-[#2A7B76] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Pencil className="h-3 w-3" />
                <span>Modifier</span>
              </button>
            )}
          </div>

          {isEditingPhone ? (
            <div className="space-y-2 pt-1 animate-in fade-in">
              <input
                type="tel"
                value={draftPhone}
                onChange={(e) => setDraftPhone(e.target.value)}
                placeholder="+237 6XX XX XX XX"
                className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 bg-white font-mono font-bold text-xs text-stone-900 outline-none focus:ring-2 focus:ring-[#2A7B76]"
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditingPhone(false)}
                  className="px-2.5 py-1 text-stone-500 hover:bg-stone-200 rounded-lg text-[10px] font-bold transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isSavingPhone || !draftPhone.trim()}
                  onClick={onSavePhone}
                  className="px-3 py-1 bg-[#2A7B76] hover:bg-[#20635F] text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-3xs disabled:opacity-50"
                >
                  <Check className="h-3 w-3" />
                  <span>{isSavingPhone ? 'Sauvegarde...' : 'Enregistrer'}</span>
                </button>
              </div>
            </div>
          ) : (
            <span className="font-bold text-stone-900 font-mono text-sm block">
              {currentPhone || 'Non renseigné'}
            </span>
          )}
        </div>

        <div>
          <span className="text-stone-400 block text-[11px]">Matricule / Identifiant</span>
          <span className="font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
            {employeeProfile.id}
          </span>
        </div>
      </div>
    </div>
  );
};
