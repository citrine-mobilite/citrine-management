import { soundService } from './soundService';
import { pushNotificationService } from './pushNotificationService';
import { formatExactNotificationDate } from '../utils/dateUtils';

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
        const saved = localStorage.getItem('citrine_push_bridge_history');
        if (saved) {
          this.history = JSON.parse(saved);
        }
      } catch {}

      // Cross-tab broadcast channel
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
    try {
      localStorage.removeItem('citrine_push_bridge_history');
    } catch {}
  }

  private handleIncomingPush(fullPayload: PushNotificationPayload, broadcast = true): void {
    let currentUserId = '';
    if (typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem('citrine_current_user');
        if (userStr) {
          const u = JSON.parse(userStr);
          currentUserId = u.id || u.email;
        }
      } catch {}
    }

    if (fullPayload.excludeUserId && currentUserId && fullPayload.excludeUserId === currentUserId) {
      this.history = [fullPayload, ...this.history].slice(0, 50);
      try {
        localStorage.setItem('citrine_push_bridge_history', JSON.stringify(this.history));
      } catch {}
      return;
    }

    // 1. Save to history (max 50 items)
    this.history = [fullPayload, ...this.history].slice(0, 50);
    try {
      localStorage.setItem('citrine_push_bridge_history', JSON.stringify(this.history));
    } catch {}

    // 2. Play alert sound chime
    try {
      soundService.playAlertNotification(0.65);
    } catch {}

    // 3. Trigger device haptic vibration if supported
    if (typeof window !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([120, 60, 120]);
      } catch {}
    }

    // 4. Notify all active subscribers (in-app push popup toast)
    this.listeners.forEach((listener) => {
      try {
        listener(fullPayload);
      } catch (err) {
        console.error('Error in push notification listener:', err);
      }
    });

    // 5. Trigger native browser / OS Push notification if permitted
    try {
      const link = fullPayload.link || '';
      const formattedLink = link.startsWith('#') || link.startsWith('/')
        ? link
        : `/#${link}`;

      pushNotificationService.sendNotification(fullPayload.title, {
        body: fullPayload.message,
        icon: fullPayload.senderAvatar || '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'push-bridge-' + fullPayload.id,
        requireInteraction: true,
        data: {
          url: formattedLink,
          link: fullPayload.link,
          type: fullPayload.type,
          id: fullPayload.id,
        },
        actions: [
          { action: 'consulter', title: 'Consulter 👁️' },
          { action: 'fermer', title: 'Fermer' },
        ],
      } as any);
    } catch (e) {
      console.warn('Native push failed:', e);
    }

    // Broadcast to other tabs if requested
    if (broadcast && this.bc) {
      try {
        this.bc.postMessage({ type: 'INCOMING_PUSH', payload: fullPayload });
      } catch {}
    }
  }

  public sendPush(payload: Omit<PushNotificationPayload, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): void {
    const rawTimestamp = payload.timestamp || new Date().toISOString();
    const fullPayload: PushNotificationPayload = {
      id: payload.id || `push-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: rawTimestamp,
      exactReceivedTime: formatExactNotificationDate(rawTimestamp),
      ...payload,
    };

    this.handleIncomingPush(fullPayload, true);
  }
}

export const pushNotificationBridgeService = new PushNotificationBridgeService();
