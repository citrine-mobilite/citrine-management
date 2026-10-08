import React from 'react';
import { Sparkles, Clock } from 'lucide-react';
import { AppUser } from '../../types';

interface DashboardHeaderBannerProps {
  currentUser: AppUser | null;
  currentDateFormatted: string;
  realTime: string;
}

export const DashboardHeaderBanner: React.FC<DashboardHeaderBannerProps> = ({
  currentUser,
  currentDateFormatted,
  realTime,
}) => {
  return (
    <div className="bg-gradient-to-r from-[#2A7B76] via-[#236864] to-[#1E5753] text-white p-5 sm:p-6 rounded-3xl shadow-sm border border-emerald-700/40 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-[#D4A82F] text-stone-900 text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Espace Administrateur
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
            Bonjour, {currentUser?.name || 'Administrateur'}
          </h1>
          <p className="text-xs text-emerald-100/90 font-medium capitalize">
            {currentDateFormatted}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-white/20 self-start sm:self-auto flex items-center gap-2.5 shadow-2xs">
          <Clock className="h-4 w-4 text-emerald-200 animate-pulse" />
          <div>
            <span className="text-[10px] text-emerald-200 font-bold block uppercase tracking-wider">
              Heure Actuelle
            </span>
            <span className="font-mono text-base font-bold text-white tracking-wider">
              {realTime}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
