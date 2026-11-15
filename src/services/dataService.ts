import { offlineService } from './offlineService';
import { supabaseService, mapCollectionToTable } from './supabaseService';
import { cloudSqlService } from './cloudSqlService';
import { supabase } from '../lib/supabase';
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

// Subscribe to a single document in real-time via Supabase Realtime (strictly from database)
export function subscribeToDocument<T>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void
) {
  let isCancelled = false;

  const table = mapCollectionToTable(collectionName);
  const channelName = `doc_sub_${table}_${docId}_${Date.now()}`;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(docId);
  const filter = isUuid ? `uid=eq.${docId}` : (/^\d+$/.test(docId) ? `id=eq.${docId}` : undefined);

  (async () => {
    try {
      const supaList = await supabaseService.fetchCollection<T>(collectionName);
      if (!isCancelled && Array.isArray(supaList) && supaList.length > 0) {
        const found = supaList.find((item: any) => item.id === docId || item.docId === docId);
        if (found) {
          callback(found);
          return;
        }
      }

      const serverList = await cloudSqlService.fetchCollection<T>(collectionName);
      if (!isCancelled && Array.isArray(serverList) && serverList.length > 0) {
        const found = serverList.find((item: any) => item.id === docId || item.docId === docId);
        if (found) {
          callback(found);
        }
      }
    } catch {}
  })();

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      filter ? { event: '*', schema: 'public', table, filter } : { event: '*', schema: 'public', table },
      (payload) => {
        if (isCancelled) return;
        if (payload.new && typeof payload.new === 'object') {
          const item = (payload.new as any).raw_data || payload.new;
          callback(item as T);
        }
      }
    )
    .subscribe();

  return () => {
    isCancelled = true;
    supabase.removeChannel(channel);
  };
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

// Fetch an entire collection directly from database (Supabase -> Server API)
export async function getCollection<T>(collectionName: string): Promise<T[]> {
  try {
    const supaData = await Promise.race([
      supabaseService.fetchCollection<T>(collectionName),
      new Promise<T[]>((resolve) => setTimeout(() => resolve([]), 3000)),
    ]);

    if (supaData && Array.isArray(supaData) && supaData.length > 0) {
      return supaData;
    }

    const serverData = await cloudSqlService.fetchCollection<T>(collectionName);
    if (serverData && Array.isArray(serverData)) {
      return serverData;
    }

    return [];
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
    const savedItem = await supabaseService.saveDocument(collectionName, cleanedItem);
    cloudSqlService.saveDocument(collectionName, cleanedItem).catch(() => {});
    return savedItem || cleanedItem;
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
    cloudSqlService.deleteDocument(collectionName, id).catch(() => {});
    await supabaseService.deleteDocument(collectionName, id);
    return true;
  });
}

export async function seedDatabaseIfEmpty() {
  return;
}
