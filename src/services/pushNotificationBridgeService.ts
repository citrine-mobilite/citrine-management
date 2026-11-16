import { soundService } from './soundService';
import { pushNotificationService } from './pushNotificationService';
import { pusherBeamsClientService, RemoteBeamsPublishParams } from './pusherBeamsClientService';

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
  actionKey?: string;
  operationKey?: string;
  suppressLocalNative?: boolean;
  remoteBeams?: Omit<RemoteBeamsPublishParams, 'title' | 'body' | 'link' | 'operationKey'>;
}

type PushListener = (payload: PushNotificationPayload) => void;

export const CITRINE_TAB_SESSION_ID = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

class PushNotificationBridgeService {
  private listeners: PushListener[] = [];
  private history: PushNotificationPayload[] = [];
  private bc: BroadcastChannel | null = null;
  private recentPushKeys: Map<string, number> = new Map();
  private recentContentKeys: Map<string, number> = new Map();

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

  private pruneExpired(map: Map<string, number>, maxAgeMs = 30000): void {
    const now = Date.now();
    for (const [key, timestamp] of map.entries()) {
      if (now - timestamp > maxAgeMs) {
        map.delete(key);
      }
    }
  }

  public markOperationDispatched(operationKey?: string): void {
    if (!operationKey) return;
    this.pruneExpired(this.recentPushKeys);
    this.recentPushKeys.set(operationKey, Date.now());
  }

  public wasOperationRecentlyDispatched(operationKey?: string, windowMs = 15000): boolean {
    if (!operationKey) return false;
    this.pruneExpired(this.recentPushKeys);
    const ts = this.recentPushKeys.get(operationKey);
    return Boolean(ts && Date.now() - ts < windowMs);
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

    if (typeof window !== 'undefined' && !fullPayload.suppressLocalNative) {
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          const tagKey = fullPayload.operationKey || fullPayload.actionKey || fullPayload.id || `citrine-${Date.now()}`;
          pushNotificationService
            .sendNotification(fullPayload.title, {
              body: fullPayload.message,
              tag: tagKey,
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              data: { link: fullPayload.link },
            })
            .catch(() => {});
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
    const now = Date.now();
    this.pruneExpired(this.recentPushKeys);
    this.pruneExpired(this.recentContentKeys);

    const opKey = (payload.operationKey || payload.actionKey || '').trim();
    const contentKey = `${payload.type || 'general'}:${payload.title}:${payload.message}`.trim();

    if (opKey) {
      const lastOp = this.recentPushKeys.get(opKey);
      if (lastOp && now - lastOp < 12000) {
        return;
      }
      this.recentPushKeys.set(opKey, now);
    }

    const lastContent = this.recentContentKeys.get(contentKey);
    if (lastContent && now - lastContent < 8000) {
      return;
    }
    this.recentContentKeys.set(contentKey, now);

    const fullPayload: PushNotificationPayload = {
      id: `push-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...payload,
      operationKey: opKey || undefined,
    };

    if (payload.remoteBeams) {
      pusherBeamsClientService
        .publishBeamsPush({
          title: payload.title,
          body: payload.message,
          link: payload.link,
          operationKey: opKey || contentKey,
          ...payload.remoteBeams,
        })
        .catch(() => {});
    }

    this.handleIncomingPush(fullPayload, true);
  }
}

export const pushNotificationBridgeService = new PushNotificationBridgeService();
