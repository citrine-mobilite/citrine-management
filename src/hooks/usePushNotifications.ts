import { useState, useEffect } from 'react';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        return Notification.permission;
      } catch (e) {
        return 'default';
      }
    }
    return 'default';
  });

  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isInIframe, setIsInIframe] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasNotification = 'Notification' in window;
      setIsSupported(hasNotification);

      try {
        const inIframe = window.self !== window.top;
        setIsInIframe(inIframe);
      } catch (e) {
        setIsInIframe(true);
      }

      if (hasNotification) {
        try {
          setPermission(Notification.permission);
        } catch (e) {
          // ignore
        }
      }

      // Proactively register Service Worker if supported
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('[Push] ServiceWorker registration notice:', err);
        });
      }
    }
  }, []);

  const requestPermission = async (): Promise<{ granted: boolean; reason?: string }> => {
    if (typeof window === 'undefined') {
      return { granted: false, reason: 'unsupported' };
    }

    if (!('Notification' in window)) {
      return { granted: false, reason: 'unsupported' };
    }

    try {
      // Modern Promise-based API
      let res: NotificationPermission = 'default';
      try {
        res = await Notification.requestPermission();
      } catch (legacyErr) {
        // Fallback for older browsers using callback syntax
        res = await new Promise((resolve) => {
          Notification.requestPermission((status) => resolve(status));
        });
      }

      setPermission(res);

      if (res === 'granted') {
        // Register SW
        if ('serviceWorker' in navigator) {
          try {
            await navigator.serviceWorker.register('/sw.js');
          } catch (e) {
            console.warn('SW register error:', e);
          }
        }

        // Send welcoming push notification
        sendPushNotification({
          title: 'Citrine Push Activé',
          body: 'Vous recevrez désormais les alertes urgentes et rappels de pointage.',
          icon: '/pwa-192x192.png',
          tag: 'citrine-welcome'
        });

        return { granted: true };
      }

      return { granted: false, reason: res === 'denied' ? 'denied' : 'dismissed' };
    } catch (err: any) {
      console.warn('Notification permission error:', err);
      return { granted: false, reason: err?.message || 'blocked' };
    }
  };

  const sendPushNotification = (payload: PushNotificationPayload): boolean => {
    if (typeof window === 'undefined') return false;

    // 1. If native Notification API is granted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        // Try Service Worker registration first
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(payload.title, {
              body: payload.body,
              icon: payload.icon || '/pwa-192x192.png',
              badge: payload.badge || '/pwa-192x192.png',
              tag: payload.tag || 'citrine-push-' + Date.now(),
              renotify: true,
              data: {
                url: payload.url || '/'
              }
            } as any);
          }).catch(() => {
            // Direct Notification fallback
            new Notification(payload.title, {
              body: payload.body,
              icon: payload.icon || '/pwa-192x192.png',
              badge: payload.badge || '/pwa-192x192.png',
              tag: payload.tag
            });
          });

          // Also postMessage to service worker controller if available
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'SHOW_NOTIFICATION',
              payload: {
                title: payload.title,
                options: {
                  body: payload.body,
                  icon: payload.icon || '/pwa-192x192.png',
                  tag: payload.tag
                }
              }
            });
          }

          return true;
        } else {
          new Notification(payload.title, {
            body: payload.body,
            icon: payload.icon || '/pwa-192x192.png',
            badge: payload.badge || '/pwa-192x192.png'
          });
          return true;
        }
      } catch (e) {
        console.warn('Native notification failed:', e);
      }
    }

    return false;
  };

  return {
    isSupported,
    isInIframe,
    permission,
    requestPermission,
    sendPushNotification
  };
}
