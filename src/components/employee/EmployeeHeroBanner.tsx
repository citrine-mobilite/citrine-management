import React from 'react';
import { Briefcase, Mail, Phone, Calendar, Award, Pencil, ShieldCheck, Clock, CheckCircle2, Coffee } from 'lucide-react';
import { Employee, AppUser, Presence } from '../../types';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { HumaanPersonal } from '../illustrations/HumaanIllustrations';

interface EmployeeHeroBannerProps {
  employeeProfile: Employee;
  currentUser?: AppUser | null;
  todayPresence?: Presence;
  onOpenProfileModal?: () => void;
  calculateTenure: (hireDate?: string) => string;
}

export const EmployeeHeroBanner: React.FC<EmployeeHeroBannerProps> = ({
  employeeProfile,
  currentUser,
  todayPresence,
  onOpenProfileModal,
  calculateTenure,
}) => {
  const isPresent = Boolean(todayPresence?.arrivalTime);
  const isOnBreak = Boolean(todayPresence?.pauseStart && !todayPresence?.pauseEnd);
  const hasDeparted = Boolean(todayPresence?.departureTime);

  const getDayStatusBadge = () => {
    if (hasDeparted) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-900/60 text-stone-200 border border-stone-700/80 backdrop-blur-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          Journée clôturée ({todayPresence?.departureTime})
        </span>
      );
    }
    if (isOnBreak) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/30 text-amber-100 border border-amber-400/50 backdrop-blur-xs animate-pulse">
          <Coffee className="h-3.5 w-3.5 text-amber-300" />
          En pause déjeuner ({todayPresence?.pauseStart})
        </span>
      );
    }
    if (isPresent) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/30 text-emerald-100 border border-emerald-400/50 backdrop-blur-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          En poste actif (depuis {todayPresence?.arrivalTime})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-stone-200 border border-white/20 backdrop-blur-xs">
        <Clock className="h-3.5 w-3.5 text-amber-300" />
        Pointage non encore enregistré
      </span>
    );
  };

  return (
    <div className="bg-gradient-to-br from-[#2A7B76] via-[#1F625E] to-[#14423F] text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-emerald-600/30 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-[#D4A82F]/15 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center justify-between gap-5 relative z-10">
        
        {/* Left: Avatar & Identity details */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left w-full md:w-auto">
          {/* Avatar with status indicator */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden ring-4 ring-white/25 shadow-2xl bg-white/10 flex items-center justify-center">
              {employeeProfile.avatarUrl ? (
                <img
                  src={employeeProfile.avatarUrl}
                  alt={employeeProfile.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <span className="text-2xl sm:text-3xl font-serif font-black text-white/90">
                  {employeeProfile.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-3 border-[#1F625E] shadow-sm ${
                isPresent ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              title={isPresent ? 'Actuellement en poste' : 'Non pointé'}
            />
          </div>

          {/* Details & Clean Welcome Header */}
          <div className="space-y-2 w-full sm:w-auto">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
                {employeeProfile.name}
              </h1>
              {getDayStatusBadge()}
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-emerald-100/80">
              <Award className="h-3 w-3 text-[#F3D079]" />
              <span>Matricule : <strong className="text-white font-mono">{employeeProfile.id}</strong></span>
              <span className="text-white/40">•</span>
              <span>{calculateTenure(employeeProfile.hireDate)}</span>
            </div>
          </div>
        </div>

        {/* Center/Right illustration */}
        <div className="hidden lg:flex items-center justify-center shrink-0">
          <HumaanPersonal className="w-32 h-24 drop-shadow-md" />
        </div>

        {/* Right: Actions organized cleanly on PC, tablet, mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-wrap items-center justify-center md:justify-end gap-2.5 w-full md:w-auto shrink-0">
          {onOpenProfileModal && (
            <button
              onClick={onOpenProfileModal}
              className="w-full sm:w-auto justify-center bg-white/15 hover:bg-white/25 active:scale-98 text-white border border-white/30 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition cursor-pointer shadow-sm backdrop-blur-xs"
            >
              <Pencil className="h-3.5 w-3.5 text-[#F3D079]" />
              <span>Gérer Mon Profil</span>
            </button>
          )}

          <div className="w-full sm:w-auto flex justify-center">
            <PWAInstallButton className="w-full sm:w-auto justify-center py-2.5 px-4" />
          </div>
        </div>

      </div>
    </div>
  );
};
