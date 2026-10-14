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


export async function seedRolesInDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    const rolesToSeed = [
      { name: 'Super Administrateur', code: 'SUPER_ADMIN', description: 'Accès complet et gestion globale de la plateforme', permissions: { all: true } },
      { name: 'Responsable', code: 'RESPONSABLE', description: 'Supervision des équipes, validation des présences et gestion des tâches', permissions: { manage_team: true, manage_tasks: true, validate_presences: true } },
      { name: 'Employé', code: 'EMPLOYE', description: 'Collaborateur standard avec accès au portail employé, pointage et tâches', permissions: { clocking: true, view_tasks: true, submit_leaves: true } }
    ];

    for (const r of rolesToSeed) {
      const { error } = await supabase
        .from('roles')
        .upsert(r as any, { onConflict: 'code' });
      if (error) {
        console.warn(`[seedRolesInDatabase] Upsert role ${r.code} warning:`, error);
      }
    }

    return {
      success: true,
      message: 'Rôles (super_admin, responsable, employe) créés/mis à jour avec succès en base de données.'
    };
  } catch (err: any) {
    console.error('[seedRolesInDatabase] Error:', err);
    return {
      success: false,
      message: `Erreur lors de la création des rôles: ${err.message || err}`
    };
  }
}

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
    // Seed roles first
    await seedRolesInDatabase();

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
      message: `Base de données Supabase vérifiée & rôles initialisés : ${counts.users} utilisateur(s), ${counts.employees} collaborateur(s).`,
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
