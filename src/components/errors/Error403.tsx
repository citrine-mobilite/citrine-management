import React from 'react';
import { Home, ShieldAlert, ArrowLeft } from 'lucide-react';
import { haptic } from '../../services/hapticService';

interface ErrorPageProps {
  onGoHome?: () => void;
  onGoBack?: () => void;
}

export const Error403: React.FC<ErrorPageProps> = ({ onGoHome, onGoBack }) => {
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="max-w-xl w-full bg-white dark:bg-stone-900 rounded-3xl p-8 sm:p-10 shadow-2xl border border-stone-200/80 dark:border-stone-800 text-center space-y-6 relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Humaans Style SVG Illustration for 403 (Security Shield & Guard) */}
        <div className="flex justify-center">
          <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-64 h-40 drop-shadow-sm">
            {/* Ambient shadow */}
            <ellipse cx="140" cy="165" rx="55" ry="10" fill="#000000" fillOpacity="0.08" />
            
            {/* Floating Shield Icon */}
            <g transform="translate(118, 15)" className="animate-pulse">
              <path d="M22 2 L38 8 L38 20 C38 30 30 38 22 42 C14 38 6 30 6 20 L6 8 Z" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
              <circle cx="22" cy="22" r="5" fill="#D97706" />
            </g>

            {/* Character protecting/blocking */}
            <g transform="translate(90, 40)">
              {/* Legs */}
              <path d="M40 75 L38 115 C38 118 48 118 48 115 L50 90 L58 90 L60 115 C60 118 70 118 70 115 L68 75 Z" fill="#1E293B" />
              <rect x="30" y="112" width="16" height="6" rx="3" fill="#0F172A" />
              <rect x="60" y="112" width="16" height="6" rx="3" fill="#0F172A" />

              {/* Torso with Guard Jacket */}
              <path d="M30 30 C30 20 74 20 74 30 L70 80 C70 83 34 83 34 80 Z" fill="#3B82F6" />
              
              {/* Arms crossed (Stop / Forbidden gesture) */}
              <path d="M32 45 L52 55 L72 45" stroke="#3B82F6" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />

              {/* Neck & Head */}
              <rect x="48" y="16" width="8" height="16" fill="#C6865A" rx="2" />
              <circle cx="52" cy="10" r="15" fill="#C6865A" />
              {/* Hair */}
              <path d="M38 8 C38 -2 66 -2 66 8 C66 12 62 14 52 14 C43 14 39 12 38 8 Z" fill="#0F172A" />
              {/* Serious expression */}
              <line x1="47" y1="9" x2="50" y2="10" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="54" y1="10" x2="57" y2="9" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="49" y1="15" x2="55" y2="15" stroke="#7C2D12" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </svg>
        </div>

        {/* Error Code Badge */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 font-extrabold text-xs tracking-wide uppercase border border-amber-500/20">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Erreur 403 • Accès Interdit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">
            Zone Réservée / Permissions Requises
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
            Vous ne disposez pas des privilèges ou du rôle hiérarchique nécessaires pour accéder à cette section confidentielle de Citrine.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onGoBack && (
            <button
              type="button"
              onClick={() => {
                haptic.light();
                onGoBack();
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Page précédente</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              haptic.medium();
              if (onGoHome) onGoHome();
              else window.location.href = '/';
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Tableau de Bord Principal</span>
          </button>
        </div>

        {/* Footer help */}
        <p className="text-[11px] text-stone-400 dark:text-stone-500 pt-2">
          Citrine Management • Contrôle d'Accès Basé sur les Rôles (RBAC)
        </p>

      </div>
    </div>
  );
};

export default Error403;
