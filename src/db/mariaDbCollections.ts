import { randomUUID } from 'node:crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getMariaDbPool } from './mariadb';
import { mariaDbRowToItem } from '../services/mariaDb/rowToItem';

const TABLES: Record<string, string> = {
  roles: 'roles', inventory_assignments: 'inventory_assignments',
  users: 'users', employees: 'employees', tasks: 'tasks', task_projects: 'task_projects',
  reminders: 'reminders', presences: 'presences', attendance_incidents: 'attendance_incidents',
  badge_codes_16: 'badge_codes_16', dynamic_qr_sessions: 'dynamic_qr_sessions',
  inventory_items: 'inventory', inventory: 'inventory', disciplinary_incidents: 'disciplinary_incidents',
  departments: 'departments', documents: 'documents', rh_document_templates: 'rh_document_templates',
  processflow_salary_debts: 'processflow_salary_debts', salary_payments: 'salary_payments',
  financial_transactions: 'financial_transactions', partners: 'partners', notifications: 'notifications',
  company_settings: 'company_settings', calls: 'calls', user_presences: 'user_presences',
  job_offers: 'job_offers', job_applications: 'job_applications', expense_claims: 'expense_claims',
  hse_incidents: 'hse_incidents', visitor_logs: 'visitor_logs', idea_suggestions: 'idea_suggestions',
  enterprise_surveys: 'enterprise_surveys', connection_logs: 'connection_logs',
  admin_audit_logs: 'admin_audit_logs', citrine_admin_audit_operations_v1: 'admin_audit_logs',
  task_assignees: 'task_assignees', task_project_members: 'task_project_members',
  reminder_recipients: 'reminder_recipients', notification_recipients: 'notification_recipients',
  presence_pauses: 'presence_pauses', leave_requests: 'leave_requests', };

const GENERIC_COLLECTION_ALLOWLIST = new Set(['building_supervisors', 'strategic_projects', 'absences']);

export function isSupportedMariaDbCollection(collection: string): boolean {
  return Object.prototype.hasOwnProperty.call(TABLES, collection) || GENERIC_COLLECTION_ALLOWLIST.has(collection);
}

export function isGenericMariaDbCollection(collection: string): boolean {
  return GENERIC_COLLECTION_ALLOWLIST.has(collection);
}

const ALLOWED = new Set([
  'roles','users','employees','task_projects','task_project_members','tasks','task_assignees',
  'reminders','reminder_recipients','notifications','notification_recipients','presences',
  'presence_pauses','attendance_incidents','badge_codes_16','dynamic_qr_sessions','inventory',
  'inventory_assignments','disciplinary_incidents','departments','documents','rh_document_templates',
  'processflow_salary_debts','salary_payments','financial_transactions','partners','company_settings',
  'leave_requests','calls','user_presences','job_offers','job_applications','expense_claims',
  'hse_incidents','visitor_logs','idea_suggestions','enterprise_surveys','generic_collections',
  'connection_logs','admin_audit_logs',]);

const UNIQUE_LOOKUPS: Record<string, string[]> = {
  users: ['email'], employees: ['email'], roles: ['code','name'], departments: ['name'],
  badge_codes_16: ['code'], dynamic_qr_sessions: ['session_id'], rh_document_templates: ['code'],
};

function parseJson(value: any): any {
  if (typeof value !== 'string') return value ?? {};
  try { return JSON.parse(value); } catch { return {}; }
}
function asDate(value: any, fallback = new Date()): string {
  const d = value ? new Date(value) : fallback;
  return Number.isNaN(d.getTime()) ? fallback.toISOString().slice(0,10) : d.toISOString().slice(0,10);
}
function asDateTime(value: any): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 23).replace('T', ' ');
}
function jsonValue(value: any): string { return JSON.stringify(value ?? {}); }
function safeUserRaw(raw: Record<string, any>) {
  const result = { ...raw };
  delete result.passwordHash; delete result.password_hash; delete result.initialPassword; delete result.password;
  return result;
}
function safeUserForStorage(raw: Record<string, any>) {
  const result = { ...raw };
  delete result.password;
  delete result.initialPassword;
  return result;
}

export function mapCollectionToMariaDbTable(collection: string): string {
  const table = TABLES[collection] || 'generic_collections';
  if (!ALLOWED.has(table)) throw new Error('Collection non autorisée.');
  return table;
}

function buildRequiredColumns(table: string, item: any, docId: string): Record<string, any> {
  const today = asDate(item.date || item.createdAt);
  const amount = Number(item.amount ?? item.salary ?? item.unitPriceXaf ?? 0);
  const base: Record<string, any> = {
    uid: item.uid || randomUUID(), doc_id: docId,
    raw_data: jsonValue(item), updated_at: new Date(),
  };
  const values: Record<string, any> = {
    roles: { name: item.name || 'Rôle', code: item.code || docId, description: item.description || null, permissions: jsonValue(item.permissions || []) },
    users: { email: String(item.email || '').trim().toLowerCase(), name: item.name || null, role_id: Number(item.roleId || item.role_id || 0) || null, status: item.status !== false && item.status !== 'inactif', department: item.department || null, phone: item.phone || null, avatar_url: item.avatarUrl || item.avatar_url || null },
    employees: { user_id: Number(item.userId || item.user_id || 0) || null, role_id: Number(item.roleId || item.role_id || 0) || null, name: item.name || [item.firstName,item.lastName].filter(Boolean).join(' ') || null, first_name: item.firstName || null, last_name: item.lastName || null, email: item.email || null, phone: item.phone || null, department: item.department || null, position: item.position || null, role_type: item.roleType || item.role || 'Employé', status: item.status === false || ['inactif','parti','renvoye','suspendu'].includes(String(item.status).toLowerCase()) ? 0 : 1, hire_date: item.hireDate ? asDate(item.hireDate) : null, salary: Number(item.salary || 0), photo_url: item.avatarUrl || item.photoUrl || null, emergency_contact: item.emergencyContact || null, work_location: item.workLocation || 'Douala', badge_code: item.badgeCode || null },
    task_projects: { name: item.name || item.title || 'Projet', description: item.description || null, member_ids: jsonValue(item.memberIds || item.members || []) },
    tasks: { title: item.title || 'Tâche', description: item.description || null, date: item.date ? asDate(item.date) : null, time: item.time || null, status: item.status || 'todo', priority: item.priority || 'medium', assigned_to: item.assignedTo || null, employee_id: Number(item.employeeId || 0) || null, department: item.department || null, project_id: Number(item.projectId || 0) || null, due_date: item.dueDate ? asDate(item.dueDate) : null, is_milestone: Boolean(item.isMilestone), milestone_progress: Number(item.milestoneProgress || 0) },
    reminders: { title: item.title || 'Rappel', note: item.note || item.description || null, date: item.date ? asDate(item.date) : null, time: item.time || null, employee_id: Number(item.employeeId || 0) || null, location: item.location || null, all_employees: Boolean(item.allEmployees), trigger_before: item.triggerBefore || null, triggered: Boolean(item.triggered), stopped: Boolean(item.stopped) },
    task_project_members: { project_id: Number(item.projectId || item.project_id || 0) || null, employee_id: Number(item.employeeId || item.employee_id || 0) || null, role_in_project: item.roleInProject || item.role || 'membre', added_at: asDateTime(item.addedAt) || new Date() },
    task_assignees: { task_id: Number(item.taskId || item.task_id || 0) || null, employee_id: Number(item.employeeId || item.employee_id || 0) || null, role_in_task: item.roleInTask || item.role || 'contributeur', assigned_at: asDateTime(item.assignedAt) || new Date() },
    reminder_recipients: { reminder_id: Number(item.reminderId || item.reminder_id || 0) || null, employee_id: Number(item.employeeId || item.employee_id || 0) || null, acknowledged: Boolean(item.acknowledged), acknowledged_at: asDateTime(item.acknowledgedAt) },
    notification_recipients: { notification_id: Number(item.notificationId || item.notification_id || 0) || null, user_id: Number(item.userId || item.user_id || 0) || null, is_read: Boolean(item.isRead ?? item.read ?? false) },
    inventory_assignments: { inventory_id: Number(item.inventoryId || item.inventory_id || 0) || null, employee_id: Number(item.employeeId || item.employee_id || 0) || null, assigned_at: asDateTime(item.assignedAt) || new Date(), returned_at: asDateTime(item.returnedAt), condition: item.condition || 'bon_etat' },
    calls: { caller_id: String(item.callerId || item.caller_id || ''), caller_name: item.callerName || item.caller_name || null, receiver_id: String(item.receiverId || item.receiver_id || ''), receiver_name: item.receiverName || item.receiver_name || null, status: item.status || 'initiating', room_id: item.roomId || item.room_id || item.id || docId, started_at: asDateTime(item.startedAt || item.started_at) || new Date(), ended_at: asDateTime(item.endedAt || item.ended_at) },
    user_presences: { user_id: String(item.userId || item.user_id || ''), user_name: item.userName || item.user_name || null, status: item.status || 'online', last_active: asDateTime(item.lastActive || item.last_active) || new Date() },
    notifications: { title: item.title || 'Notification', message: item.message || item.content || item.description || item.title || 'Notification système', type: item.type || 'system', is_read: Boolean(item.isRead ?? item.read ?? false), target_user_id: Number(item.targetUserId || item.target_user_id || 0) || null, target_employee_ids: jsonValue(item.targetEmployeeIds || []) },
    presences: { employee_id: Number(item.employeeId || item.employee_id || 0) || null, employee_name: item.employeeName || item.employee_name || null, date: today, arrival_time: item.arrivalTime || item.arrival_time || null, departure_time: item.departureTime || item.departure_time || null, status: item.status || 'present', late_minutes: Number(item.lateMinutes || 0), pause_minutes: Number(item.pauseMinutes || 0), motif: item.motif || null, signature: item.signature || null, gps_lat: item.latitude ?? item.gpsLat ?? null, gps_lng: item.longitude ?? item.gpsLng ?? null, method: item.clockingMethod || item.method || 'kiosk' },
    presence_pauses: { presence_id: Number(item.presenceId || 0) || null, start_time: item.startTime || new Date().toISOString(), end_time: item.endTime || null, duration_minutes: Number(item.durationMinutes || 0) },
    attendance_incidents: { employee_id: Number(item.employeeId || 0) || null, date: today, type: item.type || 'retard', description: item.reason || item.description || 'Incident de présence', status: item.status || 'en_attente' },
    badge_codes_16: { code: String(item.code || docId), assigned_name: item.assignedName || item.employeeName || null, created_by: item.createdBy || 'Responsable', expires_at: asDateTime(item.expiresAt), is_used: Boolean(item.isUsed), used_at: asDateTime(item.usedAt), employee_id: Number(item.employeeId || 0) || null },
    dynamic_qr_sessions: { session_id: String(item.sessionId || item.id || docId), created_by: item.createdBy || 'Responsable', expires_at: asDateTime(item.expiresAt), is_active: item.isActive !== false },
    inventory: { name: item.name || item.designation || 'Matériel', category: item.category || null, serial_number: item.serialNumber || null, quantity: Number(item.quantity || 1), status: item.status || 'disponible', unit_price_xaf: amount },
    disciplinary_incidents: { employee_id: Number(item.employeeId || 0) || null, employee_name: item.employeeName || null, date: today, severity: item.severity || 'mineure', reason: item.reason || 'Incident disciplinaire', action_taken: item.actionTaken || null, decision_by: item.decisionBy || null },
    departments: { name: item.name || 'Département', code: item.code || null, budget_xaf: Number(item.budgetXaf || item.budget || 0) },
    documents: { title: item.title || 'Document', type: item.type || item.documentType || 'general' },
    rh_document_templates: { name: item.name || item.title || 'Modèle RH', code: item.code || docId, type: item.type || 'general', content_template: item.contentTemplate || item.content || item.template || '' },
    processflow_salary_debts: { amount, employee_id: Number(item.employeeId || 0) || null },
    salary_payments: { month: String(item.month || today.slice(0,7)), year: Number(item.year || new Date().getFullYear()), base_salary: Number(item.baseSalary || 0), net_salary: Number(item.netSalary || item.amount || 0), employee_id: Number(item.employeeId || 0) || null },
    financial_transactions: { type: item.type || 'autre', amount, date: today, description: item.description || null },
    partners: { name: item.name || 'Partenaire' },
    company_settings: { setting_key: item.settingKey || 'main_config', setting_value: jsonValue(item) },
    leave_requests: { employee_id: Number(item.employeeId || 0) || null, employee_name: item.employeeName || null, start_date: item.startDate ? asDate(item.startDate) : today, end_date: item.endDate ? asDate(item.endDate) : today, days_count: Number(item.daysCount || 1), reason: item.reason || null, status: item.status || 'pending' },
    job_offers: { title: item.title || 'Offre', description: item.description || null, status: item.status || 'ouverte' },
    job_applications: { candidate_name: item.candidateName || item.name || 'Candidat', candidate_email: item.candidateEmail || item.email || 'unknown@invalid.local', status: item.status || 'nouvelle' },
    expense_claims: { title: item.title || item.description || 'Dépense', amount, date: today, status: item.status || 'pending', employee_id: Number(item.employeeId || 0) || null },
    hse_incidents: { title: item.title || 'Incident HSE', date: today, type: item.type || 'presque_accident', severity: item.severity || 'faible', description: item.description || null, status: item.status || 'signale' },
    visitor_logs: { visitor_name: item.visitorName || item.name || 'Visiteur', visitor_company: item.visitorCompany || null, visitor_phone: item.visitorPhone || '', site_location: item.siteLocation || 'Siège Akwa', purpose: item.purpose || 'visite', check_in_date: today, status: item.status || 'sur_site' },
    idea_suggestions: { title: item.title || 'Suggestion', description: item.description || null, status: item.status || 'soumise' },
    enterprise_surveys: { title: item.title || 'Enquête', description: item.description || null, status: item.status || 'active' },
  };
  return { ...base, ...(values[table] || {}) };
}

export async function getMariaDbCollection(collection: string): Promise<any[]> {
  const table = mapCollectionToMariaDbTable(collection);
  if (table === 'generic_collections') {
    const [rows] = await getMariaDbPool().execute<RowDataPacket[]>(
      'SELECT id, doc_id, uid, data FROM generic_collections WHERE collection = ? ORDER BY id DESC LIMIT 10000',
      [collection]
    );
    return rows.map(row => ({ ...parseJson(row.data), id: row.doc_id || String(row.id), docId: row.doc_id, uid: row.uid, _dbId: row.id }));
  }
  const [rows] = await getMariaDbPool().query<RowDataPacket[]>(
    `SELECT * FROM \x60${table}\x60 ORDER BY id DESC LIMIT 10000`
  );
  return rows.map(row => {
    const item = mariaDbRowToItem(collection, row) || {};
    const safeItem = table === 'users' ? safeUserRaw(item) : item;
    return { ...safeItem, _dbId: row.id, raw_data: undefined };
  });
}

export async function saveMariaDbDocument(collection: string, item: any): Promise<any> {
  if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Document invalide.');
  const table = mapCollectionToMariaDbTable(collection);
  const docId = String(item.id || item.docId || `doc-${randomUUID()}`).slice(0, 255);
  const pool = getMariaDbPool();
  if (table === 'generic_collections') {
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM generic_collections WHERE collection = ? AND doc_id = ? LIMIT 1', [collection, docId]
    );
    if (existing[0]) {
      await pool.execute('UPDATE generic_collections SET data = ?, updated_at = NOW(3) WHERE id = ?', [jsonValue({ ...item, id: docId }), existing[0].id]);
    } else {
      await pool.execute('INSERT INTO generic_collections (uid, collection, doc_id, data, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(3), NOW(3))',
        [randomUUID(), collection, docId, jsonValue({ ...item, id: docId })]);
    }
    return { ...item, id: docId };
  }

  const persistedItem = table === 'users' ? safeUserForStorage(item) : item;
  const data = buildRequiredColumns(table, persistedItem, docId);
  let existing: any = null;
  if (/^\d+$/.test(docId)) {
    const [rows] = await pool.execute<RowDataPacket[]>(`SELECT id, raw_data FROM \x60${table}\x60 WHERE id = ? LIMIT 1`, [Number(docId)]);
    existing = rows[0];
  }
  if (!existing) {
    const [rows] = await pool.execute<RowDataPacket[]>(`SELECT id, raw_data FROM \x60${table}\x60 WHERE doc_id = ? LIMIT 1`, [docId]);
    existing = rows[0];
  }
  if (!existing && ['users','employees'].includes(table) && data.email) {
    const [rows] = await pool.execute<RowDataPacket[]>(`SELECT id, raw_data FROM \x60${table}\x60 WHERE LOWER(email) = ? LIMIT 1`, [String(data.email).toLowerCase()]);
    existing = rows[0];
  }
  if (!existing) {
    for (const key of UNIQUE_LOOKUPS[table] || []) {
      if (!data[key]) continue;
      const [rows] = await pool.execute<RowDataPacket[]>(`SELECT id, raw_data FROM \x60${table}\x60 WHERE \x60${key}\x60 = ? LIMIT 1`, [data[key]]);
      if (rows[0]) { existing = rows[0]; break; }
    }
  }

  if (existing) {
    const oldRaw = parseJson(existing.raw_data);
    const newRaw = { ...oldRaw, ...persistedItem, id: docId, updatedAt: new Date().toISOString() };
    if (table === 'users' && !item.passwordHash && !item.password_hash) {
      if (oldRaw.passwordHash) newRaw.passwordHash = oldRaw.passwordHash;
      else if (oldRaw.password_hash) newRaw.password_hash = oldRaw.password_hash;
    }
    data.raw_data = jsonValue(newRaw);
    delete data.uid; delete data.doc_id;
    const columns = Object.keys(data).filter(key => key !== 'id');
    const assignments = columns.map(key => `\x60${key}\x60 = ?`).join(', ');
    await pool.execute(`UPDATE \x60${table}\x60 SET ${assignments} WHERE id = ?`, [...columns.map(key => data[key]), existing.id]);
  } else {
    data.raw_data = jsonValue({ ...persistedItem, id: docId, createdAt: new Date().toISOString() });
    const columns = Object.keys(data);
    await pool.execute(
      `INSERT INTO \x60${table}\x60 (${columns.map(key => `\x60${key}\x60`).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      columns.map(key => data[key])
    );
  }
  return { ...item, id: docId, updatedAt: new Date().toISOString() };
}

export async function deleteMariaDbDocument(collection: string, id: string): Promise<boolean> {
  const table = mapCollectionToMariaDbTable(collection);
  const value = String(id).trim();
  if (table === 'generic_collections') {
    const [result] = await getMariaDbPool().execute<ResultSetHeader>(
      'DELETE FROM generic_collections WHERE collection = ? AND doc_id = ?', [collection, value]
    );
    return result.affectedRows > 0;
  }
  const column = /^\d+$/.test(value) ? 'id' : 'doc_id';
  const [result] = await getMariaDbPool().execute<ResultSetHeader>(
    `DELETE FROM \x60${table}\x60 WHERE \x60${column}\x60 = ?`, [column === 'id' ? Number(value) : value]
  );
  return result.affectedRows > 0;
}
