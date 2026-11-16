import { supabase } from '../lib/supabase';

export const COLLECTIONS = {
  EMPLOYEES: 'employees',
  TASKS: 'tasks',
  TASK_PROJECTS: 'task_projects',
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
  ABSENCES: 'absences',
  BUILDING_SUPERVISORS: 'building_supervisors',
  STRATEGIC_PROJECTS: 'strategic_projects',
  USERS: 'users'
} as const;

export function removeUndefined<T>(obj: T): T {
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

export function normalizeDocBeforeSave<T extends { id: string }>(collectionName: string, item: T): any {
  const cleanedItem: any = removeUndefined(item);

  if (collectionName === 'notifications' || collectionName === COLLECTIONS.NOTIFICATIONS) {
    const fallbackText =
      cleanedItem.content ||
      cleanedItem.message ||
      cleanedItem.description ||
      cleanedItem.title ||
      'Notification système';
    if (!cleanedItem.message) cleanedItem.message = fallbackText;
    if (!cleanedItem.content) cleanedItem.content = fallbackText;
    if (!cleanedItem.title) cleanedItem.title = 'Notification';
  }

  if (collectionName === 'presences' || collectionName === COLLECTIONS.PRESENCES) {
    if (!cleanedItem.date) {
      cleanedItem.date = new Date().toISOString().split('T')[0];
    }
  }

  if (collectionName === 'hse_incidents' || collectionName === COLLECTIONS.HSE_INCIDENTS) {
    if (!cleanedItem.date) {
      cleanedItem.date = new Date().toISOString().split('T')[0];
    }
  }

  if (collectionName === 'tasks' || collectionName === COLLECTIONS.TASKS) {
    if (!cleanedItem.title) {
      cleanedItem.title = cleanedItem.description ? cleanedItem.description.slice(0, 50) + '...' : 'Tâche';
    }
  }

  if (collectionName === 'expense_claims' || collectionName === COLLECTIONS.EXPENSE_CLAIMS) {
    if (!cleanedItem.title && cleanedItem.reason) {
      cleanedItem.title = cleanedItem.reason;
    }
    if (!cleanedItem.title) {
      cleanedItem.title = 'Note de frais';
    }
  }

  return cleanedItem;
}

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
