import { offlineService } from './offlineService';
import { mariaDbService } from './mariaDbService';
import { asyncActionTrackerService } from './asyncActionTrackerService';
import {
  COLLECTIONS, normalizeDocBeforeSave, type DatabaseHealthStatus,
  getDatabaseHealth, checkDatabaseHealth,
} from './dataNormalizationAndHealth';
import { savePresenceAtomic } from './atomicPresenceService';

export { COLLECTIONS, getDatabaseHealth, checkDatabaseHealth, savePresenceAtomic };
export type { DatabaseHealthStatus };

export function subscribeToDocument<T>(collectionName: string, docId: string, callback: (data: T | null) => void) {
  let active = true;
  const unsubscribe = subscribeToCollection<T>(collectionName, items => {
    if (!active) return;
    const found = items.find((item: any) => String(item.id) === String(docId) || String(item.docId) === String(docId));
    callback(found || null);
  });
  return () => { active = false; unsubscribe(); };
}

export function subscribeToCollection<T>(collectionName: string, callback: (data: T[]) => void) {
  return mariaDbService.subscribeToCollection<T>(collectionName, callback);
}

export function subscribeToRecentCollection<T>(
  collectionName: string, maxCount = 150, _orderField = 'date',
  _orderDirection: 'asc' | 'desc' = 'desc', callback: (data: T[]) => void
) {
  return subscribeToCollection<T>(collectionName, data => callback(data.slice(0, maxCount)));
}

export async function fetchOlderRecords<T>(
  collectionName: string, _lastRecordDate: string, pageSize = 50, _orderField = 'date'
): Promise<T[]> {
  const list = await mariaDbService.fetchCollection<T>(collectionName);
  return list.slice(0, pageSize);
}

export async function getCollection<T>(collectionName: string): Promise<T[]> {
  return mariaDbService.fetchCollection<T>(collectionName);
}

export async function saveDocument<T extends { id: string }>(collectionName: string, item: T): Promise<T> {
  const cleanedItem = normalizeDocBeforeSave(collectionName, item);
  return asyncActionTrackerService.track('Enregistrement des modifications...', async () => {
    try {
      const saved = await mariaDbService.saveDocument(collectionName, cleanedItem);
      await offlineService.cacheLocally(collectionName, saved || cleanedItem);
      return saved || cleanedItem;
    } catch (error: any) {
      const offline = !offlineService.isOnline() || error instanceof TypeError ||
        /fetch|network|indisponible|timeout/i.test(String(error?.message || ''));
      if (!offline) throw error;
      await offlineService.cacheLocally(collectionName, cleanedItem);
      await offlineService.enqueueAction(collectionName, 'save', cleanedItem);
      return cleanedItem;
    }
  });
}

export async function deleteDocument(collectionName: string, id: string): Promise<boolean> {
  return asyncActionTrackerService.track('Suppression en cours...', async () => {
    try {
      const deleted = await mariaDbService.deleteDocument(collectionName, id);
      await offlineService.deleteCachedItem(collectionName, id);
      return deleted;
    } catch (error: any) {
      const offline = !offlineService.isOnline() || error instanceof TypeError ||
        /fetch|network|indisponible|timeout/i.test(String(error?.message || ''));
      if (!offline) throw error;
      await offlineService.deleteCachedItem(collectionName, id);
      await offlineService.enqueueAction(collectionName, 'delete', id);
      return true;
    }
  });
}

export async function seedDatabaseIfEmpty(): Promise<void> { return; }
