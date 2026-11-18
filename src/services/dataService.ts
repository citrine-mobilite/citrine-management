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
    const saved = await mariaDbService.saveDocument(collectionName, cleanedItem);
    await offlineService.cacheLocally(collectionName, saved || cleanedItem);
    return saved || cleanedItem;
  });
}

export async function deleteDocument(collectionName: string, id: string): Promise<boolean> {
  return asyncActionTrackerService.track('Suppression en cours...', async () => {
    const deleted = await mariaDbService.deleteDocument(collectionName, id);
    const cached = await offlineService.getCachedCollection(collectionName);
    if (cached) await offlineService.cacheListLocally(collectionName, cached.filter((row: any) => row.id !== id) as any);
    return deleted;
  });
}

export async function seedDatabaseIfEmpty(): Promise<void> { return; }
