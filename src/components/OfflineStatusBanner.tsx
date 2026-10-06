import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  HardDrive,
  CloudCheck,
  Zap
} from 'lucide-react';
import { offlineService, OFFLINE_SYNC_EVENT, NETWORK_STATUS_EVENT, QueuedOfflineAction } from '../services/offlineService';
import { motion, AnimatePresence } from 'motion/react';

interface OfflineStatusBannerProps {
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  compact?: boolean;
}

export default function OfflineStatusBanner({ onToast, compact = false }: OfflineStatusBannerProps) {
  const [isOnline, setIsOnline] = useState<boolean>(offlineService.isOnline());
  const [queue, setQueue] = useState<QueuedOfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const loadQueue = async () => {
    const pending = await offlineService.getQueue();
    setQueue(pending);
  };

  useEffect(() => {
    loadQueue();

    const cleanup = offlineService.initListeners(
      (online) => {
        setIsOnline(online);
        if (onToast) {
          if (online) {
            onToast('Connexion Internet rétablie. Reprise de la synchronisation...', 'info');
          } else {
            onToast('Mode Hors-Ligne activé. Vos modifications sont conservées en sécurité sur votre appareil.', 'info');
          }
        }
      },
      (res) => {
        if (res.syncedCount > 0 && onToast) {
          onToast(`${res.syncedCount} modification(s) synchronisée(s) automatiquement avec le serveur!`, 'success');
        }
        loadQueue();
      }
    );

    const handleSyncEvent = () => loadQueue();
    const handleNetworkEvent = (e: any) => {
      if (e.detail?.isOnline !== undefined) {
        setIsOnline(e.detail.isOnline);
      }
      loadQueue();
    };

    window.addEventListener(OFFLINE_SYNC_EVENT, handleSyncEvent);
    window.addEventListener(NETWORK_STATUS_EVENT, handleNetworkEvent);

    return () => {
      cleanup();
      window.removeEventListener(OFFLINE_SYNC_EVENT, handleSyncEvent);
      window.removeEventListener(NETWORK_STATUS_EVENT, handleNetworkEvent);
    };
  }, [onToast]);

  const handleManualSync = async () => {
    if (!isOnline) {
      if (onToast) onToast('Veuillez rétablir votre connexion internet pour effectuer la synchronisation.', 'error');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await offlineService.syncOfflineQueue();
      if (result.syncedCount > 0) {
        setLastSyncTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        if (onToast) onToast(`${result.syncedCount} action(s) synchronisée(s) avec succès !`, 'success');
      } else if (result.errors > 0) {
        if (onToast) onToast(`Erreur lors de la synchronisation de ${result.errors} élément(s).`, 'error');
      } else {
        if (onToast) onToast('Toutes vos données sont déjà à jour sur le serveur.', 'info');
      }
    } catch (e) {
      console.error(e);
      if (onToast) onToast('Échec lors de la tentative de synchronisation.', 'error');
    } finally {
      setIsSyncing(false);
      await loadQueue();
    }
  };

  const pendingCount = queue.length;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
            !isOnline
              ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
              : pendingCount > 0
              ? 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-300'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
          }`}
          title={isOnline ? 'Connecté - Synchronisation active' : 'Hors-ligne - Données stockées localement'}
        >
          {!isOnline ? (
            <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          ) : (
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          )}
          <span>{!isOnline ? 'Hors-Ligne' : 'En Ligne'}</span>

          {pendingCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
              {pendingCount}
            </span>
          )}
        </button>

        <AnimatePresence>
          {isDetailsOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              className="absolute top-12 right-4 z-50 w-80 bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-800 p-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                  <span className="font-semibold text-sm text-stone-900 dark:text-stone-100">Statut du Mode Hors-Ligne</span>
                </div>
                <button 
                  onClick={() => setIsDetailsOpen(false)}
                  className="text-stone-400 hover:text-stone-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="py-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                  <span>État du réseau:</span>
                  <span className={`font-semibold ${isOnline ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {isOnline ? 'Connecté (Internet)' : 'Déconnecté (Local)'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                  <span>Stockage Appareil:</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                    <HardDrive className="w-3 h-3 text-stone-500" /> Mémoire Locale Sécurisée
                  </span>
                </div>

                <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                  <span>Actions en attente de synchro:</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                    {pendingCount}
                  </span>
                </div>

                {lastSyncTime && (
                  <div className="flex items-center justify-between text-stone-500 text-[11px]">
                    <span>Dernière synchro:</span>
                    <span>{lastSyncTime}</span>
                  </div>
                )}
              </div>

              {pendingCount > 0 && (
                <div className="mt-2 mb-3 max-h-32 overflow-y-auto space-y-1 bg-stone-50 dark:bg-stone-950 p-2 rounded border border-stone-200 dark:border-stone-800 text-[11px]">
                  <p className="font-semibold text-stone-700 dark:text-stone-300 mb-1">Modifications locales en file d'attente :</p>
                  {queue.map((item) => (
                    <div key={item.id} className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span className="capitalize">{item.collectionName} ({item.actionType})</span>
                      <span className="text-stone-400">{new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex gap-2">
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing || !isOnline}
                  className="w-full flex items-center justify-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`w-full rounded-xl border p-3.5 transition-all ${
      !isOnline
        ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-200'
        : pendingCount > 0
        ? 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-200'
        : 'bg-stone-50 border-stone-200 text-stone-800 dark:bg-stone-900/60 dark:border-stone-800 dark:text-stone-200'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            !isOnline
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
              : pendingCount > 0
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
          }`}>
            {!isOnline ? (
              <WifiOff className="w-5 h-5 animate-pulse" />
            ) : pendingCount > 0 ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Wifi className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm">
                {!isOnline
                  ? 'Mode Hors-Ligne Actif'
                  : pendingCount > 0
                  ? 'Synchronisation en Attente'
                  : 'Mode En Ligne & Synchronisé'}
              </h4>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                !isOnline
                  ? 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100'
                  : 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100'
              }`}>
                Mode Sécurisé Local
              </span>
            </div>
            <p className="text-xs opacity-80 mt-0.5">
              {!isOnline
                ? 'Toutes vos actions (Pointages, Tâches, Bilan) sont automatiquement conservées sur votre appareil.'
                : pendingCount > 0
                ? `${pendingCount} action(s) enregistrée(s) localement prêtes à être envoyées au serveur.`
                : 'Connexion réseau opérationnelle. Vos données sont synchronisées en temps réel.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing || !isOnline}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Synchroniser ({pendingCount})</span>
            </button>
          )}

          <button
            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <span>Détails</span>
            {isDetailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isDetailsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-stone-200/60 dark:border-stone-800/60 text-xs space-y-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-2.5 rounded-lg bg-white/60 dark:bg-stone-900/60 border border-stone-200/50 dark:border-stone-800/50">
                <p className="text-stone-500 font-medium">Pointages & QR Codes</p>
                <p className="text-stone-900 dark:text-stone-100 font-semibold mt-0.5">Enregistrement 100% hors-ligne</p>
              </div>

              <div className="p-2.5 rounded-lg bg-white/60 dark:bg-stone-900/60 border border-stone-200/50 dark:border-stone-800/50">
                <p className="text-stone-500 font-medium">Bilan & Benchmark Pricing</p>
                <p className="text-stone-900 dark:text-stone-100 font-semibold mt-0.5">Calculateur & Export locaux</p>
              </div>

              <div className="p-2.5 rounded-lg bg-white/60 dark:bg-stone-900/60 border border-stone-200/50 dark:border-stone-800/50">
                <p className="text-stone-500 font-medium">File d'attente globale</p>
                <p className="text-stone-900 dark:text-stone-100 font-semibold mt-0.5">{pendingCount} élément(s) en attente</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
