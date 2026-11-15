import React from 'react';
import { User, Mail, Building, CheckCircle2, Camera, Shield, Users, Briefcase } from 'lucide-react';
import { AppUser, Employee } from '../../types';

interface ProfileSummaryBannerProps {
  currentUser: AppUser;
  employeeData: Employee | null;
  name: string;
  department: string;
  avatarUrl: string;
  managerName: string;
  assignedTeams: string[];
  successInfo: string | null;
  error: string | null;
  onOpenAvatarPicker: () => void;
}

export const ProfileSummaryBanner: React.FC<ProfileSummaryBannerProps> = ({
  currentUser,
  employeeData,
  name,
  department,
  avatarUrl,
  managerName,
  assignedTeams,
  successInfo,
  error,
  onOpenAvatarPicker,
}) => {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-3 mb-6">
        <div>
          <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
            <User className="w-5 h-5 text-[#2A7B76]" />
            Mon Profil & Informations Collaborateur
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Consultez vos rattachements et modifiez vos informations personnelles (date de naissance, téléphone, avatar).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-full uppercase tracking-wider">
            {currentUser.role}
          </span>
          {employeeData?.roleType && employeeData.roleType !== currentUser.role && (
            <span className="px-3 py-1 bg-stone-100 text-stone-700 border border-stone-200 font-semibold text-xs rounded-full">
              {employeeData.roleType}
            </span>
          )}
        </div>
      </div>

      {successInfo && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successInfo}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-stone-50/80 rounded-2xl border border-stone-200/80 text-xs">
        <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-stone-200/60 shadow-3xs">
          <div className="p-2 rounded-lg bg-teal-50 text-[#2A7B76]">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Supérieur Hiérarchique Direct</span>
            <strong className="text-stone-800 text-xs block mt-0.5">{managerName}</strong>
            <span className="text-[10px] text-stone-500">Validation des congés & tâches</span>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-stone-200/60 shadow-3xs">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">
              Équipe(s) de Rattachement ({assignedTeams.length})
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {assignedTeams.map((t, idx) => (
                <span key={idx} className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-stone-200/60 shadow-3xs">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Rôle & Fonction</span>
            <strong className="text-stone-800 text-xs block mt-0.5 capitalize">{currentUser.role}</strong>
            <span className="text-[10px] text-stone-500">{employeeData?.department || department || 'Général'}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-6 pb-6 border-b border-stone-100">
        <div className="relative group shrink-0">
          <div className="w-24 h-24 rounded-3xl overflow-hidden bg-stone-100 flex items-center justify-center text-[#2A7B76] font-bold text-3xl shadow-sm border-2 border-stone-200">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              name ? name.charAt(0).toUpperCase() : 'U'
            )}
          </div>
          <button
            type="button"
            onClick={onOpenAvatarPicker}
            className="absolute -bottom-1.5 -right-1.5 bg-[#2A7B76] hover:bg-[#20635F] text-white p-2 rounded-xl shadow-md transition cursor-pointer"
            title="Changer la photo de profil"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <h3 className="text-lg font-bold text-stone-900">{name}</h3>
          <p className="text-xs text-stone-500 flex items-center justify-center sm:justify-start gap-1.5">
            <Mail className="w-3.5 h-3.5 text-[#2A7B76]" /> {currentUser.email}
          </p>
          <p className="text-xs text-stone-500 flex items-center justify-center sm:justify-start gap-1.5">
            <Building className="w-3.5 h-3.5 text-[#2A7B76]" /> {department || 'Direction Générale'}
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={onOpenAvatarPicker}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Changer la photo / avatar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
