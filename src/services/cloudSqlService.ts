import { supabase } from '../lib/supabase';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
      headers['Authorization'] = `Bearer ${data.session.access_token}`;
    }
  } catch (err) {
    // Non-fatal
  }
  return headers;
}

export const cloudSqlService = {
  async fetchCollection<T>(collectionName: string): Promise<T[]> {
    try {
      const headers = await getAuthHeaders();
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
      if (!res.ok) return item;
      const json = await res.json();
      return json.data || item;
    } catch {
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
