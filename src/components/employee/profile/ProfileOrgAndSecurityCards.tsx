import React from 'react';
import { Briefcase, ShieldCheck, Clock, CheckSquare, Users, Lock } from 'lucide-react';
import { AppUser, Employee } from '../../../types';
import { ProfileSecuritySubTab } from '../../profile/ProfileSecuritySubTab';

interface ProfileOrgAndSecurityCardsProps {
  employeeProfile: Employee;
  currentUser?: AppUser | null;
  managerDisplayName: string;
  teamsList: string[];
  calculateTenure: (hireDate?: string) => string;
  systemRoleLabel: string;
  myPresencesCount: number;
  myPendingTasksCount: number;
  showPasswordForm: boolean;
  setShowPasswordForm: React.Dispatch<React.SetStateAction<boolean>>;
  onUpdateUser?: (updated: AppUser) => void;
}

export const ProfileOrgAndSecurityCards: React.FC<ProfileOrgAndSecurityCardsProps> = ({
  employeeProfile,
  currentUser,
  managerDisplayName,
  teamsList,
  calculateTenure,
  systemRoleLabel,
  myPresencesCount,
  myPendingTasksCount,
  showPasswordForm,
  setShowPasswordForm,
  onUpdateUser,
}) => {
  return (
    <>
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-stone-800 text-sm">Poste & Organisation</h3>
            <p className="text-[11px] text-stone-500">Rattachements et hiérarchie</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/70">
            <span className="text-amber-800 font-bold text-[10px] uppercase block tracking-wider">
              👔 Supérieur Hiérarchique Direct
            </span>
            <strong className="text-stone-900 text-sm block mt-0.5">
              {managerDisplayName}
            </strong>
            <span className="text-[10px] text-stone-500">
              Responsable de validation des tâches et permissions
            </span>
          </div>

          <div>
            <span className="text-stone-400 block text-[11px] mb-1 flex items-center gap-1 font-bold">
              <Users className="h-3.5 w-3.5 text-[#2A7B76]" />
              Équipe(s) de rattachement ({teamsList.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {teamsList.map((t, idx) => (
                <span
                  key={idx}
                  className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-xl shadow-3xs"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-stone-400 block text-[11px]">Fonction / Intitulé de poste</span>
            <span className="font-semibold text-stone-800">{employeeProfile.roleType || 'Collaborateur'}</span>
          </div>

          <div>
            <span className="text-stone-400 block text-[11px]">Département / Direction</span>
            <span className="font-semibold text-stone-800">{employeeProfile.department || 'Général'}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100">
            <div>
              <span className="text-stone-400 block text-[11px]">Prise de fonction</span>
              <span className="font-semibold text-stone-800">{employeeProfile.hireDate || '2023-01-15'}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[11px]">Ancienneté</span>
              <span className="font-semibold text-stone-800">{calculateTenure(employeeProfile.hireDate)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-stone-800 text-sm">Rôles & Accès Système</h3>
            <p className="text-[11px] text-stone-500">Statut de sécurité et indicateurs</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <span className="text-stone-400 block text-[11px]">Rôle Système</span>
            <span className="font-bold text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl inline-block mt-0.5">
              {systemRoleLabel}
            </span>
          </div>

          <div>
            <span className="text-stone-400 block text-[11px]">Statut Contractuel</span>
            <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg inline-block mt-0.5">
              {String(employeeProfile.status || 'Actif').replace(/_/g, ' ')}
            </span>
          </div>

          <div className="pt-2 border-t border-stone-100 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 text-center">
              <Clock className="h-4 w-4 text-[#2A7B76] mx-auto mb-1" />
              <span className="text-base font-bold text-stone-800 block">{myPresencesCount}</span>
              <span className="text-[10px] text-stone-500">Pointages récents</span>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 text-center">
              <CheckSquare className="h-4 w-4 text-amber-600 mx-auto mb-1" />
              <span className="text-base font-bold text-stone-800 block">{myPendingTasksCount}</span>
              <span className="text-[10px] text-stone-500">Tâches assignées</span>
            </div>
          </div>

          {currentUser && (
            <div className="pt-3 border-t border-stone-100 space-y-3">
              <button
                type="button"
                onClick={() => setShowPasswordForm((prev) => !prev)}
                className="w-full py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5 text-[#2A7B76]" />
                <span>{showPasswordForm ? 'Masquer le formulaire' : 'Modifier mon mot de passe'}</span>
              </button>
              {showPasswordForm && (
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
                  <ProfileSecuritySubTab
                    currentUser={currentUser}
                    onUpdateUser={onUpdateUser}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
