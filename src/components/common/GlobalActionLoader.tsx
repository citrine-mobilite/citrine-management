import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { asyncActionTrackerService, AsyncLoadingState } from '../../services/asyncActionTrackerService';

export const GlobalActionLoader: React.FC = () => {
  const [state, setState] = useState<AsyncLoadingState>(() =>
    asyncActionTrackerService.getState()
  );
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = asyncActionTrackerService.subscribe((newState) => {
      setState(newState);
      if (!newState.isLoading) {
        setIsDismissed(false);
      }
    });
    return unsubscribe;
  }, []);

  if (!state.isLoading || isDismissed) {
    return null;
  }

  return (
    <>
      {/* 1. Barre de progression supérieure animée (Gradient Citrine) */}
      <div className="fixed top-0 left-0 right-0 h-1 z-[9999] overflow-hidden bg-stone-200/50 pointer-events-none">
        <div className="h-full w-full bg-gradient-to-r from-[#2A7B76] via-[#10B981] to-[#2A7B76] animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
      </div>

      {/* 2. Badge flottant discret et élégant pour actions > 1 seconde */}
      <aside aria-label="Indicateur d'action en cours" className="fixed bottom-6 right-6 z-[9998] max-w-sm animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/90 dark:border-stone-800 rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 text-left">
          
          {/* Micro-spinner animé Citrine */}
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center shrink-0">
            <Loader2 className="h-4.5 w-4.5 text-[#2A7B76] dark:text-emerald-400 animate-spin" />
          </div>

          {/* Intitulé de l'action & statut */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-xs text-stone-900 dark:text-stone-100 truncate">
                {state.currentActionLabel || 'Opération en cours...'}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate flex items-center gap-1 mt-0.5">
              <span>Veuillez patienter</span>
              {state.elapsedSeconds > 1 && (
                <span className="text-[10px] bg-stone-100 dark:bg-stone-800 px-1.5 py-0.2 rounded font-mono text-stone-600 dark:text-stone-300">
                  {state.elapsedSeconds}s
                </span>
              )}
            </p>
          </div>

          {/* Bouton pour minimiser en cas d'attente prolongée */}
          {state.elapsedSeconds >= 4 && (
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              title="Masquer le message"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

        </div>
      </aside>
    </>
  );
};
