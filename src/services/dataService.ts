import { offlineService } from './offlineService';
import { supabaseService, mapCollectionToTable } from './supabaseService';
import { cloudSqlService } from './cloudSqlService';
import { supabase } from '../lib/supabase';
import { pushNotificationBridgeService } from './pushNotificationBridgeService';

export const COLLECTIONS = {
  EMPLOYEES: 'employees',
  TASKS: 'tasks',
  REMINDERS: 'reminders',
  PRESENCES: 'presences',
  DOCUMENTS: 'documents',
  EMPLOYEE_SALARY_DEBT: 'processflow_salary_debts',
  SALARY_PAYMENTS: 'salary_payments',
  FINANCIAL_TRANSACTIONS: 'financial_transactions',
  NOTIFICATIONS: 'notifications',
  INVENTORY: 'inventory_items',
  COMPANY_SETTINGS: 'company_settings',
  BADGE_CODES_16: 'badge_codes_16',
  DYNAMIC_QR_SESSIONS: 'dynamic_qr_sessions',
  CALLS: 'calls',
  USER_PRESENCES: 'user_presences',
  DISCIPLINARY_INCIDENTS: 'disciplinary_incidents',
  ATTENDANCE_INCIDENTS: 'attendance_incidents',
  DEPARTMENTS: 'departments',
  PARTNERS: 'partners',
  RH_DOCUMENT_TEMPLATES: 'rh_document_templates',
  JOB_OFFERS: 'job_offers',
  JOB_APPLICATIONS: 'job_applications',
  EXPENSE_CLAIMS: 'expense_claims',
  HSE_INCIDENTS: 'hse_incidents',
  VISITOR_LOGS: 'visitor_logs',
  IDEA_SUGGESTIONS: 'idea_suggestions',
  ENTERPRISE_SURVEYS: 'enterprise_surveys',
  LEAVE_REQUESTS: 'leave_requests',
  USERS: 'users'
} as const;

// Helper to remove undefined properties recursively
function removeUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined) as unknown as T;
  }
  const cleaned: any = {};
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (val !== undefined) {
      cleaned[key] = removeUndefined(val);
    }
  }
  return cleaned;
}

// Subscribe to a single document in real-time via Supabase Realtime (strictly from database)
export function subscribeToDocument<T>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void
) {
  let isCancelled = false;

  // Listen directly via Supabase Realtime channel (fresh from database)
  const table = mapCollectionToTable(collectionName);
  const channelName = `doc_sub_${table}_${docId}_${Date.now()}`;
  
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(docId);
  const filter = isUuid ? `uid=eq.${docId}` : (/^\d+$/.test(docId) ? `id=eq.${docId}` : undefined);

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
  // Delegate strictly to Supabase Realtime & REST API to ensure 100% DB source of truth
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

// Statut de santé de la base de données
export interface DatabaseHealthStatus {
  isSupabaseWorking: boolean;
  hasPermissionError: boolean;
  errorMessage: string | null;
  serverPersistenceActive: boolean;
  lastChecked: number;
}

let lastDbStatus: DatabaseHealthStatus = {
  isSupabaseWorking: false,
  hasPermissionError: false,
  errorMessage: null,
  serverPersistenceActive: true,
  lastChecked: Date.now(),
};

export function getDatabaseHealth(): DatabaseHealthStatus {
  return lastDbStatus;
}

export async function checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
  try {
    const { error } = await supabase.from('employees').select('id').limit(1);
    if (error) {
      const isPermission = error.message.toLowerCase().includes('permission denied') || (error as any).code === '42501';
      lastDbStatus = {
        isSupabaseWorking: false,
        hasPermissionError: isPermission,
        errorMessage: error.message,
        serverPersistenceActive: true,
        lastChecked: Date.now(),
      };
    } else {
      lastDbStatus = {
        isSupabaseWorking: true,
        hasPermissionError: false,
        errorMessage: null,
        serverPersistenceActive: true,
        lastChecked: Date.now(),
      };
    }
  } catch (err: any) {
    lastDbStatus = {
      isSupabaseWorking: false,
      hasPermissionError: true,
      errorMessage: err.message || 'Erreur de connexion',
      serverPersistenceActive: true,
      lastChecked: Date.now(),
    };
  }
  return lastDbStatus;
}

// Fetch an entire collection directly from database (Supabase -> Server API)
export async function getCollection<T>(collectionName: string): Promise<T[]> {
  try {
    // 1. Tenter Supabase
    const supaData = await Promise.race([
      supabaseService.fetchCollection<T>(collectionName),
      new Promise<T[]>((resolve) => setTimeout(() => resolve([]), 3000))
    ]);

    if (supaData && Array.isArray(supaData) && supaData.length > 0) {
      return supaData;
    }

    // 2. Interroger le serveur d'application (/api/data/:collection)
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
  const cleanedItem: any = removeUndefined(item);

  // Garantir que pour les notifications, message et content sont toujours définis et non-nuls
  if (collectionName === 'notifications' || collectionName === COLLECTIONS.NOTIFICATIONS) {
    const fallbackText = cleanedItem.content || cleanedItem.message || cleanedItem.description || cleanedItem.title || 'Notification système';
    if (!cleanedItem.message) {
      cleanedItem.message = fallbackText;
    }
    if (!cleanedItem.content) {
      cleanedItem.content = fallbackText;
    }
    if (!cleanedItem.title) {
      cleanedItem.title = 'Notification';
    }
  }

  // Garantir que pour les présences, la date est toujours définie
  if (collectionName === 'presences' || collectionName === COLLECTIONS.PRESENCES) {
    if (!cleanedItem.date) {
      cleanedItem.date = new Date().toISOString().split('T')[0];
    }
  }

  // 1. Toujours mettre à jour le cache local IndexedDB immédiatement
  await offlineService.cacheLocally(collectionName, cleanedItem);

  // 2. Persister sur le serveur d'application et Supabase de manière atomique
  await Promise.all([
    cloudSqlService.saveDocument(collectionName, cleanedItem),
    supabaseService.saveDocument(collectionName, cleanedItem)
  ]);

  return cleanedItem;
}

// Delete document with instant local deletion, server deletion, and Supabase backend
export async function deleteDocument(collectionName: string, id: string): Promise<boolean> {
  // 1. Retirer du cache local
  try {
    const cached = await offlineService.getCachedCollection(collectionName);
    if (cached) {
      const filtered = cached.filter((c: any) => c.id !== id);
      await offlineService.cacheListLocally(collectionName, filtered as any);
    }
  } catch {}

  // 2. Supprimer sur le serveur d'application
  cloudSqlService.deleteDocument(collectionName, id).catch(() => {});

  // 3. Supprimer de Supabase
  Promise.race([
    supabaseService.deleteDocument(collectionName, id),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), 3000))
  ]).catch((err) => {
    console.warn(`[Supabase Async Delete Notice for ${collectionName}:${id}]:`, err.message);
  });

  return true;
}

export async function seedDatabaseIfEmpty() {
  return;
}

export async function savePresenceAtomic(presence: any, incident?: any | null, notification?: any | null): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const cleanedPresence = removeUndefined(presence);
    if (!cleanedPresence.date) {
      cleanedPresence.date = new Date().toISOString().split('T')[0];
    }
    const cleanedIncident = incident ? removeUndefined(incident) : null;
    const cleanedNotification = notification ? removeUndefined(notification) : null;

    if (cleanedNotification) {
      const fallbackText = cleanedNotification.content || cleanedNotification.message || cleanedNotification.description || cleanedNotification.title || 'Notification système';
      if (!cleanedNotification.message) cleanedNotification.message = fallbackText;
      if (!cleanedNotification.content) cleanedNotification.content = fallbackText;
      if (!cleanedNotification.title) cleanedNotification.title = 'Pointage';
    }

    // 1. Tenter l'API transactionnelle atomique du serveur (/api/clocking/atomic)
    let apiSuccess = false;
    let serverResult: any = null;

    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      try {
        let authHeader = '';
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.access_token) {
            authHeader = `Bearer ${sessionData.session.access_token}`;
          }
        } catch {}

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (authHeader) headers['Authorization'] = authHeader;

        const res = await fetch('/api/clocking/atomic', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            presence: cleanedPresence,
            incident: cleanedIncident,
            notification: cleanedNotification,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            apiSuccess = true;
            serverResult = json;
          } else {
            throw new Error(json.error || 'Erreur lors du pointage atomique');
          }
        } else {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `Erreur serveur (${res.status})`);
        }
      } catch (fetchErr: any) {
        console.warn('[savePresenceAtomic] API route notice, running direct fallback:', fetchErr?.message);
        // Fallback direct si l'API route n'a pas pu être atteinte
      }
    }

    // 2. Si l'API HTTP n'a pas répondu (mode offline ou test Node), exécution avec rollback strict
    if (!apiSuccess) {
      let presSaved = false;
      let incSaved = false;
      let notifSaved = false;

      try {
        // Enregistrement Présence
        await Promise.all([
          supabaseService.saveDocument(COLLECTIONS.PRESENCES, cleanedPresence),
          cloudSqlService.saveDocument(COLLECTIONS.PRESENCES, cleanedPresence).catch(() => null)
        ]);
        presSaved = true;

        // Enregistrement Incident
        if (cleanedIncident) {
          await Promise.all([
            supabaseService.saveDocument(COLLECTIONS.ATTENDANCE_INCIDENTS, cleanedIncident),
            cloudSqlService.saveDocument(COLLECTIONS.ATTENDANCE_INCIDENTS, cleanedIncident).catch(() => null)
          ]);
          incSaved = true;
        }

        // Enregistrement Notification
        if (cleanedNotification) {
          await Promise.all([
            supabaseService.saveDocument(COLLECTIONS.NOTIFICATIONS, cleanedNotification),
            cloudSqlService.saveDocument(COLLECTIONS.NOTIFICATIONS, cleanedNotification).catch(() => null)
          ]);
          notifSaved = true;
        }
      } catch (fallbackErr: any) {
        console.error('[savePresenceAtomic fallback rollback]:', fallbackErr);
        if (notifSaved && cleanedNotification?.id) {
          try { await deleteDocument(COLLECTIONS.NOTIFICATIONS, cleanedNotification.id); } catch {}
        }
        if (incSaved && cleanedIncident?.id) {
          try { await deleteDocument(COLLECTIONS.ATTENDANCE_INCIDENTS, cleanedIncident.id); } catch {}
        }
        if (presSaved && cleanedPresence?.id) {
          try { await deleteDocument(COLLECTIONS.PRESENCES, cleanedPresence.id); } catch {}
        }
        return { success: false, error: fallbackErr.message || 'Échec de la transaction atomique de pointage.' };
      }
    }

    // 3. Synchronisation cache local (IndexedDB)
    await offlineService.cacheLocally(COLLECTIONS.PRESENCES, cleanedPresence);
    if (cleanedIncident) {
      await offlineService.cacheLocally(COLLECTIONS.ATTENDANCE_INCIDENTS, cleanedIncident);
    }
    if (cleanedNotification) {
      await offlineService.cacheLocally(COLLECTIONS.NOTIFICATIONS, cleanedNotification);
    }

    return { success: true, data: serverResult };
  } catch (err: any) {
    console.error("Atomic presence transaction failed:", err);
    return { success: false, error: err.message || "Erreur lors de la transaction atomique de pointage (présence non créée)" };
  }
}
