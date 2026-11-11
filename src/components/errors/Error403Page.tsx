import React from 'react';
import { ShieldAlert, ArrowLeft, Home, UserCheck, Lock } from 'lucide-react';
import { AppUser } from '../../types';
import { TabType } from '../Sidebar';
import { HumaanShield } from '../illustrations/HumaanIllustrations';
import { isEmployeeUser } from '../../utils/roleUtils';

interface Error403PageProps {
  currentUser?: AppUser | null;
  onNavigate: (tab: TabType) => void;
  attemptedTab?: string;
  requiredRole?: string;
}

export const Error403Page: React.FC<Error403PageProps> = ({
  currentUser,
  onNavigate,
  attemptedTab,
  requiredRole,
}) => {
  const isEmployee = isEmployeeUser(currentUser);
  const homeTab: TabType = isEmployee ? 'employee_portal' : 'dashboard';

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="max-w-xl w-full bg-white/90 backdrop-blur-md rounded-3xl border border-rose-200/80 shadow-xl p-8 sm:p-10 text-center space-y-6 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-1/4 -mt-16 w-56 h-56 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Illustration Humaaans */}
        <div className="flex justify-center relative z-10">
          <div className="p-4 bg-rose-50/70 rounded-3xl border border-rose-100 shadow-inner">
            <HumaanShield className="w-48 h-32 sm:w-56 sm:h-36 drop-shadow-sm" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
            <span>Erreur 403 • Accès Non Autorisé</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900 tracking-tight">
            Accès Refusé
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
            Votre profil actuel (<strong className="text-stone-800 capitalize">{currentUser?.role || 'Employé'}</strong>) ne possède pas les permissions requises pour accéder au module {attemptedTab ? <code className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-800 font-mono text-xs font-semibold">« {attemptedTab} »</code> : 'demandé'}.
          </p>
          {requiredRole && (
            <p className="text-[11px] text-stone-400 font-medium">
              Ce module requiert les privilèges : <span className="text-stone-700 font-semibold">{requiredRole}</span>.
            </p>
          )}
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
            onClick={() => onNavigate('profile')}
            className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <UserCheck className="h-4 w-4" />
            <span>Consulter mon profil</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Error403Page;
