import { getApiToken } from './sessionService';

function getAuthHeaders(): Record<string, string> {
  const token = getApiToken();
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export const cloudSqlService = {
  async fetchCollection<T>(collectionName: string): Promise<T[]> {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/data/${collectionName}`, { headers });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  async saveDocument<T extends { id: string }>(collectionName: string, item: T): Promise<T> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/data/${collectionName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(item),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.warn(`[cloudSqlService] Save to ${collectionName} returned ${res.status}:`, errJson.error);
        return item;
      }
      const json = await res.json();
      return json.data || item;
    } catch (err: any) {
      console.warn(`[cloudSqlService] Save to ${collectionName} fetch warning:`, err?.message);
      return item;
    }
  },

  async deleteDocument(collectionName: string, id: string): Promise<boolean> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/data/${collectionName}/${id}`, {
        method: 'DELETE',
        headers,
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async syncUser(user: { uid: string; email: string; name?: string; role?: string }) {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/users/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify(user),
      });
      return res.json();
    } catch {
      return null;
    }
  }
};
