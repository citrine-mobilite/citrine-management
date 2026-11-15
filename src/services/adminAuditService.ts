import { safeStorage } from '../utils/safeStorage';
import { supabaseAdmin } from '../lib/supabase';

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
  | 'feuille_avancement_taches'
  | 'feuille_de_temps'
  | 'presence_pointage'
  | 'tache_projet'
  | 'finance_frais'
  | 'parametres_systeme'
  | 'securite_connexion'
  | 'systeme';

export type AuditLevel = 'info' | 'success' | 'warning' | 'error';
export type LogCategory = 'system_event' | 'audit';

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
  logCategory?: LogCategory;
  metadata?: Record<string, any>;
}

const AUDIT_STORAGE_KEY = 'citrine_audit_operations';

const SYSTEM_EVENT_TYPES = new Set<AuditOperationType>([
  'securite_connexion',
  'systeme',
  'access_key_regenerated',
  'password_reset',
]);

function inferLogCategory(type: AuditOperationType, explicit?: LogCategory): LogCategory {
  if (explicit) return explicit;
  return SYSTEM_EVENT_TYPES.has(type) ? 'system_event' : 'audit';
}

function loadStoredOperations(): AdminAccountOperation[] {
  try {
    const raw = safeStorage.getItem(AUDIT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((op) => typeof op?.id !== 'string' || !op.id.startsWith('op-seed-'));
      }
    }
  } catch (err) {
    console.warn('[adminAuditService] Failed to load stored audit logs:', err);
  }
  return [];
}

function persistOperations(ops: AdminAccountOperation[]): void {
  try {
    const capped = ops.slice(0, 600);
    safeStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(capped));
  } catch (err) {
    console.warn('[adminAuditService] Failed to persist audit logs:', err);
  }
}

async function persistOperationToDb(op: AdminAccountOperation): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    await Promise.resolve(
      supabaseAdmin.from('admin_audit_logs').insert({
        doc_id: op.id,
        timestamp: op.timestamp,
        author_name: op.authorName,
        author_role: op.authorRole || 'utilisateur',
        target_user_id: op.targetUserId || null,
        target_employee_id: op.targetEmployeeId || null,
        target_name: op.targetName,
        operation_type: op.operationType,
        operation_label: op.operationLabel,
        details: op.details,
        ip_address: op.ipAddress || 'Douala, CM',
        raw_data: op,
      })
    );
  } catch {
    // Non-blocking remote audit sync
  }
}

let inMemoryAuditOperations: AdminAccountOperation[] = loadStoredOperations();

export function getAdminAuditOperations(): AdminAccountOperation[] {
  inMemoryAuditOperations = loadStoredOperations();
  return inMemoryAuditOperations;
}

export async function hydrateAuditOperationsFromDb(): Promise<AdminAccountOperation[]> {
  const localOps = loadStoredOperations();
  try {
    const { data }: any = await Promise.resolve(
      supabaseAdmin.from('admin_audit_logs').select('*').order('id', { ascending: false }).limit(250)
    );
    if (data && Array.isArray(data) && data.length > 0) {
      const dbOps: AdminAccountOperation[] = data
        .map((row: any) => {
          const base = row?.raw_data && typeof row.raw_data === 'object' ? row.raw_data : null;
          if (base?.id) return base as AdminAccountOperation;
          return {
            id: row.doc_id || `audit-db-${row.id}`,
            timestamp: row.timestamp || row.created_at || new Date().toISOString(),
            authorName: row.author_name || 'Système Citrine',
            authorRole: row.author_role || 'system',
            targetUserId: row.target_user_id || undefined,
            targetEmployeeId: row.target_employee_id || undefined,
            targetName: row.target_name || 'Système',
            operationType: (row.operation_type as AuditOperationType) || 'systeme',
            operationLabel: row.operation_label || 'Opération enregistrée',
            details: row.details || '',
            ipAddress: row.ip_address || 'Douala, CM',
            logCategory: inferLogCategory((row.operation_type as AuditOperationType) || 'systeme'),
          };
        })
        .filter((op) => !String(op.id).startsWith('op-seed-'));

      const seen = new Set<string>();
      const merged = [...localOps, ...dbOps]
        .filter((op) => {
          if (seen.has(op.id)) return false;
          seen.add(op.id);
          return true;
        })
        .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

      inMemoryAuditOperations = merged;
      persistOperations(merged);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('citrine:audit_updated'));
      }
      return merged;
    }
  } catch {
    // Fallback on local audit cache
  }
  return localOps;
}

export function logAdminOperation(
  op: Omit<AdminAccountOperation, 'id' | 'timestamp'>
): AdminAccountOperation {
  const category = inferLogCategory(op.operationType, op.logCategory);
  const newOp: AdminAccountOperation = {
    ...op,
    logCategory: category,
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    level: op.level || 'info',
    ipAddress: op.ipAddress || 'Douala, CM',
  };

  const current = loadStoredOperations();
  const updated = [newOp, ...current];
  inMemoryAuditOperations = updated;
  persistOperations(updated);
  void persistOperationToDb(newOp);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('citrine:audit_updated', { detail: newOp }));
  }

  return newOp;
}

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
  logCategory?: LogCategory;
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
    ipAddress: op.ipAddress || 'Douala, CM',
    logCategory: inferLogCategory(op.operationType, op.logCategory || 'audit'),
    metadata: op.metadata,
  });
}

export function logSystemEvent(op: {
  authorName?: string;
  authorRole?: string;
  targetName?: string;
  targetEmployeeId?: string;
  targetUserId?: string;
  operationType?: 'securite_connexion' | 'systeme' | 'access_key_regenerated' | 'password_reset';
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
    operationType: op.operationType || 'systeme',
    operationLabel: op.operationLabel,
    details: op.details,
    level: op.level || 'info',
    ipAddress: op.ipAddress || 'Douala, CM',
    logCategory: 'system_event',
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
