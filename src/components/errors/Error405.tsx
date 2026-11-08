import React from 'react';
import { Home, ArrowLeft, Ban } from 'lucide-react';
import { haptic } from '../../services/hapticService';

interface ErrorPageProps {
  onGoHome?: () => void;
  onGoBack?: () => void;
}

export const Error405: React.FC<ErrorPageProps> = ({ onGoHome, onGoBack }) => {
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="max-w-xl w-full bg-white dark:bg-stone-900 rounded-3xl p-8 sm:p-10 shadow-2xl border border-stone-200/80 dark:border-stone-800 text-center space-y-6 relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-stone-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Humaans Style SVG Illustration for 405 (Method Not Allowed / Wrong Turn) */}
        <div className="flex justify-center">
          <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-64 h-40 drop-shadow-sm">
            {/* Ambient shadow */}
            <ellipse cx="140" cy="165" rx="55" ry="10" fill="#000000" fillOpacity="0.08" />
            
            {/* Floating warning sign */}
            <g transform="translate(120, 10)">
              <polygon points="20,0 40,35 0,35" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
              <text x="20" y="28" fontSize="18" fontWeight="bold" fill="#D97706" textAnchor="middle">!</text>
            </g>

            {/* Character gesturing refusal */}
            <g transform="translate(90, 40)">
              {/* Legs */}
              <path d="M40 75 L38 115 C38 118 48 118 48 115 L50 90 L58 90 L60 115 C60 118 70 118 70 115 L68 75 Z" fill="#334155" />
              <rect x="30" y="112" width="16" height="6" rx="3" fill="#0F172A" />
              <rect x="60" y="112" width="16" height="6" rx="3" fill="#0F172A" />

              {/* Torso */}
              <path d="M30 30 C30 20 74 20 74 30 L70 80 C70 83 34 83 34 80 Z" fill="#D97706" />
              
              {/* Arms crossed / rejecting */}
              <path d="M28 45 L52 65 L76 45" stroke="#D97706" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />

              {/* Neck & Head */}
              <rect x="48" y="16" width="8" height="16" fill="#D49B74" rx="2" />
              <circle cx="52" cy="10" r="15" fill="#D49B74" />
              {/* Hair */}
              <path d="M38 8 C38 -2 66 -2 66 8 C66 12 62 14 52 14 C43 14 39 12 38 8 Z" fill="#0F172A" />
              {/* Disapproving eyes */}
              <line x1="47" y1="9" x2="50" y2="9" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="54" y1="9" x2="57" y2="9" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </svg>
        </div>

        {/* Error Code Badge */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/10 text-orange-800 dark:text-orange-300 font-extrabold text-xs tracking-wide uppercase border border-orange-500/20">
            <Ban className="w-3.5 h-3.5 text-orange-600" />
            <span>Erreur 405 • Méthode non autorisée</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">
            Requête non prise en charge
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
            La méthode de requête employée n'est pas autorisée pour cette ressource ou cette action au sein de l'application.
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
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Retour à l'Accueil</span>
          </button>
        </div>

        {/* Footer help */}
        <p className="text-[11px] text-stone-400 dark:text-stone-500 pt-2">
          Citrine Management • Protocole HTTP & Sécurité des Endpoints
        </p>

      </div>
    </div>
  );
};

export default Error405;
