import { ComplianceChecklistItem } from '../types/complianceTypes';
import { ANTIC_CHECKLIST_SEED } from '../data/anticChecklistSeed';
import { mergeSeedWithStoredItems } from '../utils/complianceHelpers';
import {
  COLLECTIONS,
  getCollection,
  subscribeToCollection,
} from './dataService';
import { cloudSqlService } from './cloudSqlService';
import { supabaseService } from './supabaseService';
import { offlineService } from './offlineService';

/**
 * Fetches all stored compliance overrides/custom items and merges them with the official ANTIC reference seed.
 */
export async function fetchComplianceItems(): Promise<ComplianceChecklistItem[]> {
  const stored = await getCollection<ComplianceChecklistItem>(COLLECTIONS.ANTIC_COMPLIANCE);
  return mergeSeedWithStoredItems(ANTIC_CHECKLIST_SEED, stored);
}

/**
 * Subscribes in real-time to ANTIC compliance checklist updates stored in generic_collections.
 */
export function subscribeToComplianceItems(
  callback: (items: ComplianceChecklistItem[]) => void
): () => void {
  let active = true;

  getCollection<ComplianceChecklistItem>(COLLECTIONS.ANTIC_COMPLIANCE)
    .then((stored) => {
      if (!active) return;
      callback(mergeSeedWithStoredItems(ANTIC_CHECKLIST_SEED, stored));
    })
    .catch(() => {});

  const unsub = subscribeToCollection<ComplianceChecklistItem>(
    COLLECTIONS.ANTIC_COMPLIANCE,
    (stored) => {
      if (!active) return;
      if (stored && stored.length > 0) {
        callback(mergeSeedWithStoredItems(ANTIC_CHECKLIST_SEED, stored));
      }
    }
  );

  return () => {
    active = false;
    unsub();
  };
}

/**
 * Saves (upserts) a single compliance item to PostgreSQL/Supabase.
 * Prioritizes the server API to avoid concurrent PostgREST upsert races, with automatic fallback to direct Supabase.
 */
export async function saveComplianceItem(
  item: ComplianceChecklistItem
): Promise<ComplianceChecklistItem> {
  const payload: ComplianceChecklistItem = {
    ...item,
    updatedAt: new Date().toISOString(),
  };

  await offlineService.cacheLocally(COLLECTIONS.ANTIC_COMPLIANCE, payload);

  try {
    const serverSaved = await cloudSqlService.saveDocument(COLLECTIONS.ANTIC_COMPLIANCE, payload);
    if (serverSaved) {
      return serverSaved as ComplianceChecklistItem;
    }
  } catch (serverErr) {
    console.warn('[complianceService] Server save failed, trying direct Supabase:', serverErr);
  }

  return supabaseService.saveDocument<ComplianceChecklistItem>(
    COLLECTIONS.ANTIC_COMPLIANCE,
    payload
  );
}

/**
 * Deletes a custom compliance item deterministically across local cache, server API, and Supabase.
 */
export async function deleteComplianceItem(itemId: string): Promise<boolean> {
  try {
    const cached = await offlineService.getCachedCollection(COLLECTIONS.ANTIC_COMPLIANCE);
    if (cached) {
      const filtered = cached.filter((c: any) => c.id !== itemId);
      await offlineService.cacheListLocally(COLLECTIONS.ANTIC_COMPLIANCE, filtered as any);
    }
  } catch {}

  const [serverRes, supaRes] = await Promise.allSettled([
    cloudSqlService.deleteDocument(COLLECTIONS.ANTIC_COMPLIANCE, itemId),
    supabaseService.deleteDocument(COLLECTIONS.ANTIC_COMPLIANCE, itemId),
  ]);

  if (serverRes.status === 'rejected' && supaRes.status === 'rejected') {
    throw new Error("Impossible de supprimer l'élément de conformité.");
  }

  return true;
}
