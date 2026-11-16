import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { asyncActionTrackerService, AsyncLoadingState } from '../../services/asyncActionTrackerService';

export const GlobalActionLoader: React.FC = () => {
  const [state, setState] = useState<AsyncLoadingState>(() =>
    asyncActionTrackerService.getState()
  );

  useEffect(() => {
    const unsubscribe = asyncActionTrackerService.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  const isSwalActive = typeof document !== 'undefined' && Boolean(document.querySelector('.swal2-container'));
  if (!state.isLoading || isSwalActive) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-label="Opération en cours, veuillez patienter"
      className="fixed inset-0 z-[10050] bg-stone-900/45 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      {/* Barre de progression supérieure animée (Gradient Citrine) */}
      <div className="fixed top-0 left-0 right-0 h-1 z-[10051] overflow-hidden bg-stone-200/40 pointer-events-none">
        <div className="h-full w-full bg-gradient-to-r from-[#2A7B76] via-[#10B981] to-[#2A7B76] animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
      </div>

      {/* Modal centré glassmorphism Citrine */}
      <div className="w-full max-w-sm bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border border-stone-200/90 dark:border-stone-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-150">
        <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/50 shadow-inner">
          <div className="absolute inset-0 rounded-2xl bg-emerald-400/15 animate-ping" />
          <Loader2 className="h-7 w-7 text-[#2A7B76] dark:text-emerald-400 animate-spin relative z-10" />
        </div>

        <div className="space-y-1.5 w-full">
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 leading-snug">
            {state.currentActionLabel || 'Opération en cours...'}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            {state.currentActionDetails || 'Veuillez patienter pendant le traitement de votre demande...'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-[#2A7B76] dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/40">
          <span>Veuillez patienter</span>
          {state.elapsedSeconds > 1 && (
            <span className="font-mono font-bold text-[10px] bg-white dark:bg-stone-800 px-1.5 py-0.5 rounded-md text-stone-700 dark:text-stone-300 border border-stone-200/70 dark:border-stone-700">
              {state.elapsedSeconds}s
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

