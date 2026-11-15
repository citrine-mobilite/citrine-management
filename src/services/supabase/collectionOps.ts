import { supabase, supabaseAdmin } from '../../lib/supabase';
import { offlineService } from '../offlineService';
import { getSupabaseClient, isUuid, mapCollectionToTable } from './tableMapper';
import { supabaseRowToItem } from './rowToItem';

export async function fetchCollection<T>(collectionName: string): Promise<T[]> {
  try {
    const table = mapCollectionToTable(collectionName);
    const client = getSupabaseClient();
    let query = client.from(table).select('*');

    if (table === 'generic_collections') {
      query = query.eq('collection', collectionName);
    }

    const { data, error } = await query;
    if (error) {
      console.warn(`[Supabase Notice] Table ${table} not yet queryable, falling back to local store:`, error.message);
      return [];
    }

    return (data || []).map((row) => supabaseRowToItem(collectionName, row) as T);
  } catch (err) {
    console.warn(`[Supabase] Erreur de récupération pour ${collectionName}:`, err);
    return [];
  }
}

export async function deleteDocument(collectionName: string, id: string): Promise<boolean> {
  try {
    const table = mapCollectionToTable(collectionName);
    const client = supabaseAdmin || getSupabaseClient();
    const strId = String(id).trim();

    if (table === 'generic_collections') {
      const { error } = await client
        .from('generic_collections')
        .delete()
        .eq('collection', collectionName)
        .eq('doc_id', strId);
      if (error) {
        console.error(`[deleteDocument generic_collections error for ${collectionName}:${strId}]:`, error);
        throw error;
      }
      return true;
    }

    if (table === 'visitor_logs') {
      const { error } = await client
        .from('visitor_logs')
        .delete()
        .eq('doc_id', strId);
      if (error) {
        console.error(`[deleteDocument visitor_logs error for ${strId}]:`, error);
        throw error;
      }
      return true;
    }

    if (/^\d+$/.test(strId)) {
      const { error } = await client.from(table).delete().eq('id', Number(strId));
      if (error) throw error;
    } else if (isUuid(strId)) {
      const { error } = await client.from(table).delete().eq('uid', strId);
      if (error) throw error;
    } else {
      const { error } = await client.from(table).delete().eq('doc_id', strId);
      if (error) throw error;
    }
    return true;
  } catch (err: any) {
    console.error(`[Supabase Delete] Exception deleting from ${collectionName}:`, err);
    throw err;
  }
}

export function subscribeToCollection<T>(collectionName: string, callback: (data: T[]) => void) {
  const table = mapCollectionToTable(collectionName);

  fetchCollection<T>(collectionName).then((items) => {
    offlineService.cacheListLocally(collectionName, items as any);
    callback(items);
  });

  const channelName = `realtime_${table}_${collectionName}_${Date.now()}_${Math.random()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      async () => {
        const updated = await fetchCollection<T>(collectionName);
        offlineService.cacheListLocally(collectionName, updated as any);
        callback(updated);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
