import { dbPromise } from '../lib/idb';
import { supabaseService } from './supabaseService';
import { sendBatchedOfflineWhatsappNotifications } from './notificationSender';
import { NotificationLog } from '../types';

export interface QueuedOfflineAction {
  id: string;
  collectionName: string;
  actionType: 'save' | 'delete';
  payload: any;
  timestamp: string;
}

export const OFFLINE_SYNC_EVENT = 'processflow_offline_sync';
export const NETWORK_STATUS_EVENT = 'processflow_network_status';

export const offlineService = {
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  // 🛡️ PERSISTENT STORAGE: Ask browser to never purge IndexedDB under disk pressure
  async requestPersistentStorage(): Promise<{ persisted: boolean; quotaMb?: number; usageMb?: number }> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        const isPersistedAlready = await navigator.storage.persisted();
        let persisted = isPersistedAlready;
        if (!isPersistedAlready) {
          persisted = await navigator.storage.persist();
        }
        
        let quotaMb = 0;
        let usageMb = 0;
        if (navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          quotaMb = estimate.quota ? Math.round(estimate.quota / (1024 * 1024)) : 0;
          usageMb = estimate.usage ? Math.round((estimate.usage / (1024 * 1024)) * 100) / 100 : 0;
        }

        console.log(`[Storage Persistence] État persistant: ${persisted}, Utilisé: ${usageMb}MB / Quota: ${quotaMb}MB`);
        return { persisted, quotaMb, usageMb };
      } catch (e) {
        console.warn('Storage persistence request failed:', e);
        return { persisted: false };
      }
    }
    return { persisted: false };
  },

  // Save an action in the offline queue when offline or when network fails
  async enqueueAction(
    collectionName: string,
    actionType: 'save' | 'delete',
    payload: any
  ): Promise<QueuedOfflineAction> {
    const queueId = `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const action: QueuedOfflineAction = {
      id: queueId,
      collectionName,
      actionType,
      payload,
      timestamp: new Date().toISOString()
    };

    try {
      const idb = await dbPromise;
      await idb.put('offline_queue', action);
      console.log(`[Offline Queue] Action mise en attente (${actionType} ${collectionName}) :`, action.id);
      this.notifySyncStateChange();
    } catch (e) {
      console.error('Failed to enqueue offline action:', e);
    }

    return action;
  },

  async getQueue(): Promise<QueuedOfflineAction[]> {
    try {
      const idb = await dbPromise;
      return await idb.getAll('offline_queue');
    } catch (e) {
      console.error('Failed to get offline queue:', e);
      return [];
    }
  },

  async removeQueueAction(id: string): Promise<void> {
    try {
      const idb = await dbPromise;
      await idb.delete('offline_queue', id);
      this.notifySyncStateChange();
    } catch (e) {
      console.error('Failed to remove action from queue:', e);
    }
  },

  async clearQueue(): Promise<void> {
    try {
      const idb = await dbPromise;
      await idb.clear('offline_queue');
      this.notifySyncStateChange();
    } catch (e) {
      console.error('Failed to clear offline queue:', e);
    }
  },

  // Helpers for local IDB caching
  async cacheLocally<T extends { id: string }>(storeName: string, item: T): Promise<void> {
    try {
      const idb = await dbPromise;
      if (idb.objectStoreNames.contains(storeName as any)) {
        await idb.put(storeName as any, item);
      }
    } catch (e) {
      console.error(`Error caching item in ${storeName}:`, e);
    }
  },

  async cacheListLocally<T extends { id: string }>(storeName: string, items: T[]): Promise<void> {
    try {
      const idb = await dbPromise;
      if (idb.objectStoreNames.contains(storeName as any)) {
        const tx = idb.transaction(storeName as any, 'readwrite');
        await tx.store.clear();
        for (const item of items) {
          if (item && item.id) {
            await tx.store.put(item);
          }
        }
        await tx.done;
      }
    } catch (e) {
      console.error(`Error caching list in ${storeName}:`, e);
    }
  },

  async getCachedCollection<T>(storeName: string): Promise<T[]> {
    try {
      const idb = await dbPromise;
      if (idb.objectStoreNames.contains(storeName as any)) {
        return (await idb.getAll(storeName as any)) as T[];
      }
    } catch (e) {
      console.error(`Error reading cached collection ${storeName}:`, e);
    }
    return [];
  },

  async deleteCachedItem(storeName: string, id: string): Promise<void> {
    try {
      const idb = await dbPromise;
      if (idb.objectStoreNames.contains(storeName as any)) {
        await idb.delete(storeName as any, id);
      }
    } catch (e) {
      console.error(`Error deleting cached item ${id} from ${storeName}:`, e);
    }
  },

  // Process the queued offline actions to sync with Supabase
  async syncOfflineQueue(): Promise<{ success: boolean; syncedCount: number; errors: number }> {
    if (!this.isOnline()) {
      return { success: false, syncedCount: 0, errors: 0 };
    }

    const queue = await this.getQueue();
    if (queue.length === 0) {
      return { success: true, syncedCount: 0, errors: 0 };
    }

    let syncedCount = 0;
    let errors = 0;
    const queuedNotificationsToBatch: NotificationLog[] = [];

    for (const action of queue) {
      try {
        if (action.actionType === 'save') {
          const docId = action.payload.id || action.payload.employeeId;
          if (docId) {
            await supabaseService.saveDocument(action.collectionName, action.payload);
          }
          if (action.collectionName === 'notifications' && action.payload && action.payload.type === 'whatsapp') {
            queuedNotificationsToBatch.push(action.payload as NotificationLog);
          }
        } else if (action.actionType === 'delete') {
          const docId = typeof action.payload === 'string' ? action.payload : action.payload.id;
          if (docId) {
            await supabaseService.deleteDocument(action.collectionName, docId);
          }
        }
        // Successfully synced to Supabase, remove from queue
        await this.removeQueueAction(action.id);
        syncedCount++;
      } catch (err) {
        console.error(`Failed to sync action ${action.id}:`, err);
        errors++;
      }
    }

    // 📱 BATCH WHATSAPP NOTIFICATIONS: Send 1 aggregated WhatsApp per recipient upon reconnection!
    if (queuedNotificationsToBatch.length > 0) {
      try {
        await sendBatchedOfflineWhatsappNotifications(queuedNotificationsToBatch);
      } catch (batchErr) {
        console.error("Error batching WhatsApp notifications upon reconnection:", batchErr);
      }
    }

    this.notifySyncStateChange();
    return { success: errors === 0, syncedCount, errors };
  },

  notifySyncStateChange() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_EVENT));
    }
  },

  notifyNetworkChange(isOnline: boolean) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(NETWORK_STATUS_EVENT, { detail: { isOnline } }));
    }
  },

  initListeners(
    onStatusChange?: (isOnline: boolean) => void,
    onAutoSync?: (res: { syncedCount: number }) => void
  ) {
    if (typeof window === 'undefined') return () => {};

    const handleOnline = async () => {
      this.notifyNetworkChange(true);
      if (onStatusChange) onStatusChange(true);
      
      // Auto sync queued offline actions upon reconnection
      const result = await this.syncOfflineQueue();
      if (result.syncedCount > 0 && onAutoSync) {
        onAutoSync({ syncedCount: result.syncedCount });
      }
    };

    const handleOffline = () => {
      this.notifyNetworkChange(false);
      if (onStatusChange) onStatusChange(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
};
