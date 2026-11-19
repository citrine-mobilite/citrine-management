import { safeStorage } from '../utils/safeStorage';

export type AuditOperationType =
  | 'creation'
  | 'role_change'
  | 'manager_change'
  | 'team_change'
  | 'status_change'
  | 'password_reset'
  | 'access_key_regenerated'
  | 'salary_update'
  | 'conge_permission'
  | 'conseil_discipline'
  | 'feuille_de_temps'
  | 'presence_pointage'
  | 'securite_connexion'
  | 'systeme';

export type AuditLevel = 'info' | 'success' | 'warning' | 'error';

export interface AdminAccountOperation {
  id: string;
  timestamp: string;
  authorName: string;
  authorRole?: string;
  targetUserId?: string;
  targetEmployeeId?: string;
  targetName: string;
  operationType: AuditOperationType;
  operationLabel: string;
  details: string;
  level?: AuditLevel;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

const AUDIT_STORAGE_KEY = 'citrine_audit_operations';

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
    level: 'success',
    ipAddress: '197.234.221.14 (Douala, CM)',
  },
  {
    id: 'op-seed-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    authorName: 'Système Citrine',
    authorRole: 'system',
    targetName: 'Plateforme Globale',
    operationType: 'securite_connexion',
    operationLabel: 'Sauvegarde automatique & chiffrement',
    details: 'Vérification de l\'intégrité des tables et rotation des jetons de session',
    level: 'info',
    ipAddress: '127.0.0.1 (Localhost)',
  },
  {
    id: 'op-seed-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    authorName: 'Responsable RH',
    authorRole: 'rh',
    targetName: 'Kouam Marc',
    operationType: 'conge_permission',
    operationLabel: 'Validation Congé Annuel',
    details: 'Validation de la demande de congé du 20 au 25 du mois (5 jours accordés)',
    level: 'success',
    ipAddress: '197.234.221.14 (Douala, CM)',
  },
  {
    id: 'op-seed-4',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    authorName: 'Direction Générale',
    authorRole: 'admin',
    targetName: 'Nguegno Paul',
    operationType: 'conseil_discipline',
    operationLabel: 'Ouverture Dossier Disciplinaire',
    details: 'Convocation au Conseil de discipline suite à retard injustifié répété',
    level: 'warning',
    ipAddress: '197.234.221.18 (Yaoundé, CM)',
  },
];

function loadStoredOperations(): AdminAccountOperation[] {
  try {
    const raw = safeStorage.getItem(AUDIT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[adminAuditService] Failed to load stored audit logs:', err);
  }
  return [...SEED_OPERATIONS];
}

function persistOperations(ops: AdminAccountOperation[]): void {
  try {
    // Keep up to 500 recent entries to avoid storage bloat
    const capped = ops.slice(0, 500);
    safeStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(capped));
  } catch (err) {
    console.warn('[adminAuditService] Failed to persist audit logs:', err);
  }
}

let inMemoryAuditOperations: AdminAccountOperation[] = loadStoredOperations();

export function getAdminAuditOperations(): AdminAccountOperation[] {
  // Always refresh from safeStorage to stay in sync
  inMemoryAuditOperations = loadStoredOperations();
  return inMemoryAuditOperations;
}

export function logAdminOperation(
  op: Omit<AdminAccountOperation, 'id' | 'timestamp'>
): AdminAccountOperation {
  const newOp: AdminAccountOperation = {
    ...op,
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    level: op.level || 'info',
    ipAddress: op.ipAddress || '197.234.221.14 (Douala, CM)',
  };

  const current = loadStoredOperations();
  const updated = [newOp, ...current];
  inMemoryAuditOperations = updated;
  persistOperations(updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('citrine:audit_updated', { detail: newOp }));
  }

  return newOp;
}

/**
 * Helper to log any system or business audit event easily from any component/service
 */
export function logSystemAudit(op: {
  authorName?: string;
  authorRole?: string;
  targetName?: string;
  targetEmployeeId?: string;
  targetUserId?: string;
  operationType: AuditOperationType;
  operationLabel: string;
  details: string;
  level?: AuditLevel;
  ipAddress?: string;
  metadata?: Record<string, any>;
}): AdminAccountOperation {
  return logAdminOperation({
    authorName: op.authorName || 'Système Citrine',
    authorRole: op.authorRole || 'system',
    targetName: op.targetName || 'Système',
    targetEmployeeId: op.targetEmployeeId,
    targetUserId: op.targetUserId,
    operationType: op.operationType,
    operationLabel: op.operationLabel,
    details: op.details,
    level: op.level || 'info',
    ipAddress: op.ipAddress || '197.234.221.14 (Douala, CM)',
    metadata: op.metadata,
  });
}

export function clearAdminAuditOperations(): void {
  inMemoryAuditOperations = [];
  safeStorage.removeItem(AUDIT_STORAGE_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('citrine:audit_updated'));
  }
}
