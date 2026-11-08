import React from 'react';
import { Home, ArrowLeft, Search, Compass } from 'lucide-react';
import { haptic } from '../../services/hapticService';

interface ErrorPageProps {
  onGoHome?: () => void;
  onGoBack?: () => void;
}

export const Error404: React.FC<ErrorPageProps> = ({ onGoHome, onGoBack }) => {
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="max-w-xl w-full bg-white dark:bg-stone-900 rounded-3xl p-8 sm:p-10 shadow-2xl border border-stone-200/80 dark:border-stone-800 text-center space-y-6 relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Humaans Style SVG Illustration for 404 (Searching character lost) */}
        <div className="flex justify-center">
          <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-64 h-40 drop-shadow-sm">
            {/* Ambient shadow */}
            <ellipse cx="140" cy="165" rx="55" ry="10" fill="#000000" fillOpacity="0.08" />
            
            {/* Floating question mark / map icons */}
            <g transform="translate(40, 25)" className="animate-bounce">
              <rect x="0" y="0" width="36" height="36" rx="10" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
              <text x="18" y="24" fontSize="18" fontWeight="bold" fill="#D97706" textAnchor="middle">?</text>
            </g>
            <g transform="translate(200, 35)" className="animate-pulse">
              <circle cx="16" cy="16" r="18" fill="#D1FAE5" stroke="#10B981" strokeWidth="1.5" />
              <Compass className="w-5 h-5 text-[#2A7B76]" x="6" y="6" />
            </g>

            {/* Character body seated or looking around */}
            <g transform="translate(90, 40)">
              {/* Legs */}
              <path d="M40 75 L35 115 C35 118 45 118 45 115 L50 90 L60 90 L65 115 C65 118 75 118 75 115 L70 75 Z" fill="#1E293B" />
              <rect x="28" y="112" width="16" height="6" rx="3" fill="#0F172A" />
              <rect x="66" y="112" width="16" height="6" rx="3" fill="#0F172A" />

              {/* Torso */}
              <path d="M30 30 C30 20 74 20 74 30 L70 80 C70 83 34 83 34 80 Z" fill="#2A7B76" />
              
              {/* Arms holding magnifying glass */}
              <path d="M32 35 L12 50 L25 65" stroke="#2A7B76" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
              {/* Magnifying glass circle */}
              <circle cx="20" cy="70" r="14" fill="white" fillOpacity="0.8" stroke="#0F172A" strokeWidth="3" />
              <line x1="28" y1="78" x2="38" y2="88" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />

              {/* Right arm scratching head */}
              <path d="M72 35 L88 20 L82 40" stroke="#2A7B76" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />

              {/* Neck & Head */}
              <rect x="48" y="16" width="8" height="16" fill="#D49B74" rx="2" />
              <circle cx="52" cy="10" r="15" fill="#D49B74" />
              {/* Hair */}
              <path d="M38 8 C38 -2 66 -2 66 8 C66 12 62 14 52 14 C43 14 39 12 38 8 Z" fill="#0F172A" />
              {/* Confused expression */}
              <circle cx="47" cy="9" r="1.5" fill="#0F172A" />
              <circle cx="57" cy="9" r="1.5" fill="#0F172A" />
              <path d="M50 16 Q 52 14 54 16" stroke="#7C2D12" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            </g>
          </svg>
        </div>

        {/* Error Code Badge */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 font-extrabold text-xs tracking-wide uppercase border border-amber-500/20">
            <span>Erreur 404</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">
            Page introuvable
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
            Oups ! La page que vous recherchez semble introuvable ou a été déplacée vers une autre section de Citrine.
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
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-[#2A7B76] to-emerald-700 hover:from-[#20615d] hover:to-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Retour à l'Accueil Citrine</span>
          </button>
        </div>

        {/* Footer help */}
        <p className="text-[11px] text-stone-400 dark:text-stone-500 pt-2">
          Citrine Management • Système de Sécurité & Navigation Intégrée
        </p>

      </div>
    </div>
  );
};

export default Error404;
