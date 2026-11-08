import React from 'react';
import { RotateCcw, Home, Settings, AlertTriangle } from 'lucide-react';
import { haptic } from '../../services/hapticService';

interface ErrorPageProps {
  onGoHome?: () => void;
  onRetry?: () => void;
}

export const Error500: React.FC<ErrorPageProps> = ({ onGoHome, onRetry }) => {
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="max-w-xl w-full bg-white dark:bg-stone-900 rounded-3xl p-8 sm:p-10 shadow-2xl border border-stone-200/80 dark:border-stone-800 text-center space-y-6 relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Humaans Style SVG Illustration for 500 (Technical maintenance & gears) */}
        <div className="flex justify-center">
          <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-64 h-40 drop-shadow-sm">
            {/* Ambient shadow */}
            <ellipse cx="140" cy="165" rx="55" ry="10" fill="#000000" fillOpacity="0.08" />
            
            {/* Floating gears */}
            <g transform="translate(45, 30)" className="animate-spin" style={{ transformOrigin: '20px 20px', animationDuration: '10s' }}>
              <circle cx="20" cy="20" r="16" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2" />
              <circle cx="20" cy="20" r="6" fill="white" />
            </g>
            <g transform="translate(195, 25)" className="animate-spin" style={{ transformOrigin: '15px 15px', animationDuration: '6s', animationDirection: 'reverse' }}>
              <circle cx="15" cy="15" r="12" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
              <circle cx="15" cy="15" r="4" fill="white" />
            </g>

            {/* Character fixing server / holding wrench */}
            <g transform="translate(90, 40)">
              {/* Legs */}
              <path d="M40 75 L38 115 C38 118 48 118 48 115 L50 90 L58 90 L60 115 C60 118 70 118 70 115 L68 75 Z" fill="#0F172A" />
              <rect x="30" y="112" width="16" height="6" rx="3" fill="#334155" />
              <rect x="60" y="112" width="16" height="6" rx="3" fill="#334155" />

              {/* Torso */}
              <path d="M30 30 C30 20 74 20 74 30 L70 80 C70 83 34 83 34 80 Z" fill="#DC2626" />
              <rect x="46" y="42" width="12" height="18" rx="3" fill="white" fillOpacity="0.3" />

              {/* Arms with wrench */}
              <path d="M32 35 L12 55 L25 65" stroke="#DC2626" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="15" cy="62" r="8" fill="#94A3B8" />

              {/* Right arm up */}
              <path d="M72 35 L90 25 L85 50" stroke="#DC2626" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />

              {/* Neck & Head */}
              <rect x="48" y="16" width="8" height="16" fill="#D49B74" rx="2" />
              <circle cx="52" cy="10" r="15" fill="#D49B74" />
              {/* Hair */}
              <path d="M38 8 C38 -2 66 -2 66 8 C66 12 62 14 52 14 C43 14 39 12 38 8 Z" fill="#7C2D12" />
              {/* Concentrated expression */}
              <line x1="46" y1="9" x2="49" y2="10" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="55" y1="10" x2="58" y2="9" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="52" cy="15" r="2" fill="#7C2D12" />
            </g>
          </svg>
        </div>

        {/* Error Code Badge */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 text-rose-800 dark:text-rose-300 font-extrabold text-xs tracking-wide uppercase border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Erreur 500</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">
            Erreur Interne du Serveur
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
            Notre équipe technique a été notifiée automatiquement. Un incident inattendu est survenu sur le serveur Citrine.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              haptic.medium();
              if (onRetry) onRetry();
              else window.location.reload();
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Réessayer / Recharger</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptic.light();
              if (onGoHome) onGoHome();
              else window.location.href = '/';
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Retour à l'Accueil</span>
          </button>
        </div>

        {/* Footer help */}
        <p className="text-[11px] text-stone-400 dark:text-stone-500 pt-2">
          Citrine Management • Haute Disponibilité & Sauvegarde en Continu
        </p>

      </div>
    </div>
  );
};

export default Error500;
