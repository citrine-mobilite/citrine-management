import { offlineService } from '../offlineService';
import { getApiToken, clearSecureSession } from '../sessionService';
import { clearIdbUserDataStores } from '../../lib/idb';

function authHeaders(): Record<string, string> {
  const token = getApiToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchCollection<T>(collectionName: string): Promise<T[]> {
  try {
    const response = await fetch(`/api/data/${encodeURIComponent(collectionName)}`, { headers: authHeaders() });
    const result = await response.json().catch(() => ({}));
    if (response.status === 401) {
      await clearIdbUserDataStores();
      clearSecureSession();
      return [];
    }
    if (response.status === 403 || response.status === 404) {
      await offlineService.cacheListLocally(collectionName, []);
      return [];
    }
    if (!response.ok || !result.success) throw new Error(result.error || `API MariaDB indisponible (${response.status})`);
    return Array.isArray(result.data) ? result.data as T[] : [];
  } catch (error) {
    console.warn(`[MariaDB] Lecture impossible pour ${collectionName}:`, error);
    return (await offlineService.getCachedCollection<T>(collectionName)) || [];
  }
}

export async function deleteDocument(collectionName: string, id: string): Promise<boolean> {
  const response = await fetch(`/api/data/${encodeURIComponent(collectionName)}/${encodeURIComponent(id)}`, {
    method: 'DELETE', headers: authHeaders(),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) throw new Error(result.error || 'Suppression MariaDB impossible.');
  return true;
}

export async function saveDocument<T extends { id: string }>(collectionName: string, item: T): Promise<T> {
  const response = await fetch(`/api/data/${encodeURIComponent(collectionName)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(item),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) throw new Error(result.error || 'Enregistrement MariaDB impossible.');
  return (result.data || item) as T;
}

export function subscribeToCollection<T>(collectionName: string, callback: (data: T[]) => void) {
  let active = true;
  const refresh = async () => {
    const items = await fetchCollection<T>(collectionName);
    if (!active) return;
    await offlineService.cacheListLocally(collectionName, items as any).catch(() => {});
    callback(items);
  };
  void refresh();

  let source: EventSource | null = null;
  if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
    try {
      source = new EventSource('/api/realtime/events');
      const onUpdate = (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          if (!payload.collection || payload.collection === collectionName) void refresh();
        } catch { void refresh(); }
      };
      source.addEventListener('collection_update', onUpdate as EventListener);
      if (['presences','attendance_incidents','notifications'].includes(collectionName)) {
        source.addEventListener('presence_update', () => void refresh());
      }
    } catch (error) {
      console.warn('[MariaDB realtime] SSE indisponible:', error);
    }
  }

  return () => {
    active = false;
    source?.close();
  };
}
