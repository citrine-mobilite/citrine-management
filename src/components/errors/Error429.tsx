import React, { useState, useEffect } from 'react';
import { Home, ArrowLeft, Clock, Zap } from 'lucide-react';
import { haptic } from '../../services/hapticService';

interface ErrorPageProps {
  onGoHome?: () => void;
  onRetry?: () => void;
}

export const Error429: React.FC<ErrorPageProps> = ({ onGoHome, onRetry }) => {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="max-w-xl w-full bg-white dark:bg-stone-900 rounded-3xl p-8 sm:p-10 shadow-2xl border border-stone-200/80 dark:border-stone-800 text-center space-y-6 relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Humaans Style SVG Illustration for 429 (Rate Limit / Too Fast) */}
        <div className="flex justify-center">
          <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-64 h-40 drop-shadow-sm">
            {/* Ambient shadow */}
            <ellipse cx="140" cy="165" rx="55" ry="10" fill="#000000" fillOpacity="0.08" />
            
            {/* Floating clock icon */}
            <g transform="translate(120, 15)" className="animate-pulse">
              <circle cx="20" cy="20" r="18" fill="#F3E8FF" stroke="#A855F7" strokeWidth="2" />
              <line x1="20" y1="10" x2="20" y2="20" stroke="#7E22CE" strokeWidth="2" strokeLinecap="round" />
              <line x1="20" y1="20" x2="26" y2="24" stroke="#7E22CE" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Character rushing */}
            <g transform="translate(90, 40)">
              {/* Legs */}
              <path d="M40 75 L30 115 C30 118 40 120 42 115 L50 90 L60 90 L75 110 C78 113 85 110 82 105 L70 75 Z" fill="#4C1D95" />
              <rect x="24" y="112" width="16" height="6" rx="3" fill="#2E1065" />
              <rect x="76" y="102" width="16" height="6" rx="3" fill="#2E1065" />

              {/* Torso */}
              <path d="M30 30 C30 20 74 20 74 30 L70 80 C70 83 34 83 34 80 Z" fill="#8B5CF6" />
              
              {/* Arms raised in pause */}
              <path d="M28 45 L15 30" stroke="#8B5CF6" strokeWidth="9" strokeLinecap="round" />
              <path d="M76 45 L90 30" stroke="#8B5CF6" strokeWidth="9" strokeLinecap="round" />

              {/* Neck & Head */}
              <rect x="48" y="16" width="8" height="16" fill="#D49B74" rx="2" />
              <circle cx="52" cy="10" r="15" fill="#D49B74" />
              {/* Hair */}
              <path d="M38 8 C38 -2 66 -2 66 8 C66 12 62 14 52 14 C43 14 39 12 38 8 Z" fill="#2E1065" />
            </g>
          </svg>
        </div>

        {/* Error Code Badge */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 text-purple-800 dark:text-purple-300 font-extrabold text-xs tracking-wide uppercase border border-purple-500/20">
            <Zap className="w-3.5 h-3.5 text-purple-600" />
            <span>Erreur 429 • Trop de requêtes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">
            Ralentissez un instant !
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
            Vous avez effectué trop de requêtes en un court laps de temps. Pour protéger les serveurs Citrine, veuillez patienter quelques secondes.
          </p>
        </div>

        {/* Countdown Timer box */}
        <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 rounded-2xl p-4 flex items-center justify-center gap-3 text-purple-900 dark:text-purple-200">
          <Clock className="w-5 h-5 text-purple-600 animate-spin" />
          <span className="font-bold text-sm">
            {countdown > 0 ? `Réessai disponible dans ${countdown} secondes` : 'Vous pouvez à nouveau réessayer !'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={countdown > 0}
            onClick={() => {
              haptic.medium();
              if (onRetry) onRetry();
              else window.location.reload();
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Réessayer maintenant</span>
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
          Citrine Management • Protection Rate Limiting & Sécurité API
        </p>

      </div>
    </div>
  );
};

export default Error429;
