import React, { useState, useEffect } from 'react';
import { pushNotificationBridgeService, PushNotificationPayload } from '../../services/pushNotificationBridgeService';
import { Bell, X, ExternalLink, ShieldCheck, Clock, Info } from 'lucide-react';
import { HeroIconLogo } from '../CMLogo';
import { formatExactNotificationDate, formatExactTimeWithSeconds } from '../../utils/dateUtils';
import { NotificationDetailModal } from './NotificationDetailModal';
import { NotificationLog } from '../../types';

interface PushNotificationPopupContainerProps {
  onNavigateTab?: (tab: string) => void;
}

export const PushNotificationPopupContainer: React.FC<PushNotificationPopupContainerProps> = ({ onNavigateTab }) => {
  const [activeToasts, setActiveToasts] = useState<PushNotificationPayload[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<NotificationLog | null>(null);

  useEffect(() => {
    const unsubscribe = pushNotificationBridgeService.subscribe((payload) => {
      setActiveToasts((prev) => [...prev.slice(-3), payload]);

      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => {
        setActiveToasts((prev) => prev.filter((t) => t.id !== payload.id));
      }, 10000);

      return () => clearTimeout(timer);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const dismissToast = (id?: string) => {
    if (!id) return;
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleOpenDetail = (toast: PushNotificationPayload) => {
    const notifLog: NotificationLog = {
      id: toast.id || `notif-${Date.now()}`,
      title: toast.title,
      content: toast.message,
      type: (toast.type as any) || 'system',
      timestamp: toast.timestamp || new Date().toISOString(),
      recipient: 'Moi / Direction RH',
      read: true,
      link: toast.link,
      payload: JSON.stringify({ senderName: toast.senderName, type: toast.type, link: toast.link }),
    };
    setSelectedDetail(notifLog);
  };

  return (
    <>
      {activeToasts.length > 0 && (
        <div className="fixed top-20 right-6 z-50 flex flex-col space-y-3 max-w-sm w-full px-4 pointer-events-none animate-in slide-in-from-top-6 duration-300">
          {activeToasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-[#2A7B76]/30 dark:border-[#2A7B76]/50 overflow-hidden transition-all transform hover:scale-[1.02]"
            >
              {/* Push Header */}
              <div className="bg-gradient-to-r from-[#2A7B76] via-emerald-800 to-[#2A7B76] text-white px-4 py-3 flex items-center justify-between border-b border-emerald-700/40">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-2xl bg-white/25 border border-white/40 flex items-center justify-center text-white shadow-inner">
                    <HeroIconLogo size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] font-bold tracking-wide uppercase text-emerald-100 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Citrine Push
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-200/90 font-medium block truncate max-w-[180px]">
                      {toast.senderName ? `Par ${toast.senderName}` : 'Notification Officielle'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-emerald-100 font-mono bg-black/25 px-2 py-0.5 rounded-full border border-white/20" title="Heure de réception exacte">
                    {formatExactTimeWithSeconds(toast.timestamp)}
                  </span>
                  <button
                    onClick={() => dismissToast(toast.id)}
                    className="text-white/80 hover:text-white p-1 rounded-xl hover:bg-white/20 transition-colors"
                    title="Fermer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Exact second timestamp sub-banner */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 px-4 py-1.5 border-b border-emerald-100/50 dark:border-emerald-900/30 flex items-center justify-between text-[10px] text-emerald-800 dark:text-emerald-300 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#2A7B76]" />
                  {toast.exactReceivedTime || formatExactNotificationDate(toast.timestamp)}
                </span>
              </div>

              {/* Body */}
              <div className="p-4 bg-gradient-to-b from-stone-50/50 to-white dark:from-stone-900 dark:to-stone-900/95">
                <h4 className="font-bold text-stone-900 dark:text-white text-sm tracking-tight mb-1 flex items-center gap-2">
                  {toast.title}
                </h4>

                <p className="text-stone-700 dark:text-stone-300 text-xs leading-relaxed mb-3.5 bg-white/80 dark:bg-stone-800/80 p-3 rounded-2xl border border-stone-200/70 dark:border-stone-700/60 shadow-xs">
                  {toast.message}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 dark:border-stone-800">
                  <button
                    onClick={() => handleOpenDetail(toast)}
                    className="text-[10px] text-[#2A7B76] dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" /> Voir le détail
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => dismissToast(toast.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
                    >
                      Fermer
                    </button>
                    {toast.link && onNavigateTab && (
                      <button
                        onClick={() => {
                          dismissToast(toast.id);
                          onNavigateTab(toast.link!);
                        }}
                        className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-[#2A7B76] to-emerald-800 hover:from-[#23635f] hover:to-emerald-900 text-white rounded-xl shadow-md flex items-center space-x-1.5 transition-all transform active:scale-95 cursor-pointer"
                      >
                        <span>Consulter</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDetail && (
        <NotificationDetailModal
          notification={selectedDetail}
          onClose={() => setSelectedDetail(null)}
          onNavigate={onNavigateTab}
        />
      )}
    </>
  );
};
