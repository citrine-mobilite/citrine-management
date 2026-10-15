/**
 * Service de Synchronisation Temps Réel (Citrine Management)
 * Combine :
 * 1. Server-Sent Events (SSE) natif haute vélocité vers le serveur Express (/api/realtime/events)
 * 2. BroadcastChannel pour la synchronisation instantanée multi-onglets (< 1ms)
 * 3. Émission d'événements locaux pour actualiser l'interface du responsable sans aucun rechargement
 */

export interface RealtimePresenceEvent {
  presence: any;
  incident?: any | null;
  notification?: any | null;
  timestamp: string;
}

type PresenceListener = (event: RealtimePresenceEvent) => void;

class RealtimeSyncService {
  private listeners: Set<PresenceListener> = new Set();
  private eventSource: EventSource | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private reconnectTimeout: any = null;
  private isConnected = false;

  constructor() {
    this.initBroadcastChannel();
    this.initSSE();
  }

  private initBroadcastChannel() {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;
    try {
      this.broadcastChannel = new BroadcastChannel('citrine_presence_realtime_sync');
      this.broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'REALTIME_PRESENCE_UPDATE' && event.data.payload) {
          this.notifyLocalListeners(event.data.payload);
        }
      };
    } catch (e) {
      console.warn('[RealtimeSync] BroadcastChannel non supporté ou bloqué:', e);
    }
  }

  private initSSE() {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {}
      this.eventSource = null;
    }

    try {
      const es = new EventSource('/api/realtime/events');
      this.eventSource = es;

      es.onopen = () => {
        this.isConnected = true;
      };

      es.addEventListener('connected', () => {
        this.isConnected = true;
      });

      es.addEventListener('presence_update', (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.presence) {
            this.notifyLocalListeners(parsed);
          }
        } catch (err) {
          console.warn('[RealtimeSync] Erreur parsing event presence_update:', err);
        }
      });

      es.onerror = () => {
        this.isConnected = false;
        try {
          es.close();
        } catch {}
        this.eventSource = null;

        // Reconnexion automatique avec léger délai
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => {
          this.initSSE();
        }, 3000);
      };
    } catch (e) {
      console.warn('[RealtimeSync] Erreur initialisation SSE:', e);
    }
  }

  /**
   * Notifie tous les écouteurs locaux et déclenche un événement personnalisé
   */
  private notifyLocalListeners(eventData: RealtimePresenceEvent) {
    for (const listener of this.listeners) {
      try {
        listener(eventData);
      } catch (err) {
        console.error('[RealtimeSync] Erreur dans le listener de présence:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('citrine:realtime_presence_badge', { detail: eventData })
      );
    }
  }

  /**
   * S'abonne aux mises à jour de présence en temps réel
   */
  public subscribeToPresenceUpdates(callback: PresenceListener): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Diffuse un pointage auprès de tous les autres clients et du serveur
   */
  public async broadcastPresencePunch(data: { presence: any; incident?: any | null; notification?: any | null }) {
    const payload: RealtimePresenceEvent = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    // 1. Notification locale immédiate (même session)
    this.notifyLocalListeners(payload);

    // 2. BroadcastChannel pour onglets sur la même machine
    try {
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'REALTIME_PRESENCE_UPDATE',
          payload,
        });
      }
    } catch {}

    // 3. Notification vers le serveur Express pour diffusion SSE à TOUS les autres appareils/sessions (dont le responsable)
    try {
      if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        await fetch('/api/realtime/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'presence_update',
            data: payload,
          }),
        }).catch(() => null);
      }
    } catch {}
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const realtimeSyncService = new RealtimeSyncService();
