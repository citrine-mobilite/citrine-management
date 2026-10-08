/**
 * Service de traçabilité et d'audit des opérations administratives sur les comptes
 * (Création de compte, changement de rôle, rattachement de responsable, affectation à une équipe,
 * suspension, réactivation, réinitialisation de mot de passe, etc.)
 */

export interface AdminAccountOperation {
  id: string;
  timestamp: string; // ISO string
  authorName: string; // e.g. "Landry Moutongo (Super Admin)"
  authorRole?: string;
  targetUserId?: string;
  targetEmployeeId?: string;
  targetName: string; // Nom du collaborateur / utilisateur concerné
  operationType:
    | 'creation'
    | 'role_change'
    | 'manager_change'
    | 'team_change'
    | 'status_change'
    | 'password_reset'
    | 'access_key_regenerated'
    | 'salary_update';
  operationLabel: string;
  details: string;
  ipAddress?: string;
}

const LOCAL_STORAGE_KEY = 'citrine_admin_audit_operations_v1';

const SEED_OPERATIONS: AdminAccountOperation[] = [
  {
    id: 'op-seed-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    authorName: 'Landry Moutongo (Super Admin)',
    authorRole: 'super_admin',
    targetEmployeeId: 'emp-1',
    targetName: 'Landry Moutongo',
    operationType: 'creation',
    operationLabel: 'Initialisation du Super-Administrateur',
    details: 'Création du compte administrateur racine avec permissions globales',
    ipAddress: '197.234.221.14 (Douala, CM)',
  },
  {
    id: 'op-seed-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    authorName: 'Landry Moutongo (Super Admin)',
    authorRole: 'super_admin',
    targetEmployeeId: 'emp-2',
    targetName: 'Samuel Eto\'o',
    operationType: 'team_change',
    operationLabel: 'Affectation à une équipe',
    details: 'Rattachement à l\'Équipe Commerciale & Partenariats',
    ipAddress: '197.234.221.14 (Douala, CM)',
  },
  {
    id: 'op-seed-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    authorName: 'Landry Moutongo (Super Admin)',
    authorRole: 'super_admin',
    targetEmployeeId: 'emp-3',
    targetName: 'Nathalie Koah',
    operationType: 'manager_change',
    operationLabel: 'Rattachement hiérarchique',
    details: 'Assignation du responsable hiérarchique : Landry Moutongo (Directeur)',
    ipAddress: '197.234.221.14 (Douala, CM)',
  },
  {
    id: 'op-seed-4',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    authorName: 'Landry Moutongo (Super Admin)',
    authorRole: 'super_admin',
    targetEmployeeId: 'emp-4',
    targetName: 'Francis Ngannou',
    operationType: 'role_change',
    operationLabel: 'Élévation de privilèges',
    details: 'Rôle système changé de \'employé\' à \'responsable\' (Superviseur Logistique)',
    ipAddress: '197.234.221.14 (Douala, CM)',
  },
  {
    id: 'op-seed-5',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    authorName: 'Landry Moutongo (Super Admin)',
    authorRole: 'super_admin',
    targetEmployeeId: 'emp-5',
    targetName: 'Rigobert Song',
    operationType: 'team_change',
    operationLabel: 'Affectation à une équipe',
    details: 'Rattachement à l\'Équipe Support & Opérations',
    ipAddress: '197.234.221.14 (Douala, CM)',
  },
];

export function getAdminAuditOperations(): AdminAccountOperation[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_OPERATIONS));
      return SEED_OPERATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_OPERATIONS;
  } catch {
    return SEED_OPERATIONS;
  }
}

export function logAdminOperation(
  op: Omit<AdminAccountOperation, 'id' | 'timestamp'>
): AdminAccountOperation {
  const currentList = getAdminAuditOperations();
  const newOp: AdminAccountOperation = {
    ...op,
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ipAddress: op.ipAddress || '197.234.221.14 (Douala, CM)',
  };

  const updated = [newOp, ...currentList];
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving admin audit log:', err);
  }

  return newOp;
}

export function clearAdminAuditOperations(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {}
}
