import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { haptic } from '../../services/hapticService';

export const PwaUpdateToast: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Écouter les mises à jour détectées par le Service Worker
    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);

      // Vérifier activement les nouvelles versions à chaque focus ou intervalle (toutes les 15 minutes)
      const checkForUpdate = () => {
        try {
          reg.update().catch(() => {});
        } catch {}
      };

      const interval = setInterval(checkForUpdate, 15 * 60 * 1000);
      window.addEventListener('focus', checkForUpdate);

      // Si un service worker est en attente d'activation
      if (reg.waiting) {
        setUpdateAvailable(true);
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        }
      });

      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', checkForUpdate);
      };
    });

    // Écouteur de changement de contrôleur
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  const handleApplyUpdate = () => {
    haptic.medium();
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[999999] animate-in slide-in-from-bottom-5 duration-300 max-w-sm w-full">
      <div className="bg-[#14423F] text-white p-4 rounded-3xl shadow-2xl border border-emerald-500/40 backdrop-blur-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-300">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs text-white flex items-center gap-1.5 truncate">
              <span>Mise à jour disponible</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            </h4>
            <p className="text-[11px] text-emerald-100/80 leading-snug">
              Une nouvelle version de Citrine est prête.
            </p>
          </div>
        </div>

        <button
          onClick={handleApplyUpdate}
          className="px-3.5 py-2 bg-[#D4A82F] hover:bg-[#c29827] active:scale-95 text-stone-950 font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer shrink-0"
        >
          Actualiser
        </button>
      </div>
    </div>
  );
};

export default PwaUpdateToast;
