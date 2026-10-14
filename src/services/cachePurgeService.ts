import { DB_NAME, closeIdbDatabase, clearMemoryFallback, clearAllIdbStores } from '../lib/idb';
import { badgeCodeService } from './badgeCodeService';
import { dynamicQrService } from './dynamicQrService';
import { pushNotificationBridgeService } from './pushNotificationBridgeService';

export interface CachePurgeProgress {
  stage: 'idle' | 'ram' | 'indexeddb' | 'webstorage' | 'serviceworker' | 'completed';
  message: string;
  percent: number;
}

export type CachePurgeListener = (progress: CachePurgeProgress) => void;

class CachePurgeService {
  /**
   * Purge absolue de TOUS les niveaux de cache de l'application :
   * 1. Cache RAM (Mémoire vive JS, Map/Set, singletons, états)
   * 2. Cache IndexedDB (ProcessFlowDB, tables locales, queue offline)
   * 3. Cache WebStorage (LocalStorage, SessionStorage)
   * 4. CacheStorage API & Service Worker (PWA, assets mis en cache)
   * 5. Cookies applicatifs non-HttpOnly
   * 6. Rechargement propre anti-cache HTTP (?cache_purge=timestamp)
   */
  public async purgeAllCaches(onProgress?: CachePurgeListener): Promise<void> {
    const notify = (stage: CachePurgeProgress['stage'], message: string, percent: number) => {
      if (onProgress) {
        onProgress({ stage, message, percent });
      }
    };

    // ==========================================
    // ÉTAPE 1 : CACHE EN RAM (Mémoire Vive JS)
    // ==========================================
    notify('ram', 'Purge de la mémoire vive (RAM) et des états en cache...', 20);
    try {
      // 1.1 Vider le fallback mémoire d'IndexedDB
      clearMemoryFallback();

      // 1.2 Vider les singletons et instances en mémoire
      try {
        if (badgeCodeService && typeof (badgeCodeService as any).clearCache === 'function') {
          (badgeCodeService as any).clearCache();
        }
      } catch {}

      try {
        if (dynamicQrService && typeof (dynamicQrService as any).clearCache === 'function') {
          (dynamicQrService as any).clearCache();
        }
      } catch {}

      try {
        if (pushNotificationBridgeService && typeof pushNotificationBridgeService.clearHistory === 'function') {
          pushNotificationBridgeService.clearHistory();
        }
      } catch {}

      // 1.3 Notifier l'écosystème React pour réinitialiser les caches en RAM
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('citrine:cache_purged', { detail: { timestamp: Date.now() } }));
      }
    } catch (ramErr) {
      console.warn('[CachePurgeService] Avertissement purge RAM:', ramErr);
    }

    // Petite temporisation pour laisser le thread libérer la mémoire
    await new Promise((resolve) => setTimeout(resolve, 150));

    // ==========================================
    // ÉTAPE 2 : CACHE INDEXEDDB (Disque Local)
    // ==========================================
    notify('indexeddb', 'Nettoyage approfondi de la base IndexedDB locale...', 45);
    try {
      // 2.1 Vider le contenu de tous les object stores avant la suppression
      await clearAllIdbStores().catch((err) => {
        console.warn('[CachePurgeService] Avertissement vidage stores IDB:', err);
      });

      // 2.2 Fermer explicitement la connexion ouverte pour éviter l'état "blocked"
      await closeIdbDatabase().catch(() => {});

      // 2.3 Supprimer explicitement la base ProcessFlowDB
      if (typeof window !== 'undefined' && window.indexedDB) {
        await new Promise<void>((resolve) => {
          const deleteReq = window.indexedDB.deleteDatabase(DB_NAME);
          deleteReq.onsuccess = () => resolve();
          deleteReq.onerror = () => resolve();
          deleteReq.onblocked = () => {
            console.warn(`[CachePurgeService] Suppression ${DB_NAME} temporairement bloquée, poursuite...`);
            resolve();
          };
          // Timeout de sécurité au cas où un autre onglet garde la DB ouverte
          setTimeout(resolve, 800);
        });

        // 2.4 Si supporté, supprimer toutes les autres bases locales résiduelles
        if (typeof window.indexedDB.databases === 'function') {
          try {
            const databases = await window.indexedDB.databases();
            for (const dbInfo of databases) {
              if (dbInfo.name) {
                try {
                  window.indexedDB.deleteDatabase(dbInfo.name);
                } catch {}
              }
            }
          } catch {}
        }
      }
    } catch (idbErr) {
      console.warn('[CachePurgeService] Avertissement purge IndexedDB:', idbErr);
    }

    await new Promise((resolve) => setTimeout(resolve, 150));

    // ==========================================
    // ÉTAPE 3 : WEB STORAGE (LocalStorage & SessionStorage)
    // ==========================================
    notify('webstorage', 'Suppression du stockage local et des sessions...', 70);
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch (storageErr) {
      console.warn('[CachePurgeService] Avertissement purge WebStorage:', storageErr);
    }

    // ==========================================
    // ÉTAPE 4 : CACHESTORAGE API & SERVICE WORKER (PWA)
    // ==========================================
    notify('serviceworker', 'Purge du CacheStorage et des Service Workers PWA...', 85);
    try {
      // 4.1 Supprimer tous les caches de CacheStorage (HTML, CSS, JS, images mis en cache)
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheKeys = await window.caches.keys();
        await Promise.all(
          cacheKeys.map((key) => {
            console.log(`[CachePurgeService] Suppression du cache CacheStorage: ${key}`);
            return window.caches.delete(key);
          })
        );
      }

      // 4.2 Désenregistrer ou mettre à jour les Service Workers
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          try {
            await registration.unregister();
            console.log('[CachePurgeService] Service Worker désenregistré avec succès');
          } catch {}
        }
      }
    } catch (swErr) {
      console.warn('[CachePurgeService] Avertissement purge CacheStorage/SW:', swErr);
    }

    // 4.3 Nettoyer les cookies clients non-HttpOnly
    try {
      if (typeof document !== 'undefined' && document.cookie) {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 200));

    notify('completed', 'Tous les niveaux de cache ont été purgés avec succès ! Rechargement...', 100);

    await new Promise((resolve) => setTimeout(resolve, 350));

    // ==========================================
    // ÉTAPE 5 : RECHARGEMENT PROPRE ANTI-CACHE HTTP
    // ==========================================
    if (typeof window !== 'undefined') {
      const cleanUrl = `${window.location.origin}${window.location.pathname}?cache_purge=${Date.now()}`;
      window.location.replace(cleanUrl);
    }
  }
}

export const cachePurgeService = new CachePurgeService();
