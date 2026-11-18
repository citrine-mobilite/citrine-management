import { DEFAULT_MODULE_CONFIG } from '../types';
import { getCollection, saveDocument } from './dataService';

export interface InitDatabaseResult {
  success: boolean;
  message: string;
  counts: {
    users: number; employees: number; departments: number; tasks: number;
    reminders: number; inventory: number; partners: number; companySettings: number;
    documents?: number; notifications?: number; disciplines?: number; totalDocuments?: number;
  };
}

export async function seedRolesInDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    const roles = [
      { id: 'role_super_admin', name: 'Super Administrateur', code: 'SUPER_ADMIN',
        description: 'Accès complet et gestion globale de la plateforme', permissions: { all: true } },
      { id: 'role_responsable', name: 'Responsable', code: 'RESPONSABLE',
        description: 'Supervision des équipes, validation des présences et gestion des tâches',
        permissions: { manage_team: true, manage_tasks: true, validate_presences: true } },
      { id: 'role_employe', name: 'Employé', code: 'EMPLOYE',
        description: 'Collaborateur standard avec accès au portail employé, pointage et tâches',
        permissions: { clocking: true, view_tasks: true, submit_leaves: true } },
    ];
    for (const role of roles) await saveDocument('roles', role as any);
    return { success: true, message: 'Rôles de référence vérifiés dans MariaDB.' };
  } catch (error: any) {
    return { success: false, message: error?.message || 'Impossible de vérifier les rôles MariaDB.' };
  }
}

export async function initDatabaseWithExport(_options?: { overwriteExisting?: boolean }): Promise<InitDatabaseResult> {
  const counts = {
    users: 0, employees: 0, departments: 0, tasks: 0, reminders: 0,
    inventory: 0, partners: 0, companySettings: 0, documents: 0,
    notifications: 0, disciplines: 0, totalDocuments: 0,
  };
  try {
    const seeded = await seedRolesInDatabase();
    if (!seeded.success) throw new Error(seeded.message);
    const names = ['users','employees','departments','tasks','reminders','inventory','partners','company_settings','documents','notifications','disciplinary_incidents'];
    const values = await Promise.all(names.map(name => getCollection<any>(name)));
    counts.users = values[0].length; counts.employees = values[1].length;
    counts.departments = values[2].length; counts.tasks = values[3].length;
    counts.reminders = values[4].length; counts.inventory = values[5].length;
    counts.partners = values[6].length; counts.companySettings = values[7].length;
    counts.documents = values[8].length; counts.notifications = values[9].length;
    counts.disciplines = values[10].length;
    counts.totalDocuments = values.reduce((sum, rows) => sum + rows.length, 0);
    return { success: true, message: `Base MariaDB vérifiée : ${counts.users} utilisateur(s), ${counts.employees} collaborateur(s).`, counts };
  } catch (error: any) {
    return { success: false, message: error?.message || 'Vérification MariaDB impossible.', counts };
  }
}
export const initializeFullDatabase = initDatabaseWithExport;
export const initializeFullFirestoreDatabase = initDatabaseWithExport;
