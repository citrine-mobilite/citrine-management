import React from 'react';
import { Clock } from 'lucide-react';
import { AppUser } from '../../types';
import { HumaanDashboardHero } from '../illustrations/HumaanIllustrations';

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
    <div className="bg-gradient-to-r from-[#2A7B76] via-[#236864] to-[#174845] text-white p-5 sm:p-7 rounded-3xl shadow-xl border border-emerald-600/30 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative z-10 space-y-2.5 text-center md:text-left">
        <div className="inline-flex items-center gap-2">
          <span className="bg-[#D4A82F] text-stone-900 text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
            Espace Direction & Pilotage
          </span>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
            Bonjour, {currentUser?.name || 'Administrateur'}
          </h1>
          <p className="text-xs text-emerald-100/90 font-medium capitalize mt-0.5">
            {currentDateFormatted}
          </p>
        </div>

        <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-xs px-4 py-2 rounded-2xl border border-white/20 shadow-2xs">
          <Clock className="h-4 w-4 text-emerald-200 animate-pulse" />
          <span className="font-mono text-sm font-bold text-white tracking-wider">
            {realTime}
          </span>
        </div>
      </div>

      <div className="shrink-0 z-10 flex items-center justify-center">
        <HumaanDashboardHero className="w-48 h-32 sm:w-56 sm:h-36 drop-shadow-md" />
      </div>
    </div>
  );
};

export default DashboardHeaderBanner;
