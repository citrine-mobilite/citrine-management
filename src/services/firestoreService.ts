import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { offlineService } from './offlineService';
import {
  Employee,
  Task,
  Reminder,
  Presence,
  GeneratedDocument,
  EmployeeSalaryDebt,
  SalaryPayment,
  FinancialTransaction,
  NotificationLog,
  InventoryItem,
  DisciplinaryIncident,
  DepartmentNode
} from '../types';

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
  PRICING_RECORDS: 'pricing_records',
  PRICING_SETTINGS: 'pricing_settings',
  COMPANY_SETTINGS: 'company_settings',
  BADGE_CODES_16: 'badge_codes_16',
  DYNAMIC_QR_SESSIONS: 'dynamic_qr_sessions',
  CALLS: 'calls',
  USER_PRESENCES: 'user_presences',
  DISCIPLINARY_INCIDENTS: 'disciplinary_incidents',
  ATTENDANCE_INCIDENTS: 'attendance_incidents',
  DEPARTMENTS: 'departments',
  PARTNERS: 'partners',
  RH_DOCUMENT_TEMPLATES: 'rh_document_templates'
} as const;

// Helper to subscribe to a single document in real-time
export function subscribeToDocument<T>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void
) {
  const docRef = doc(db, collectionName, docId);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as T);
    } else {
      callback(null);
    }
  }, (err) => {
    console.warn(`Firestore subscription error on ${collectionName}/${docId}:`, err);
  });
}

// Seed database with mock data if employees collection is empty (DISABLED - real DB data only)
export async function seedFirestoreIfEmpty() {
  try {
    console.log('Database seeding is disabled. Operating strictly on real database data.');
    return;
  } catch (error) {
    console.error('Error in seedFirestoreIfEmpty:', error);
  }
}

// Real-time synchronization hooks helper with offline cache fallback
export function subscribeToCollection<T>(collectionName: string, callback: (data: T[]) => void) {
  const colRef = collection(db, collectionName);

  // First, deliver cached offline data if available
  offlineService.getCachedCollection<T>(collectionName).then((cached) => {
    if (cached && cached.length > 0) {
      callback(cached);
    }
  }).catch(() => {});

  return onSnapshot(colRef, (snapshot) => {
    const list: T[] = snapshot.docs.map((docSnap) => docSnap.data() as T);
    // Cache fresh list locally for offline access
    offlineService.cacheListLocally(collectionName, list as any);
    callback(list);
  }, async (err) => {
    console.warn(`Firestore subscription fallback for ${collectionName} (Offline mode active):`, err);
    // Fallback to local IndexedDB store
    const cachedList = await offlineService.getCachedCollection<T>(collectionName);
    if (cachedList) callback(cachedList);
  });
}

// 🚀 VOLUMETRY & PAGINATION: Optimized subscription with limit and order for large collections (e.g. presences)
export function subscribeToRecentCollection<T>(
  collectionName: string, 
  maxCount: number = 150,
  orderField: string = 'date',
  orderDirection: 'asc' | 'desc' = 'desc',
  callback: (data: T[]) => void
) {
  const colRef = collection(db, collectionName);

  // Deliver cached offline data first
  offlineService.getCachedCollection<T>(collectionName).then((cached) => {
    if (cached && cached.length > 0) {
      callback(cached.slice(0, maxCount));
    }
  }).catch(() => {});

  try {
    const q = query(colRef, orderBy(orderField, orderDirection), limit(maxCount));
    return onSnapshot(q, (snapshot) => {
      const list: T[] = snapshot.docs.map((docSnap) => docSnap.data() as T);
      offlineService.cacheListLocally(collectionName, list as any);
      callback(list);
    }, (err) => {
      console.warn(`Firestore subscription fallback with limit for ${collectionName} (falling back to simple snapshot):`, err);
      // Fallback to simple query on collection
      return onSnapshot(colRef, (simpleSnap) => {
        const list: T[] = simpleSnap.docs.map((docSnap) => docSnap.data() as T);
        offlineService.cacheListLocally(collectionName, list as any);
        callback(list);
      }, async () => {
        const cachedList = await offlineService.getCachedCollection<T>(collectionName);
        if (cachedList) callback(cachedList);
      });
    });
  } catch (err) {
    console.warn(`Could not construct ordered query for ${collectionName}, falling back to simple collection subscribe:`, err);
    return subscribeToCollection<T>(collectionName, callback);
  }
}

// Helper to fetch an older page on demand
export async function fetchOlderRecords<T>(
  collectionName: string,
  lastRecordDate: string,
  pageSize: number = 50,
  orderField: string = 'date'
): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const q = query(
      colRef,
      orderBy(orderField, 'desc'),
      where(orderField, '<', lastRecordDate),
      limit(pageSize)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as T);
  } catch (e) {
    console.warn(`Error fetching older records for ${collectionName}:`, e);
    return [];
  }
}

// Helper to remove undefined properties recursively for Firestore compatibility
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

// Helper to save or update item with offline support
export async function saveDocument<T extends { id: string }>(collectionName: string, item: T) {
  const cleanedItem = removeUndefined(item);

  // Always update local IndexedDB cache immediately for instant offline UI update
  await offlineService.cacheLocally(collectionName, cleanedItem);

  if (!offlineService.isOnline()) {
    console.log(`[Hors-Ligne] Action mise en file d'attente pour ${collectionName}:${item.id}`);
    await offlineService.enqueueAction(collectionName, 'save', cleanedItem);
    return;
  }

  try {
    const ref = doc(db, collectionName, item.id);

    // Conflict resolution: Manager edits take precedence over Employee edits
    if (collectionName === COLLECTIONS.TASKS) {
      try {
        const existingSnap = await getDoc(ref);
        if (existingSnap.exists()) {
          const existingData = existingSnap.data() as any;
          const existingRole = existingData.lastUpdatedByRole;
          const incomingRole = (cleanedItem as any).lastUpdatedByRole;

          const isExistingManager = existingRole === 'Administrateur' || existingRole === 'Responsable';
          const isIncomingEmployee = incomingRole === 'Employé';

          if (isExistingManager && isIncomingEmployee) {
            console.log(`[Conflit Résolu] Rejet de l'écriture de l'employé car le responsable a priorité sur la tâche ${item.id}`);
            // Roll back the local cache so the employee sees the manager's version
            await offlineService.cacheLocally(collectionName, existingData);
            return;
          }
        }
      } catch (err) {
        console.warn('Conflict resolution check failed:', err);
      }
    }

    await setDoc(ref, cleanedItem, { merge: true });
  } catch (error) {
    console.warn(`[Erreur réseau] Échec de sauvegarde Firestore pour ${collectionName}. Mise en file d'attente hors-ligne.`, error);
    await offlineService.enqueueAction(collectionName, 'save', cleanedItem);
  }
}

// Helper for employee salary debt using debt.id as document ID
export async function saveEmployeeSalaryDebt(debt: EmployeeSalaryDebt) {
  const cleanedDebt = removeUndefined(debt);
  await offlineService.cacheLocally(COLLECTIONS.EMPLOYEE_SALARY_DEBT, cleanedDebt);

  if (!offlineService.isOnline()) {
    await offlineService.enqueueAction(COLLECTIONS.EMPLOYEE_SALARY_DEBT, 'save', cleanedDebt);
    return;
  }

  try {
    const ref = doc(db, COLLECTIONS.EMPLOYEE_SALARY_DEBT, debt.id);
    await setDoc(ref, cleanedDebt, { merge: true });
  } catch (error) {
    console.warn('Error saving salary debt to Firestore. Queuing offline:', error);
    await offlineService.enqueueAction(COLLECTIONS.EMPLOYEE_SALARY_DEBT, 'save', cleanedDebt);
  }
}

// Helper to save entire list (sync local changes)
export async function syncListToFirestore<T extends { id?: string; employeeId?: string }>(
  collectionName: string, 
  items: T[],
  idKey: keyof T = 'id'
) {
  for (const item of items) {
    const itemId = (item[idKey] as unknown as string) || (item.employeeId as string) || `item-${Date.now()}`;
    await saveDocument(collectionName, { ...item, id: itemId });
  }
}

// Delete item with offline support
export async function deleteDocument(collectionName: string, id: string) {
  await offlineService.deleteCachedItem(collectionName, id);

  if (!offlineService.isOnline()) {
    console.log(`[Hors-Ligne] Suppression mise en file d'attente pour ${collectionName}:${id}`);
    await offlineService.enqueueAction(collectionName, 'delete', { id });
    return;
  }

  try {
    const ref = doc(db, collectionName, id);
    await deleteDoc(ref);
  } catch (error) {
    console.warn(`Error deleting doc ${id} from ${collectionName} online. Enqueuing offline delete:`, error);
    await offlineService.enqueueAction(collectionName, 'delete', { id });
  }
}

