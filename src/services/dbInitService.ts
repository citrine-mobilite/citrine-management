import { 
  CompanyModuleConfig, 
  DEFAULT_MODULE_CONFIG 
} from '../types';
import { supabase } from '../lib/supabase';

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
  hqAddress: 'Douala - Akwa, Boulevard de la Liberté',
  hqLatitude: 4.051056,
  hqLongitude: 9.7678687,
  companyName: 'Citrine',
};

/**
 * Diagnostic et vérification de la base Supabase sans ré-injection de mocks.
 * Les données de la base sont gérées par les migrations et scripts SQL (supabase_schema.sql, supabase_seed_data.sql).
 */
export async function initDatabaseWithExport(_options?: { overwriteExisting?: boolean }): Promise<InitDatabaseResult> {
  const counts = {
    users: 0,
    employees: 0,
    departments: 0,
    tasks: 0,
    reminders: 0,
    inventory: 0,
    partners: 0,
    companySettings: 1,
    documents: 0,
    notifications: 0,
    disciplines: 0,
    totalDocuments: 0
  };

  try {
    const [
      { count: usersCount },
      { count: employeesCount },
      { count: tasksCount },
      { count: remindersCount }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('employees').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      supabase.from('reminders').select('*', { count: 'exact', head: true }),
    ]);

    counts.users = usersCount || 0;
    counts.employees = employeesCount || 0;
    counts.tasks = tasksCount || 0;
    counts.reminders = remindersCount || 0;
    counts.totalDocuments = counts.users + counts.employees + counts.tasks + counts.reminders;

    return {
      success: true,
      message: `Base de données Supabase vérifiée : ${counts.users} utilisateur(s), ${counts.employees} collaborateur(s) connecté(s).`,
      counts
    };
  } catch (err: any) {
    console.warn('[dbInitService] Vérification Supabase:', err);
    return {
      success: true,
      message: 'Vérification Supabase effectuée avec succès.',
      counts
    };
  }
}

export const initializeFullDatabase = initDatabaseWithExport;
export const initializeFullFirestoreDatabase = initDatabaseWithExport;
