import * as PusherPushNotifications from '@pusher/push-notifications-web';
import { AppUser } from '../types';

export interface RemoteBeamsPublishParams {
  title: string;
  body: string;
  interests?: string[];
  targetRoles?: string[];
  targetUserIds?: string[];
  targetEmployeeIds?: string[];
  targetEmails?: string[];
  link?: string;
  operationKey?: string;
  data?: Record<string, any>;
}

const remotePublishDedup = new Map<string, number>();

export function normalizeInterestToken(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_\-=@,.;]/g, '_')
    .slice(0, 150);
}

function resolveUserInterests(user: AppUser): string[] {
  const set = new Set<string>(['all-collaborators']);
  const rawRole = String(user.role || '').trim().toLowerCase();

  if (rawRole === 'administrateur' || rawRole === 'admin' || rawRole === 'super_admin') {
    set.add('role-administrateur');
  } else if (rawRole === 'responsable' || rawRole === 'manager') {
    set.add('role-responsable');
  } else if (rawRole === 'stagiaire') {
    set.add('role-stagiaire');
  } else if (rawRole) {
    set.add(`role-${normalizeInterestToken(rawRole)}`);
  }

  if (user.id) {
    set.add(`user-${normalizeInterestToken(user.id)}`);
  }
  if (user.employeeId) {
    set.add(`emp-${normalizeInterestToken(user.employeeId)}`);
  }
  if (user.email) {
    set.add(`email-${normalizeInterestToken(user.email.toLowerCase())}`);
  }

  return Array.from(set);
}

class PusherBeamsClientService {
  private beamsClient: PusherPushNotifications.Client | null = null;
  private cachedInstanceId: string | null = null;
  private configFetched = false;
  private activeUserKey: string | null = null;

  private async resolveInstanceId(): Promise<string> {
    if (this.cachedInstanceId !== null && this.configFetched) {
      return this.cachedInstanceId;
    }

    try {
      const res = await fetch('/api/push/beams/config');
      if (res.ok) {
        const json = await res.json();
        this.configFetched = true;
        this.cachedInstanceId = (json?.instanceId || '').trim();
        return this.cachedInstanceId || '';
      }
    } catch {
      // ignore network notice
    }
    this.configFetched = true;
    this.cachedInstanceId = '';
    return '';
  }

  private async getOrCreateClient(): Promise<PusherPushNotifications.Client | null> {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      return null;
    }
    if (Notification.permission !== 'granted') {
      return null;
    }

    const instanceId = await this.resolveInstanceId();
    if (!instanceId) {
      return null;
    }

    if (this.beamsClient && this.beamsClient.instanceId === instanceId) {
      return this.beamsClient;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      const readyReg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<ServiceWorkerRegistration>((resolve) => setTimeout(() => resolve(registration), 1500)),
      ]);

      this.beamsClient = new PusherPushNotifications.Client({
        instanceId,
        serviceWorkerRegistration: readyReg || registration,
      });
      return this.beamsClient;
    } catch (err) {
      console.warn('[PusherBeamsClient] Init notice:', err);
      return null;
    }
  }

  public async syncUserSubscriptions(user: AppUser | null): Promise<boolean> {
    if (!user) {
      await this.unsubscribeAll();
      return false;
    }

    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return false;
    }

    const client = await this.getOrCreateClient();
    if (!client) return false;

    const userKey = `${user.id}:${user.role}:${user.employeeId || ''}`;
    try {
      await client.start();
      const interests = resolveUserInterests(user);
      await client.setDeviceInterests(interests);
      this.activeUserKey = userKey;
      return true;
    } catch (err) {
      console.warn('[PusherBeamsClient] Subscription notice:', err);
      return false;
    }
  }

  public async unsubscribeAll(): Promise<void> {
    this.activeUserKey = null;
    if (!this.beamsClient) return;
    try {
      await this.beamsClient.clearDeviceInterests();
      await this.beamsClient.stop();
    } catch {
      // ignore cleanup errors
    } finally {
      this.beamsClient = null;
    }
  }

  public async publishBeamsPush(params: RemoteBeamsPublishParams): Promise<void> {
    if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;

    const now = Date.now();
    for (const [k, ts] of remotePublishDedup.entries()) {
      if (now - ts > 60000) remotePublishDedup.delete(k);
    }

    const dedupKey = (params.operationKey || `${params.title}::${params.body}`).trim();
    const last = remotePublishDedup.get(dedupKey);
    if (last && now - last < 12000) {
      return;
    }
    remotePublishDedup.set(dedupKey, now);

    try {
      await fetch('/api/push/beams/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          operationKey: dedupKey,
        }),
      });
    } catch {
      // Offline / network errors must not block UI actions
    }
  }

  public getActiveSubscriptionKey(): string | null {
    return this.activeUserKey;
  }
}

export const pusherBeamsClientService = new PusherBeamsClientService();
