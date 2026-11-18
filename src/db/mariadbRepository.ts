import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getMariaDbPool, withMariaDbTransaction } from './mariadb';

export const MARIADB_TABLES = [
  'roles', 'users', 'employees', 'task_projects', 'task_project_members', 'tasks',
  'task_assignees', 'reminders', 'reminder_recipients', 'notifications',
  'notification_recipients', 'presences', 'presence_pauses', 'attendance_incidents',
  'badge_codes_16', 'dynamic_qr_sessions', 'inventory', 'inventory_assignments',
  'disciplinary_incidents', 'departments', 'documents', 'rh_document_templates',
  'processflow_salary_debts', 'salary_payments', 'financial_transactions', 'partners',
  'company_settings', 'leave_requests', 'calls', 'user_presences', 'job_offers',
  'job_applications', 'expense_claims', 'hse_incidents', 'visitor_logs',
  'idea_suggestions', 'enterprise_surveys', 'generic_collections', 'connection_logs',
  'admin_audit_logs',
] as const;

export type MariaDbTable = typeof MARIADB_TABLES[number];

const TABLE_SET = new Set<string>(MARIADB_TABLES);
const IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function assertTable(table: string): asserts table is MariaDbTable {
  if (!TABLE_SET.has(table)) throw new Error(`Table MariaDB non autorisée : ${table}`);
}

function assertColumn(column: string): void {
  if (!IDENTIFIER.test(column)) throw new Error(`Nom de colonne SQL invalide : ${column}`);
}

function normalizeValue(value: any): any {
  if (value === undefined) return null;
  if (value !== null && typeof value === 'object' && !(value instanceof Date) && !Buffer.isBuffer(value)) {
    return JSON.stringify(value);
  }
  return value;
}

export async function selectRows<T extends RowDataPacket = RowDataPacket>(
  table: MariaDbTable,
  where: Record<string, unknown> = {},
  limit = 1000
): Promise<T[]> {
  assertTable(table);
  const entries = Object.entries(where);
  entries.forEach(([column]) => assertColumn(column));
  const clause = entries.length ? ` WHERE ${entries.map(([column]) => `\x60${column}\x60 = ?`).join(' AND ')}` : '';
  const safeLimit = Math.max(1, Math.min(10000, Math.trunc(limit)));
  const [rows] = await getMariaDbPool().execute<T[]>(
    `SELECT * FROM \x60${table}\x60${clause} LIMIT ${safeLimit}`,
    entries.map(([, value]) => normalizeValue(value))
  );
  return rows;
}

export async function insertRow(
  table: MariaDbTable,
  data: Record<string, unknown>,
  connection?: PoolConnection
): Promise<ResultSetHeader> {
  assertTable(table);
  const entries = Object.entries(data).filter(([, value]) => value !== undefined);
  if (!entries.length) throw new Error('Insertion MariaDB sans colonne.');
  entries.forEach(([column]) => assertColumn(column));
  const columns = entries.map(([column]) => `\x60${column}\x60`).join(', ');
  const placeholders = entries.map(() => '?').join(', ');
  const sql = `INSERT INTO \x60${table}\x60 (${columns}) VALUES (${placeholders})`;
  const executor = connection || getMariaDbPool();
  const [result] = await executor.execute<ResultSetHeader>(sql, entries.map(([, value]) => normalizeValue(value)));
  return result;
}

export async function updateRows(
  table: MariaDbTable,
  data: Record<string, unknown>,
  where: Record<string, unknown>,
  connection?: PoolConnection
): Promise<ResultSetHeader> {
  assertTable(table);
  const changes = Object.entries(data).filter(([, value]) => value !== undefined);
  const filters = Object.entries(where);
  if (!changes.length || !filters.length) throw new Error('UPDATE MariaDB exige des colonnes et un filtre.');
  [...changes, ...filters].forEach(([column]) => assertColumn(column));
  const setSql = changes.map(([column]) => `\x60${column}\x60 = ?`).join(', ');
  const whereSql = filters.map(([column]) => `\x60${column}\x60 = ?`).join(' AND ');
  const executor = connection || getMariaDbPool();
  const [result] = await executor.execute<ResultSetHeader>(
    `UPDATE \x60${table}\x60 SET ${setSql} WHERE ${whereSql}`,
    [...changes, ...filters].map(([, value]) => normalizeValue(value))
  );
  return result;
}

export async function deleteRows(
  table: MariaDbTable,
  where: Record<string, unknown>,
  connection?: PoolConnection
): Promise<ResultSetHeader> {
  assertTable(table);
  const filters = Object.entries(where);
  if (!filters.length) throw new Error('DELETE MariaDB exige un filtre.');
  filters.forEach(([column]) => assertColumn(column));
  const whereSql = filters.map(([column]) => `\x60${column}\x60 = ?`).join(' AND ');
  const executor = connection || getMariaDbPool();
  const [result] = await executor.execute<ResultSetHeader>(
    `DELETE FROM \x60${table}\x60 WHERE ${whereSql}`,
    filters.map(([, value]) => normalizeValue(value))
  );
  return result;
}

export { withMariaDbTransaction };
