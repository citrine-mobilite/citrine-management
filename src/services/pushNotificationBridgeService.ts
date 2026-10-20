import { soundService } from './soundService';
import { pushNotificationService } from './pushNotificationService';

export interface PushNotificationPayload {
  id?: string;
  title: string;
  message: string;
  senderName?: string;
  senderAvatar?: string;
  type?: 'task_assigned' | 'task_comment' | 'alert' | 'reminder' | 'general' | 'attendance' | 'expense' | 'incident';
  link?: string;
  timestamp?: string;
  exactReceivedTime?: string;
  excludeUserId?: string;
}

type PushListener = (payload: PushNotificationPayload) => void;

class PushNotificationBridgeService {
  private listeners: PushListener[] = [];
  private history: PushNotificationPayload[] = [];
  private bc: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          this.bc = new BroadcastChannel('citrine_push_bridge_channel');
          this.bc.onmessage = (event) => {
            if (event.data?.type === 'INCOMING_PUSH' && event.data.payload) {
              this.handleIncomingPush(event.data.payload, false);
            }
          };
        }
      } catch {}
    }
  }

  public subscribe(listener: PushListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getHistory(): PushNotificationPayload[] {
    return this.history;
  }

  public clearHistory(): void {
    this.history = [];
  }

  private handleIncomingPush(fullPayload: PushNotificationPayload, broadcast = true): void {
    this.history = [fullPayload, ...this.history].slice(0, 50);

    try {
      soundService.playAlertNotification(0.65);
    } catch {}

    if (typeof window !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([120, 60, 120]);
      } catch {}
    }

    // Déclenchement automatique de la notification push native du navigateur / OS
    if (typeof window !== 'undefined') {
      try {
        if ('Notification' in window) {
          if (Notification.permission === 'granted') {
            pushNotificationService.sendNotification(fullPayload.title, {
              body: fullPayload.message,
              tag: fullPayload.id || `citrine-${Date.now()}`,
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              data: { link: fullPayload.link },
            }).catch(() => {});
          } else if (Notification.permission === 'default') {
            Notification.requestPermission().then((perm) => {
              if (perm === 'granted') {
                pushNotificationService.sendNotification(fullPayload.title, {
                  body: fullPayload.message,
                  tag: fullPayload.id || `citrine-${Date.now()}`,
                  icon: '/pwa-192x192.png',
                  badge: '/pwa-192x192.png',
                  data: { link: fullPayload.link },
                }).catch(() => {});
              }
            }).catch(() => {});
          }
        }
      } catch (nativeErr) {
        console.warn('Native notification dispatch notice:', nativeErr);
      }
    }

    this.listeners.forEach((listener) => {
      try {
        listener(fullPayload);
      } catch {}
    });

    if (broadcast && this.bc) {
      try {
        this.bc.postMessage({ type: 'INCOMING_PUSH', payload: fullPayload });
      } catch {}
    }
  }

  public sendPush(payload: PushNotificationPayload): void {
    const fullPayload: PushNotificationPayload = {
      id: `push-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...payload,
    };
    this.handleIncomingPush(fullPayload, true);
  }
}

export const pushNotificationBridgeService = new PushNotificationBridgeService();
