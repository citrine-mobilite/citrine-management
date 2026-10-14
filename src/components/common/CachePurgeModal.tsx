import React, { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle2, RefreshCw, Cpu, Database, HardDrive, Smartphone, X, ShieldAlert } from 'lucide-react';
import { cachePurgeService, CachePurgeProgress } from '../../services/cachePurgeService';
import { haptic } from '../../services/hapticService';

interface CachePurgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CachePurgeModal: React.FC<CachePurgeModalProps> = ({ isOpen, onClose }) => {
  const [isPurging, setIsPurging] = useState(false);
  const [progress, setProgress] = useState<CachePurgeProgress>({
    stage: 'idle',
    message: '',
    percent: 0,
  });

  if (!isOpen) return null;

  const handleStartPurge = async () => {
    haptic.medium();
    setIsPurging(true);

    try {
      await cachePurgeService.purgeAllCaches((p) => {
        setProgress(p);
      });
    } catch (err) {
      console.error('Erreur lors de la purge complète du cache:', err);
      setIsPurging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in-0 duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 text-stone-900 dark:text-stone-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-800/40 text-red-600 dark:text-red-400">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white leading-tight">
                Purge Complète du Cache
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Nettoyage absolu de tous les niveaux de mémoire et de stockage
              </p>
            </div>
          </div>
          {!isPurging && (
            <button
              onClick={() => {
                haptic.light();
                onClose();
              }}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              title="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Diagnostic explanation */}
        <div className="mb-5 bg-stone-50 dark:bg-stone-950/50 border border-stone-200/70 dark:border-stone-800/70 rounded-2xl p-4 text-xs space-y-3">
          <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-semibold">
            <ShieldAlert className="h-4 w-4 text-[#2A7B76]" />
            <span>Niveaux de mémoire et de cache pris en charge :</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-start gap-2 p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60">
              <Cpu className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-stone-800 dark:text-stone-200">1. Cache RAM (Mémoire vive)</strong>
                <span className="text-stone-500 text-[10px]">Singletons JS, Maps mémoires, états React & listeners</span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60">
              <Database className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-stone-800 dark:text-stone-200">2. Cache IndexedDB</strong>
                <span className="text-stone-500 text-[10px]">Fermeture connexion, vidage des 8 tables & suppression DB</span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60">
              <HardDrive className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-stone-800 dark:text-stone-200">3. Stockage Web Local</strong>
                <span className="text-stone-500 text-[10px]">LocalStorage complet, SessionStorage et cookies client</span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60">
              <Smartphone className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-stone-800 dark:text-stone-200">4. Cache PWA / Service Worker</strong>
                <span className="text-stone-500 text-[10px]">Purge de window.caches et désenregistrement des workers</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-stone-500 dark:text-stone-400 italic pt-1 border-t border-stone-200/50 dark:border-stone-800/50">
            ℹ️ Après la purge, l'application effectuera un rechargement propre avec paramètre anti-cache HTTP pour garantir la fraîcheur totale du code.
          </div>
        </div>

        {/* Progress state during purging */}
        {isPurging ? (
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2 text-[#2A7B76]">
                <RefreshCw className="h-4 w-4 animate-spin" />
                {progress.message || 'Purge en cours...'}
              </span>
              <span className="font-mono text-stone-500">{progress.percent}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#2A7B76] to-emerald-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>

            <p className="text-[11px] text-stone-400 dark:text-stone-500 text-center animate-pulse">
              Ne fermez pas la page, réinitialisation automatique dans quelques secondes...
            </p>
          </div>
        ) : (
          /* Action buttons */
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={() => {
                haptic.light();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 transition"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleStartPurge}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold shadow-lg shadow-red-500/25 flex items-center gap-2 transition transform active:scale-95"
            >
              <Trash2 className="h-4 w-4" />
              Purger tous les niveaux de cache
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
