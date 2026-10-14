export interface AdminAccountOperation {
  id: string;
  timestamp: string;
  authorName: string;
  authorRole?: string;
  targetUserId?: string;
  targetEmployeeId?: string;
  targetName: string;
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
];

let inMemoryAuditOperations: AdminAccountOperation[] = [...SEED_OPERATIONS];

export function getAdminAuditOperations(): AdminAccountOperation[] {
  return inMemoryAuditOperations;
}

export function logAdminOperation(
  op: Omit<AdminAccountOperation, 'id' | 'timestamp'>
): AdminAccountOperation {
  const newOp: AdminAccountOperation = {
    ...op,
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ipAddress: op.ipAddress || '197.234.221.14 (Douala, CM)',
  };

  inMemoryAuditOperations = [newOp, ...inMemoryAuditOperations];
  return newOp;
}

export function clearAdminAuditOperations(): void {
  inMemoryAuditOperations = [];
}
