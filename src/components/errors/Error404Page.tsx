import React from 'react';
import { Compass, ArrowLeft, RefreshCw, Home } from 'lucide-react';
import { AppUser } from '../../types';
import { TabType } from '../Sidebar';
import { HumaanRelaxedState } from '../illustrations/HumaanIllustrations';
import { isEmployeeUser } from '../../utils/roleUtils';

interface Error404PageProps {
  currentUser?: AppUser | null;
  onNavigate: (tab: TabType) => void;
  attemptedTab?: string;
}

export const Error404Page: React.FC<Error404PageProps> = ({
  currentUser,
  onNavigate,
  attemptedTab,
}) => {
  const isEmployee = isEmployeeUser(currentUser);
  const homeTab: TabType = isEmployee ? 'employee_portal' : 'dashboard';

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="max-w-xl w-full bg-white/90 backdrop-blur-md rounded-3xl border border-stone-200/80 shadow-xl p-8 sm:p-10 text-center space-y-6 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-1/4 -mt-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-16 w-56 h-56 bg-[#D4A82F]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Illustration Humaaans */}
        <div className="flex justify-center relative z-10">
          <div className="p-4 bg-emerald-50/70 rounded-3xl border border-emerald-100/80 shadow-inner">
            <HumaanRelaxedState className="w-48 h-32 sm:w-56 sm:h-36 drop-shadow-sm" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#2A7B76]">
            <Compass className="h-3.5 w-3.5" />
            <span>Erreur 404 • Destination Inconnue</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900 tracking-tight">
            Page Introuvable
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
            Le module ou l'écran demandé {attemptedTab ? <code className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-800 font-mono text-xs font-semibold">« {attemptedTab} »</code> : 'est introuvable'} n'existe pas ou a été déplacé.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 relative z-10">
          <button
            onClick={() => onNavigate(homeTab)}
            className="px-5 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white rounded-2xl text-xs font-bold transition shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Home className="h-4 w-4" />
            <span>{isEmployee ? 'Mon Espace Collaborateur' : 'Tableau de Bord'}</span>
          </button>

          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Error404Page;
