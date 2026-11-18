import { offlineService } from './offlineService';
import { supabaseService } from './supabaseService';
import { asyncActionTrackerService } from './asyncActionTrackerService';
import {
  COLLECTIONS,
  normalizeDocBeforeSave,
  DatabaseHealthStatus,
  getDatabaseHealth,
  checkDatabaseHealth,
} from './dataNormalizationAndHealth';
import { savePresenceAtomic } from './atomicPresenceService';

export {
  COLLECTIONS,
  getDatabaseHealth,
  checkDatabaseHealth,
  savePresenceAtomic,
};
export type { DatabaseHealthStatus };

// Subscribe to a single document in real-time via MariaDB Server-Sent Events (strictly from database)
export function subscribeToDocument<T>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void
) {
  let isCancelled = false;
  const unsubscribe = subscribeToCollection<T>(collectionName, (items) => {
    if (isCancelled) return;
    const found = items.find((item: any) => String(item.id) === String(docId) || String(item.docId) === String(docId));
    callback(found || null);
  });
  return () => { isCancelled = true; unsubscribe(); };
}

// Real-time synchronization helper directly from database (no stale cache delivery)
export function subscribeToCollection<T>(collectionName: string, callback: (data: T[]) => void) {
  return supabaseService.subscribeToCollection<T>(collectionName, callback);
}

// Volume & Pagination: Optimized subscription
export function subscribeToRecentCollection<T>(
  collectionName: string,
  maxCount: number = 150,
  orderField: string = 'date',
  orderDirection: 'asc' | 'desc' = 'desc',
  callback: (data: T[]) => void
) {
  return subscribeToCollection<T>(collectionName, (data) => {
    callback(data.slice(0, maxCount));
  });
}

// Fetch an older page on demand
export async function fetchOlderRecords<T>(
  collectionName: string,
  lastRecordDate: string,
  pageSize: number = 50,
  orderField: string = 'date'
): Promise<T[]> {
  try {
    const list = await supabaseService.fetchCollection<T>(collectionName);
    return list.slice(0, pageSize);
  } catch (e) {
    console.warn(`Error fetching older records for ${collectionName}:`, e);
    return [];
  }
}

// Fetch an entire collection directement depuis l'API MariaDB
export async function getCollection<T>(collectionName: string): Promise<T[]> {
  try {
    return await supabaseService.fetchCollection<T>(collectionName);
  } catch (err) {
    console.warn(`Error getting collection ${collectionName}:`, err);
    return [];
  }
}

export async function saveDocument<T extends { id: string }>(collectionName: string, item: T): Promise<T> {
  const cleanedItem = normalizeDocBeforeSave(collectionName, item);

  // 1. Toujours mettre à jour le cache local IndexedDB immédiatement
  await offlineService.cacheLocally(collectionName, cleanedItem);

  // 2. Persister sur Supabase directement avec suivi du seuil de 1 seconde
  return asyncActionTrackerService.track('Enregistrement des modifications...', async () => {
    return await supabaseService.saveDocument(collectionName, cleanedItem) || cleanedItem;
  });
}

// Delete document with instant local deletion, server deletion, and Supabase backend
export async function deleteDocument(collectionName: string, id: string): Promise<boolean> {
  try {
    const cached = await offlineService.getCachedCollection(collectionName);
    if (cached) {
      const filtered = cached.filter((c: any) => c.id !== id);
      await offlineService.cacheListLocally(collectionName, filtered as any);
    }
  } catch {}

  return asyncActionTrackerService.track('Suppression en cours...', async () => {
    await supabaseService.deleteDocument(collectionName, id);
    return true;
  });
}

export async function seedDatabaseIfEmpty() {
  return;
}
