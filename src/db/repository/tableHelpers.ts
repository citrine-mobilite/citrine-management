import { getMariaDbPool } from '../mariadb';
import type { RowDataPacket } from 'mysql2/promise';

export function mapCollectionToTable(collectionName: string): string {
  const map: Record<string, string> = {
    inventory_items: 'inventory',
    citrine_admin_audit_operations_v1: 'admin_audit_logs',
  };
  const known = new Set([
    'roles','users','employees','tasks','task_projects','reminders','presences','attendance_incidents',
    'badge_codes_16','dynamic_qr_sessions','inventory','inventory_assignments','disciplinary_incidents','departments',
    'documents','rh_document_templates','processflow_salary_debts','salary_payments',
    'financial_transactions','partners','notifications','company_settings','calls','user_presences',
    'job_offers','job_applications','expense_claims','hse_incidents','visitor_logs','idea_suggestions',
    'enterprise_surveys','connection_logs','admin_audit_logs','task_assignees','task_project_members',
    'reminder_recipients','notification_recipients','presence_pauses','leave_requests',]);
  const table = map[collectionName] || collectionName;
  return known.has(table) ? table : 'generic_collections';
}

export function isUuid(val: any): boolean {
  return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}
export function isSqlConfigured(): boolean { return true; }

export async function resolveEmployeeDbId(_client: any, value: any): Promise<number | null> {
  if (!value) return null;
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  const id = String(value).trim();
  if (/^\d+$/.test(id)) return Number(id);
  const [rows] = await getMariaDbPool().execute<RowDataPacket[]>(
    'SELECT id FROM employees WHERE doc_id = ? OR uid = ? OR LOWER(email) = ? LIMIT 1',
    [id, id, id.toLowerCase()]
  );
  return rows[0]?.id ? Number(rows[0].id) : null;
}

export async function resolveUserDbId(_client: any, value: any, email?: string): Promise<number | null> {
  if (!value && !email) return null;
  const id = value === undefined || value === null ? '' : String(value).trim();
  if (/^\d+$/.test(id)) {
    const [direct] = await getMariaDbPool().execute<RowDataPacket[]>('SELECT id FROM users WHERE id = ? LIMIT 1', [Number(id)]);
    if (direct[0]) return Number(direct[0].id);
    const [linked] = await getMariaDbPool().execute<RowDataPacket[]>('SELECT user_id AS id FROM employees WHERE id = ? LIMIT 1', [Number(id)]);
    if (linked[0]?.id) return Number(linked[0].id);
  }
  const candidate = id || String(email || '').trim();
  if (!candidate) return null;
  const [users] = await getMariaDbPool().execute<RowDataPacket[]>(
    'SELECT id FROM users WHERE doc_id = ? OR uid = ? OR LOWER(email) = ? LIMIT 1',
    [candidate, candidate, candidate.toLowerCase()]
  );
  if (users[0]) return Number(users[0].id);
  const [employees] = await getMariaDbPool().execute<RowDataPacket[]>(
    'SELECT user_id AS id FROM employees WHERE doc_id = ? OR LOWER(email) = ? LIMIT 1',
    [candidate, candidate.toLowerCase()]
  );
  return employees[0]?.id ? Number(employees[0].id) : null;
}
