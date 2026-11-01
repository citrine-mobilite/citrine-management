import React, { useState, useEffect } from 'react';
import { pushNotificationBridgeService, PushNotificationPayload } from '../../services/pushNotificationBridgeService';
import { Bell, X, ExternalLink, Info } from 'lucide-react';
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

  const [permStatus, setPermStatus] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });
  const [hidePermBanner, setHidePermBanner] = useState(false);

  const handleRequestNativePermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setPermStatus(res);
        if (res === 'granted') {
          await pushNotificationBridgeService.sendPush({
            title: 'Push Notifications Activées',
            message: 'Vous recevrez désormais les alertes de pointage et de missions directement sur votre écran.',
            senderName: 'Système Citrine',
            type: 'alert',
          });
        }
      } catch (e) {
        console.warn('Error requesting permission:', e);
      }
    }
  };

  return (
    <>
      {/* Floating Push Activation Helper - Material Design White Card */}
      {permStatus === 'default' && !hidePermBanner && (
        <aside
          aria-label="Autorisation des notifications"
          className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[99998] animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 p-3.5 rounded-2xl shadow-xl border border-stone-200/90 dark:border-stone-800 flex items-center justify-between gap-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                  Notifications sur écran
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                  Alertes de pointage et missions en direct
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleRequestNativePermission}
                className="bg-stone-900 hover:bg-black active:scale-95 text-white text-xs font-medium px-3 py-1.5 rounded-xl transition shadow-xs cursor-pointer"
              >
                Activer
              </button>
              <button
                onClick={() => setHidePermBanner(true)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-full transition cursor-pointer"
                title="Masquer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Push Notification Cards - Clean Material Design (White surfaces, refined typography) */}
      {activeToasts.length > 0 && (
        <aside
          aria-label="Flux de notifications push"
          className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[99999] flex flex-col space-y-2.5 pointer-events-none animate-in slide-in-from-top-6 duration-300"
        >
          {activeToasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto bg-white dark:bg-stone-900 rounded-2xl shadow-xl shadow-stone-900/10 border border-stone-200/90 dark:border-stone-800 overflow-hidden transition-all transform hover:scale-[1.005]"
            >
              {/* Material Header: Logo, App title, time and close */}
              <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-stone-100 dark:border-stone-800/80">
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-white border border-stone-200/80 p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
                    <img src="/citrine-logo.png" alt="Citrine" className="h-full w-full object-contain" />
                  </div>
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                      Citrine Management
                    </span>
                    <span className="text-stone-300 dark:text-stone-700">•</span>
                    <span className="text-[11px] text-stone-400 font-mono">
                      {formatExactTimeWithSeconds(toast.timestamp)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => dismissToast(toast.id)}
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
                  title="Fermer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Material Content: Title & message on pure white */}
              <div className="px-4 py-3 bg-white dark:bg-stone-900">
                <h4 className="font-semibold text-stone-900 dark:text-white text-xs leading-snug tracking-tight mb-1">
                  {toast.title}
                </h4>

                <p className="text-stone-600 dark:text-stone-300 text-xs leading-relaxed">
                  {toast.message}
                </p>

                {toast.senderName && (
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1.5 font-medium">
                    Émis par : {toast.senderName}
                  </p>
                )}

                {/* Material Footer Actions */}
                <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-stone-100 dark:border-stone-800/80">
                  <button
                    onClick={() => handleOpenDetail(toast)}
                    className="text-[11px] text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Info className="w-3.5 h-3.5 text-stone-400" />
                    <span>Détails</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => dismissToast(toast.id)}
                      className="px-2.5 py-1 text-xs font-medium text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                    >
                      Fermer
                    </button>
                    {toast.link && onNavigateTab && (
                      <button
                        onClick={() => {
                          dismissToast(toast.id);
                          onNavigateTab(toast.link!);
                        }}
                        className="px-3 py-1 text-xs font-medium bg-stone-900 hover:bg-black text-white rounded-lg shadow-2xs flex items-center space-x-1.5 transition-all transform active:scale-95 cursor-pointer"
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
        </aside>
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
