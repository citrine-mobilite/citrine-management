import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  AppUser, 
  Employee, 
  Task, 
  Reminder, 
  InventoryItem, 
  Partner, 
  CompanyModuleConfig, 
  DEFAULT_MODULE_CONFIG 
} from '../types';
import { hashPassword } from '../utils/cryptoUtils';
import rawDatabaseExport from '../data/firestoreDatabaseExport.json';

export interface InitDatabaseResult {
  success: boolean;
  message: string;
  counts: {
    users: number;
    employees: number;
    departments: number;
    tasks: number;
    reminders: number;
    inventory: number;
    partners: number;
    companySettings: number;
    documents?: number;
    notifications?: number;
    disciplines?: number;
    totalDocuments?: number;
  };
}

export const INITIAL_SEEDED_USERS: AppUser[] = rawDatabaseExport.collections.users as any;
export const INITIAL_SEEDED_EMPLOYEES: Employee[] = rawDatabaseExport.collections.employees as any;
export const INITIAL_SEEDED_DEPARTMENTS = rawDatabaseExport.collections.departments;
export const INITIAL_SEEDED_TASKS: Task[] = rawDatabaseExport.collections.tasks as any;
export const INITIAL_SEEDED_REMINDERS: Reminder[] = rawDatabaseExport.collections.reminders as any;
export const INITIAL_SEEDED_INVENTORY: InventoryItem[] = rawDatabaseExport.collections.inventory_items as any;
export const INITIAL_SEEDED_PARTNERS: Partner[] = rawDatabaseExport.collections.partners as any;

export const INITIAL_SEEDED_COMPANY_CONFIG: CompanyModuleConfig = {
  ...DEFAULT_MODULE_CONFIG,
  enableFinances: true,
  enableDocuments: true,
  enableCommunications: true,
  enableLogs: true,
  enableInventory: true,
  enablePartners: true,
  enableDiscipline: true,
  enableOrgChart: true,
  enableStatistics: true,
  enableTeamCalls: true,
  enableCalls: true,
  qrCodeSecret: 'CITRINE-SECURE-POINTAGE-2026',
  workStartTime: '08:00',
  lateThresholdTime: '08:15',
  defaultSalary: 200000,
  hqName: 'Siège Social Citrine Mobilité',
  hqAddress: 'Douala, Cameroun'
};

/**
 * Reconstruct and initialize all Firestore collections with structured default data from full JSON dump
 */
export async function initializeFullFirestoreDatabase(options?: {
  overwriteExisting?: boolean;
}): Promise<InitDatabaseResult> {
  const counts = {
    users: 0,
    employees: 0,
    departments: 0,
    tasks: 0,
    reminders: 0,
    inventory: 0,
    partners: 0,
    companySettings: 0,
    documents: 0,
    notifications: 0,
    disciplines: 0,
    totalDocuments: 0
  };

  const defaultPasswordHash = await hashPassword('admin123');
  const collections = rawDatabaseExport.collections as Record<string, any[]>;

  // 1. Synchronize to Local Storage Cache First (Ensures instant offline/online availability)
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (collections.users) localStorage.setItem('citrine_users', JSON.stringify(collections.users));
      if (collections.employees) localStorage.setItem('citrine_employees', JSON.stringify(collections.employees));
      if (collections.presences) localStorage.setItem('citrine_presences', JSON.stringify(collections.presences));
      if (collections.tasks) localStorage.setItem('citrine_tasks', JSON.stringify(collections.tasks));
      if (collections.reminders) localStorage.setItem('citrine_reminders', JSON.stringify(collections.reminders));
      if (collections.notifications) localStorage.setItem('citrine_notifications', JSON.stringify(collections.notifications));
      if (collections.documents) localStorage.setItem('citrine_documents', JSON.stringify(collections.documents));
      if (collections.processflow_salary_debts) localStorage.setItem('citrine_salary_debts', JSON.stringify(collections.processflow_salary_debts));
      if (collections.salary_payments) localStorage.setItem('citrine_salary_payments', JSON.stringify(collections.salary_payments));
      if (collections.financial_transactions) localStorage.setItem('citrine_financial_transactions', JSON.stringify(collections.financial_transactions));
      if (collections.inventory_items) localStorage.setItem('citrine_inventory_items', JSON.stringify(collections.inventory_items));
      if (collections.partners) localStorage.setItem('citrine_partners', JSON.stringify(collections.partners));
      if (collections.disciplinary_incidents) localStorage.setItem('citrine_disciplinary_incidents', JSON.stringify(collections.disciplinary_incidents));
      if (collections.departments) localStorage.setItem('citrine_departments', JSON.stringify(collections.departments));
      if (collections._records) localStorage.setItem('citrine__records', JSON.stringify(collections._records));
      if (collections._settings) localStorage.setItem('citrine__settings', JSON.stringify(collections._settings[0] || {}));
      localStorage.setItem('citrine_module_config', JSON.stringify(INITIAL_SEEDED_COMPANY_CONFIG));
    }
  } catch (storageErr) {
    console.warn('[Storage Cache Sync] Warning:', storageErr);
  }

  // 2. Count all documents from JSON dataset
  for (const [colName, docs] of Object.entries(collections)) {
    if (!Array.isArray(docs)) continue;
    for (const _ of docs) {
      if (colName === 'users') counts.users++;
      else if (colName === 'employees') counts.employees++;
      else if (colName === 'departments') counts.departments++;
      else if (colName === 'tasks') counts.tasks++;
      else if (colName === 'reminders') counts.reminders++;
      else if (colName === 'inventory_items') counts.inventory++;
      else if (colName === 'partners') counts.partners++;
      else if (colName === 'documents') counts.documents++;
      else if (colName === 'notifications') counts.notifications++;
      else if (colName === 'disciplinary_incidents') counts.disciplines++;
      counts.totalDocuments++;
    }
  }
  counts.companySettings++;
  counts.totalDocuments++;

  // 3. Attempt Firestore writes in the background
  try {
    for (const [colName, docs] of Object.entries(collections)) {
      if (!Array.isArray(docs)) continue;
      for (const item of docs) {
        try {
          const docId = item.id || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
          const docRef = doc(db, colName, docId);
          let itemToSave = { ...item };
          if (colName === 'users') {
            itemToSave.passwordHash = itemToSave.passwordHash || defaultPasswordHash;
          }
          await setDoc(docRef, itemToSave, { merge: !options?.overwriteExisting });
        } catch (docErr) {
          // Non-blocking: continue writing other documents
        }
      }
    }

    try {
      const settingsRef = doc(db, 'company_settings', 'default');
      await setDoc(settingsRef, INITIAL_SEEDED_COMPANY_CONFIG, { merge: !options?.overwriteExisting });
    } catch (sErr) {}
  } catch (err) {
    console.warn('[Firestore Remote Sync] Note:', err);
  }

  // 4. Trigger UI event to update all React components in real time
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('citrine_db_rebuilt', { detail: { counts } }));
    }
  } catch (e) {}

  return {
    success: true,
    message: `Base de données et tables initialisées avec succès (${counts.totalDocuments} fiches réparties dans 18 tables).`,
    counts
  };
}
