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
  HardDrive 
} from 'lucide-react';
import { offlineService, OFFLINE_SYNC_EVENT, NETWORK_STATUS_EVENT, QueuedOfflineAction } from '../services/offlineService';

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
            onToast('Mode Hors-Ligne activé. Vos modifications sont conservées sur votre appareil.', 'info');
          }
        }
      },
      (res) => {
        if (res.syncedCount > 0 && onToast) {
          onToast(`${res.syncedCount} modification(s) synchronisée(s) avec le serveur!`, 'success');
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
      if (onToast) onToast('Veuillez rétablir votre connexion internet pour synchroniser.', 'error');
      return;
    }

    setIsSyncing(true);
    try {
      const res = await offlineService.syncOfflineQueue();
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
      await loadQueue();
      if (onToast) {
        if (res.syncedCount > 0) {
          onToast(`Synchronisation réussie (${res.syncedCount} éléments).`, 'success');
        } else {
          onToast('Toutes les données sont à jour avec le cloud.', 'info');
        }
      }
    } catch {
      if (onToast) onToast('Échec partiel de synchronisation.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && queue.length === 0) {
    return null;
  }

  return (
    <div
      className={`border rounded-2xl p-3 sm:p-3.5 transition shadow-sm ${
        !isOnline
          ? 'bg-amber-50/90 border-amber-300 text-amber-950'
          : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              !isOnline ? 'bg-amber-200/80 text-amber-800' : 'bg-emerald-200/80 text-emerald-800'
            }`}
          >
            {!isOnline ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs">
                {!isOnline ? 'Mode Hors-Ligne (Données locales)' : 'En ligne'}
              </span>
              {queue.length > 0 && (
                <span className="bg-amber-200 text-amber-900 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full">
                  {queue.length} en attente
                </span>
              )}
            </div>
            <p className="text-[11px] opacity-80 mt-0.5">
              {!isOnline
                ? 'Les modifications sont enregistrées localement et seront synchronisées dès le retour d’Internet.'
                : `${queue.length} action(s) locale(s) prête(s) à être synchronisée(s).`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {queue.length > 0 && (
            <button
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              className="px-2.5 py-1.5 rounded-xl border border-stone-300/80 bg-white/70 hover:bg-white text-stone-700 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
            >
              <Database className="h-3.5 w-3.5" />
              <span>Détails</span>
              {isDetailsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}

          {isOnline && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3.5 py-1.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-[11px] rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronisation...' : 'Synchroniser'}</span>
            </button>
          )}
        </div>
      </div>

      {isDetailsOpen && queue.length > 0 && (
        <div className="mt-3 pt-3 border-t border-amber-200/80 space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-amber-900 block">
            File d'attente des modifications locales :
          </span>
          <div className="max-h-36 overflow-y-auto space-y-1 text-[11px]">
            {queue.map((item) => (
              <div
                key={item.id}
                className="bg-white/80 p-2 rounded-xl border border-amber-200 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 truncate">
                  <HardDrive className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                  <span className="font-mono font-bold text-stone-800 uppercase text-[10px]">
                    {item.collection}
                  </span>
                  <span className="text-stone-600 truncate text-[10px]">
                    {item.action === 'set' ? 'Création/Mise à jour' : 'Suppression'} (Doc: {item.docId})
                  </span>
                </div>
                <span className="text-[9px] font-mono text-stone-400 shrink-0">
                  {new Date(item.timestamp).toLocaleTimeString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
