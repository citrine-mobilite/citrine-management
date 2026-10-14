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

// Subscribe to a single document in real-time via Supabase Realtime
export function subscribeToDocument<T>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void
) {
  let isCancelled = false;

  // First deliver cached data immediately (< 10ms)
  offlineService.getCachedCollection<T>(collectionName).then((list) => {
    if (isCancelled || !list) return;
    const found = list.find((item: any) => item.id === docId);
    if (found) callback(found);
  }).catch(() => {});

  // Listen via Supabase Realtime channel
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

// Real-time synchronization helper with offline cache fallback
export function subscribeToCollection<T>(collectionName: string, callback: (data: T[]) => void) {
  // 1. Deliver cached offline data immediately (< 10ms)
  offlineService.getCachedCollection<T>(collectionName).then((cached) => {
    if (cached && cached.length > 0) {
      callback(cached);
    }
  }).catch(() => {});

  // 2. Delegate to Supabase Realtime & REST API
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

// Vérifie si l'utilisateur actuellement connecté est un employé
function getActiveEmployeeActor(): { id: string; name: string; role: string; userId?: string } | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem('citrine_current_user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (!user) return null;
    const role = String(user.role || '').toLowerCase();
    const isEmp = role.includes('employ') || role.includes('employee') || role === 'collaborateur';
    if (isEmp) {
      return {
        id: String(user.employeeId || user.id || 'employee'),
        name: String(user.name || 'Employé'),
        role: String(user.role || 'Employé'),
        userId: user.id || user.uid || undefined,
      };
    }
  } catch {}
  return null;
}

// Cache anti-doublon pour garantir UNE SEULE notification par action
const recentActionDedupeMap = new Map<string, number>();
function isActionDuplicate(key: string, ttlMs: number = 4000): boolean {
  const now = Date.now();
  const last = recentActionDedupeMap.get(key);
  if (last && now - last < ttlMs) {
    return true;
  }
  recentActionDedupeMap.set(key, now);
  if (recentActionDedupeMap.size > 150) {
    for (const [k, t] of recentActionDedupeMap.entries()) {
      if (now - t > 15000) recentActionDedupeMap.delete(k);
    }
  }
  return false;
}

// Déclenche une notification automatique pour toute action (hors GET) réalisée par un employé
let isTriggeringNotification = false;
async function triggerAutoEmployeeNotification(
  actionType: 'create' | 'update' | 'delete',
  collectionName: string,
  itemId: string,
  itemData?: any
) {
  // Empêcher toute boucle infinie sur la collection des notifications
  if (collectionName === COLLECTIONS.NOTIFICATIONS || isTriggeringNotification) {
    return;
  }

  // Ne pas doubler les collections qui émettent déjà leur propre notification spécifique dédiée
  if (
    collectionName === COLLECTIONS.LEAVE_REQUESTS || 
    collectionName === COLLECTIONS.ATTENDANCE_INCIDENTS
  ) {
    return;
  }

  // Anti-doublon strict (TTL 4s sur la même action)
  const dedupKey = `${collectionName}:${itemId}:${actionType}`;
  if (isActionDuplicate(dedupKey)) {
    return;
  }

  const employee = getActiveEmployeeActor();
  const isEmployeeResource = [
    COLLECTIONS.PRESENCES,
    COLLECTIONS.EXPENSE_CLAIMS,
    COLLECTIONS.TASKS,
    COLLECTIONS.REMINDERS,
    COLLECTIONS.IDEA_SUGGESTIONS,
    COLLECTIONS.EMPLOYEE_SALARY_DEBT,
  ].includes(collectionName as any);

  // Si l'utilisateur est un employé OU qu'il s'agit d'une action sur une ressource collaborateur
  if (!employee && !isEmployeeResource) {
    return;
  }

  const actorName = employee?.name || itemData?.employeeName || itemData?.userName || 'Un collaborateur';
  const actionVerbs: Record<string, string> = {
    create: 'enregistré une nouvelle entrée',
    update: 'modifié une entrée',
    delete: 'supprimé un élément',
  };
  const verb = actionVerbs[actionType] || 'effectué une action';

  const friendlyCollectionNames: Record<string, string> = {
    [COLLECTIONS.PRESENCES]: 'Pointage & Présence',
    [COLLECTIONS.ATTENDANCE_INCIDENTS]: 'Signalement d\'incident / Retard',
    [COLLECTIONS.LEAVE_REQUESTS]: 'Demande de Congé',
    [COLLECTIONS.EXPENSE_CLAIMS]: 'Note de Frais',
    [COLLECTIONS.TASKS]: 'Tâche de travail',
    [COLLECTIONS.REMINDERS]: 'Rappel / Échéance',
    [COLLECTIONS.IDEA_SUGGESTIONS]: 'Boîte à Idées',
    [COLLECTIONS.EMPLOYEE_SALARY_DEBT]: 'Demande d\'acompte ou de prêt',
  };
  const moduleLabel = friendlyCollectionNames[collectionName] || collectionName;

  const notifId = `notif-emp-act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const notifItem = {
    id: notifId,
    type: 'system',
    recipient: 'Direction & RH',
    title: `🔔 Action Employé : ${actorName}`,
    content: `${actorName} a ${verb} dans le module [${moduleLabel}] (Réf: ${itemId}).`,
    payload: JSON.stringify({
      source: 'auto_employee_action_interceptor',
      actionType,
      collection: collectionName,
      itemId,
      actorName,
      timestamp: new Date().toISOString(),
    }),
    timestamp: new Date().toISOString(),
    read: false,
  };

  try {
    isTriggeringNotification = true;
    // Enregistrer localement et sur le serveur
    await offlineService.cacheLocally(COLLECTIONS.NOTIFICATIONS, notifItem);
    cloudSqlService.saveDocument(COLLECTIONS.NOTIFICATIONS, notifItem).catch(() => {});
    supabaseService.saveDocument(COLLECTIONS.NOTIFICATIONS, notifItem).catch(() => {});

    // Déclencher l'événement pour mettre à jour la bulle de notification instantanément
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('citrine:new_unread_alert', { detail: notifItem }));
    }

    // Diffusion temps réel multi-onglets (Cross-Tab Broadcast)
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('citrine_cross_tab_sync');
        bc.postMessage({ type: 'NEW_NOTIFICATION', notification: notifItem });
        bc.close();
      }
    } catch {}

    // Déclenchement automatique de la notification push pour l'administrateur et la direction (sans polluer l'écran de l'employé émetteur)
    try {
      pushNotificationBridgeService.sendPush({
        id: notifItem.id,
        title: notifItem.title,
        message: notifItem.content,
        senderName: actorName,
        type: 'alert',
        timestamp: notifItem.timestamp,
        link: 'notifications',
        excludeUserId: employee?.id || employee?.userId || undefined,
      });
    } catch {}
  } catch (notifErr) {
    console.warn('Notice notification employé:', notifErr);
  } finally {
    isTriggeringNotification = false;
  }
}

// Fetch an entire collection once (Supabase -> Server API -> Local Cache)
export async function getCollection<T>(collectionName: string): Promise<T[]> {
  try {
    // 1. Tenter Supabase
    const supaData = await Promise.race([
      supabaseService.fetchCollection<T>(collectionName),
      new Promise<T[]>((resolve) => setTimeout(() => resolve([]), 2000))
    ]);

    if (supaData && supaData.length > 0) {
      offlineService.cacheListLocally(collectionName, supaData as any);
      return supaData;
    }

    // 2. Si Supabase est vide ou bloqué, interroger le serveur d'application (/api/data/:collection)
    const serverData = await cloudSqlService.fetchCollection<T>(collectionName);
    if (serverData && serverData.length > 0) {
      offlineService.cacheListLocally(collectionName, serverData as any);
      return serverData;
    }

    // 3. Fallback sur le cache local du navigateur
    const cached = await offlineService.getCachedCollection<T>(collectionName);
    return cached || [];
  } catch (err) {
    console.warn(`Error getting collection ${collectionName}:`, err);
    const cached = await offlineService.getCachedCollection<T>(collectionName);
    return cached || [];
  }
}

// Save or update item with instant cache, server persistence and Supabase backend
export async function saveDocument<T extends { id: string }>(collectionName: string, item: T): Promise<T> {
  const cleanedItem = removeUndefined(item);

  // 1. Toujours mettre à jour le cache local IndexedDB immédiatement (0ms de latence)
  await offlineService.cacheLocally(collectionName, cleanedItem);

  // 2. Persister sur le serveur d'application (/api/data/:collection) -> garanti écrit sur disque
  cloudSqlService.saveDocument(collectionName, cleanedItem).catch((err) => {
    console.warn(`[Server API Save Notice for ${collectionName}:${item.id}]:`, err.message);
  });

  // 3. Envoyer à Supabase
  Promise.race([
    supabaseService.saveDocument(collectionName, cleanedItem),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), 3000))
  ]).catch((err) => {
    console.warn(`[Supabase Async Save Notice for ${collectionName}:${item.id}]:`, err.message);
    if (err.message?.toLowerCase().includes('permission denied')) {
      lastDbStatus.hasPermissionError = true;
    }
  });

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
