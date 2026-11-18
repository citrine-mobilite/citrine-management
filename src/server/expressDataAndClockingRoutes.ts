import express from 'express';
import { pingMariaDb, getMariaDbPool } from '../db/mariadb';
import { isSupportedMariaDbCollection, isGenericMariaDbCollection } from '../db/mariaDbCollections';
import type { RowDataPacket } from 'mysql2/promise';
import { requireAuth, requireAdmin, requireAdminOrResponsable, AuthRequest } from '../middleware/auth';
import {
  getCollectionData,
  saveDocumentData,
  deleteDocumentData,
  getOrCreateUserRecord,
  executeCollaboratorCreationTransaction,
  executeCollaboratorUpdateTransaction,
  executeAtomicClockingTransaction,
  checkClockingEligibilityBackend,
} from '../db/repository';
import { broadcastRealtimeEvent } from './expressRealtimeHub';
import {
  getBeamsCredentials,
  publishBeamsNotification,
  publishClockingBeamsNotification,
} from './services/pusherBeamsService';

const ADMIN_ONLY_COLLECTIONS = new Set([
  'roles', 'users', 'company_settings', 'admin_audit_logs', 'connection_logs',
  'salary_payments', 'financial_transactions', 'processflow_salary_debts',
]);
const MANAGER_COLLECTIONS = new Set([
  'employees', 'presences', 'attendance_incidents', 'disciplinary_incidents',
  'departments', 'inventory', 'inventory_assignments', 'documents',
  'rh_document_templates', 'hse_incidents', 'visitor_logs', 'job_offers', 'badge_codes_16', 'dynamic_qr_sessions',
  'job_applications', 'partners', 'task_projects', 'task_assignees', 'task_project_members',
  'reminder_recipients', 'notification_recipients', 'calls', 'user_presences',
]);

function isAdmin(user: any): boolean { return String(user?.role || '').toLowerCase() === 'administrateur'; }
function isPrivileged(user: any): boolean {
  return isAdmin(user) || String(user?.role || '').toLowerCase() === 'responsable';
}

const ADMIN_READ_COLLECTIONS = new Set([
  'salary_payments', 'financial_transactions', 'processflow_salary_debts',
  'admin_audit_logs', 'connection_logs',
]);
const MANAGER_READ_COLLECTIONS = new Set([
  'disciplinary_incidents', 'inventory', 'inventory_assignments',
  'visitor_logs', 'hse_incidents', 'job_applications', 'rh_document_templates', 'badge_codes_16', 'dynamic_qr_sessions',
]);
const OWN_READ_COLLECTIONS = new Set([
  'presences', 'attendance_incidents', 'leave_requests', 'expense_claims', 'absences', 'tasks', 'reminders', 'calls',
]);

async function getOwnEmployeeScope(req: AuthRequest): Promise<RowDataPacket | null> {
  const [rows] = await getMariaDbPool().execute<RowDataPacket[]>(
    'SELECT id, doc_id, uid, email, name, first_name, last_name FROM employees WHERE user_id = ? LIMIT 1',
    [Number(req.user?.id)]
  );
  return rows[0] || null;
}

function employeeScopeIds(employee: RowDataPacket | null): Set<string> {
  return new Set(employee
    ? [employee.id, employee.doc_id, employee.uid, employee.email].filter(Boolean).map(String)
    : []);
}

function parseRouteJson(value: any): Record<string, any> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {}
  }
  return {};
}

const COLLECTION_RECORD_TABLES: Record<string, string> = {
  tasks: 'tasks',
  reminders: 'reminders',
  notifications: 'notifications',
  idea_suggestions: 'idea_suggestions',
  enterprise_surveys: 'enterprise_surveys',
  leave_requests: 'leave_requests',
  expense_claims: 'expense_claims',
};

async function findCollectionRecord(collection: string, recordId: string): Promise<{ row: RowDataPacket; raw: Record<string, any> } | null> {
  const numericId = /^\\d+$/.test(recordId) ? Number(recordId) : -1;
  if (collection === 'absences') {
    const [rows] = await getMariaDbPool().execute<RowDataPacket[]>(
      "SELECT * FROM generic_collections WHERE collection = 'absences' AND (id = ? OR doc_id = ?) LIMIT 1",
      [numericId, recordId]
    );
    const row = rows[0];
    return row ? { row, raw: parseRouteJson(row.data) } : null;
  }
  const table = COLLECTION_RECORD_TABLES[collection];
  if (!table) return null;
  const [rows] = await getMariaDbPool().execute<RowDataPacket[]>(
    `SELECT * FROM ${table} WHERE id = ? OR doc_id = ? LIMIT 1`,
    [numericId, recordId]
  );
  const row = rows[0];
  return row ? { row, raw: parseRouteJson(row.raw_data) } : null;
}

function ownEmployeeName(employee: RowDataPacket): string {
  return String(employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim());
}

async function authorizeNotificationWrite(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  if (isPrivileged(req.user)) return next();
  try {
    const employee = await getOwnEmployeeScope(req);
    if (!employee) return res.status(403).json({ success: false, error: 'Compte collaborateur introuvable.' });
    const ownIds = employeeScopeIds(employee);
    ownIds.add(String(req.user?.id || ''));
    const employeeName = ownEmployeeName(employee);
    const body = req.body || {};
    const recordId = String(body.id || body.docId || body.doc_id || '').trim();

    if (!recordId) {
      const targets = [
        body.targetUserId,
        ...(Array.isArray(body.targetEmployeeIds) ? body.targetEmployeeIds : []),
      ].filter(Boolean).map(String);
      const recipient = String(body.recipient || '').trim().toLowerCase();
      const isOwn = targets.some(value => ownIds.has(value))
        || [employeeName, employee.email, req.user?.id].some(value => String(value || '').toLowerCase() === recipient);
      if (!isOwn) return res.status(403).json({ success: false, error: 'Tu ne peux créer une notification que pour ton propre compte.' });
      req.body = { ...body, recipient: employeeName || body.recipient, targetUserId: String(employee.id) };
      return next();
    }

    const found = await findCollectionRecord('notifications', recordId);
    if (!found) return res.status(404).json({ success: false, error: 'Notification introuvable.' });
    const targetIds = [
      found.raw.targetUserId, found.row.target_user_id,
      ...(Array.isArray(found.raw.targetEmployeeIds) ? found.raw.targetEmployeeIds : []),
    ].filter(Boolean).map(String);
    const recipient = String(found.raw.recipient || found.row.recipient || '').trim();
    const isOwn = targetIds.some(value => ownIds.has(value))
      || [employeeName, employee.email, req.user?.id].some(value => String(value || '').toLowerCase() === recipient.toLowerCase());
    const isBroadcast = ['tous', 'broadcast'].includes(recipient.toLowerCase());
    if (!isOwn && !isBroadcast) return res.status(403).json({ success: false, error: 'Tu ne peux modifier que tes propres notifications.' });
    req.body = { ...found.raw, id: found.raw.id || recordId, read: Boolean(body.read) };
    return next();
  } catch {
    return res.status(503).json({ success: false, error: 'Vérification des droits de notification indisponible.' });
  }
}

async function authorizeTaskWrite(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  if (isPrivileged(req.user)) return next();
  try {
    const employee = await getOwnEmployeeScope(req);
    if (!employee) return res.status(403).json({ success: false, error: 'Compte collaborateur introuvable.' });
    const ownIds = employeeScopeIds(employee);
    const employeeName = ownEmployeeName(employee);
    const body = req.body || {};
    const recordId = String(body.id || body.docId || body.doc_id || '').trim();
    const found = recordId ? await findCollectionRecord('tasks', recordId) : null;

    if (!found) {
      const requestedEmployeeId = String(body.employeeId || body.employee_id || '');
      if (requestedEmployeeId && !ownIds.has(requestedEmployeeId)) {
        return res.status(403).json({ success: false, error: 'Tu ne peux créer une tâche que pour toi-même.' });
      }
      req.body = {
        ...body,
        employeeId: String(employee.id),
        assignedTo: employeeName,
        status: 'todo',
        isMilestone: false,
      };
      return next();
    }

    const ownerId = String(found.row.employee_id || found.raw.employeeId || '');
    const assignedTo = String(found.row.assigned_to || found.raw.assignedTo || '');
    if (!ownIds.has(ownerId) && assignedTo.toLowerCase() !== employeeName.toLowerCase()) {
      return res.status(403).json({ success: false, error: 'Tu ne peux modifier que les tâches qui te sont assignées.' });
    }

    const mutableFields = [
      'status', 'subtasks', 'comments', 'incidents', 'lastUpdatedTime', 'updatedAt',
      'completedAt', 'milestoneProgress', 'progress', 'personalBucket', 'orderIndex',
      'timeSpent', 'actualStartTime', 'actualEndTime',
    ];
    const safeTask: Record<string, any> = { ...found.raw, id: found.raw.id || recordId, docId: found.row.doc_id || found.raw.docId };
    for (const field of mutableFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) safeTask[field] = body[field];
    }
    safeTask.employeeId = ownerId || String(employee.id);
    safeTask.assignedTo = assignedTo || employeeName;
    req.body = safeTask;
    return next();
  } catch {
    return res.status(503).json({ success: false, error: 'Vérification des droits de tâche indisponible.' });
  }
}

async function authorizeReminderWrite(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  if (isPrivileged(req.user)) return next();
  try {
    const employee = await getOwnEmployeeScope(req);
    if (!employee) return res.status(403).json({ success: false, error: 'Compte collaborateur introuvable.' });
    const ownIds = employeeScopeIds(employee);
    const body = req.body || {};
    const recordId = String(body.id || body.docId || body.doc_id || '').trim();
    const found = recordId ? await findCollectionRecord('reminders', recordId) : null;
    const currentIds = found && Array.isArray(found.raw.employeeIds) ? found.raw.employeeIds.map(String) : [];
    if (found && (found.raw.allEmployees === true || !currentIds.some(value => ownIds.has(value)))) {
      return res.status(403).json({ success: false, error: 'Tu ne peux modifier que tes propres rappels.' });
    }
    if (!found) {
      const requestedIds = Array.isArray(body.employeeIds) ? body.employeeIds.map(String) : [];
      if (body.allEmployees === true || !requestedIds.some(value => ownIds.has(value))) {
        return res.status(403).json({ success: false, error: 'Un rappel créé par un employé doit lui être destiné uniquement.' });
      }
    }
    req.body = {
      ...(found?.raw || {}),
      ...body,
      employeeIds: [String(employee.id)],
      allEmployees: false,
    };
    return next();
  } catch {
    return res.status(503).json({ success: false, error: 'Vérification des droits de rappel indisponible.' });
  }
}

async function authorizeIdeaWrite(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  if (isPrivileged(req.user)) return next();
  try {
    const body = req.body || {};
    const recordId = String(body.id || body.docId || body.doc_id || '').trim();
    const found = recordId ? await findCollectionRecord('idea_suggestions', recordId) : null;
    if (!found) {
      req.body = {
        ...body,
        authorId: body.isAnonymous ? undefined : String(req.user?.id || ''),
        authorName: body.isAnonymous ? undefined : String(req.user?.name || ''),
        status: 'soumise',
        likesCount: 1,
        likedUserIds: [String(req.user?.id || '')],
        managementResponse: undefined,
      };
      return next();
    }
    const oldIds = Array.isArray(found.raw.likedUserIds) ? found.raw.likedUserIds.map(String) : [];
    const nextIds = Array.isArray(body.likedUserIds) ? body.likedUserIds.map(String) : oldIds;
    const userId = String(req.user?.id || '');
    const oldOthers = oldIds.filter(value => value !== userId).sort();
    const nextOthers = nextIds.filter(value => value !== userId).sort();
    if (JSON.stringify(oldOthers) !== JSON.stringify(nextOthers) || nextIds.filter(value => value === userId).length > 1) {
      return res.status(403).json({ success: false, error: 'Un collaborateur ne peut modifier que son propre vote.' });
    }
    req.body = {
      ...found.raw,
      id: found.raw.id || recordId,
      likedUserIds: nextIds,
      likesCount: nextIds.length,
    };
    return next();
  } catch {
    return res.status(503).json({ success: false, error: 'Vérification des droits de suggestion indisponible.' });
  }
}

async function authorizeSurveyWrite(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  if (isPrivileged(req.user)) return next();
  try {
    const body = req.body || {};
    const recordId = String(body.id || body.docId || body.doc_id || '').trim();
    const found = recordId ? await findCollectionRecord('enterprise_surveys', recordId) : null;
    if (!found || String(found.raw.status || '').toLowerCase() !== 'actif') {
      return res.status(403).json({ success: false, error: 'Seul un sondage actif peut recevoir un vote.' });
    }
    const userId = String(req.user?.id || '');
    const oldVoters = Array.isArray(found.raw.votedUserIds) ? found.raw.votedUserIds.map(String) : [];
    if (oldVoters.includes(userId)) return res.status(409).json({ success: false, error: 'Tu as déjà participé à ce sondage.' });
    const newVoters = Array.isArray(body.votedUserIds) ? body.votedUserIds.map(String) : [];
    const expectedVoters = [...oldVoters, userId].sort();
    if (JSON.stringify([...newVoters].sort()) !== JSON.stringify(expectedVoters)) {
      return res.status(403).json({ success: false, error: 'Vote de sondage invalide.' });
    }
    const oldOptions = Array.isArray(found.raw.options) ? found.raw.options : [];
    const newOptions = Array.isArray(body.options) ? body.options : [];
    if (oldOptions.length !== newOptions.length) return res.status(403).json({ success: false, error: 'Options de sondage non modifiables.' });
    let incremented = 0;
    const safeOptions = oldOptions.map((oldOption: any) => {
      const nextOption = newOptions.find((option: any) => String(option.id) === String(oldOption.id));
      if (!nextOption || nextOption.text !== oldOption.text) throw new Error('Option de sondage invalide.');
      const delta = Number(nextOption.votesCount) - Number(oldOption.votesCount);
      if (delta === 1) incremented += 1;
      else if (delta !== 0) throw new Error('Compteur de vote invalide.');
      return { ...oldOption, votesCount: Number(oldOption.votesCount) + (delta === 1 ? 1 : 0) };
    });
    if (incremented !== 1) return res.status(403).json({ success: false, error: 'Un seul choix est autorisé par vote.' });
    req.body = { ...found.raw, id: found.raw.id || recordId, options: safeOptions, votedUserIds: expectedVoters };
    return next();
  } catch {
    return res.status(403).json({ success: false, error: 'Vote invalide ou déjà enregistré.' });
  }
}

function authorizeCollectionWrite(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  const collection = String(req.params.collection || '');
  if (ADMIN_ONLY_COLLECTIONS.has(collection)) return requireAdmin(req, res, next);
  if (MANAGER_COLLECTIONS.has(collection)) return requireAdminOrResponsable(req, res, next);
  if (collection === 'leave_requests' || collection === 'expense_claims' || collection === 'absences') return authorizeOwnEmployeeRecord(req, res, next);
  if (collection === 'notifications') return authorizeNotificationWrite(req, res, next);
  if (collection === 'tasks') return authorizeTaskWrite(req, res, next);
  if (collection === 'reminders') return authorizeReminderWrite(req, res, next);
  if (collection === 'idea_suggestions') return authorizeIdeaWrite(req, res, next);
  if (collection === 'enterprise_surveys') return authorizeSurveyWrite(req, res, next);
  return requireAdminOrResponsable(req, res, next);
}

function authorizeCollectionDelete(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  const collection = String(req.params.collection || '');
  if (ADMIN_ONLY_COLLECTIONS.has(collection)) return requireAdmin(req, res, next);
  return requireAdminOrResponsable(req, res, next);
}

async function authorizeOwnEmployeeRecord(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  if (isPrivileged(req.user)) return next();
  try {
    const employee = await getOwnEmployeeScope(req);
    if (!employee) return res.status(403).json({ success: false, error: 'Compte collaborateur introuvable.' });
    const allowed = employeeScopeIds(employee);
    const body = req.body || {};
    const target = String(body.employeeId || body.employee_id || body.employeeDocId || body.email || '');
    if (!target || !allowed.has(target)) {
      return res.status(403).json({ success: false, error: 'Tu ne peux modifier que tes propres demandes.' });
    }
    const collection = String(req.params.collection || '');
    const recordId = String(body.id || body.docId || body.doc_id || '').trim();
    const found = recordId ? await findCollectionRecord(collection, recordId) : null;
    if (recordId && !found) return res.status(404).json({ success: false, error: 'Demande introuvable.' });
    const protectedFields = [
      'status', 'approvedBy', 'approvedAt', 'validatedBy', 'validatedAt',
      'rejectionReason', 'decision', 'decisionBy', 'managerComment',
      'paymentStatus', 'reimbursedAt', 'paidAt', 'approved', 'isApproved',
    ];
    if (found) {
      const existingEmployeeId = String(found.row.employee_id || found.raw.employeeId || '');
      if (!allowed.has(existingEmployeeId)) return res.status(403).json({ success: false, error: 'Cette demande ne t’appartient pas.' });
      const existingStatus = String(found.row.status || found.raw.status || 'pending').toLowerCase();
      if (!['pending', 'soumise', 'submitted', 'draft', 'en_attente'].includes(existingStatus)) {
        return res.status(403).json({ success: false, error: 'Une demande déjà traitée ne peut plus être modifiée.' });
      }
      const safeRecord = { ...found.raw, ...body, employeeId: String(employee.id) };
      for (const field of protectedFields) {
        if (Object.prototype.hasOwnProperty.call(found.raw, field)) safeRecord[field] = found.raw[field];
        else delete safeRecord[field];
      }
      safeRecord.status = found.row.status || found.raw.status || 'pending';
      req.body = safeRecord;
    } else {
      const safeRecord = { ...body, employeeId: String(employee.id), status: 'pending' };
      for (const field of protectedFields) if (field !== 'status') delete safeRecord[field];
      req.body = safeRecord;
    }
    return next();
  } catch {
    return res.status(503).json({ success: false, error: 'Vérification des droits indisponible.' });
  }
}

async function authorizeClockingTarget(req: AuthRequest, target: any, res: express.Response): Promise<boolean> {
  if (isPrivileged(req.user)) return true;
  try {
    const [rows] = await getMariaDbPool().execute<RowDataPacket[]>(
      'SELECT id, doc_id, uid, email FROM employees WHERE user_id = ? LIMIT 1',
      [Number(req.user?.id)]
    );
    const employee = rows[0];
    const requested = String(target || employee?.id || '');
    const allowed = employee
      ? [employee.id, employee.doc_id, employee.uid, employee.email].filter(Boolean).map(String)
      : [];
    if (!employee || !allowed.includes(requested)) {
      res.status(403).json({ success: false, error: 'Tu ne peux effectuer le pointage que pour ton propre compte.' });
      return false;
    }
    return true;
  } catch {
    res.status(503).json({ success: false, error: 'Vérification du collaborateur indisponible.' });
    return false;
  }
}

export function registerCoreDataAndClockingRoutes(app: express.Express): void {
  app.get('/api/database/status', async (_req, res) => {
    try {
      const database = await pingMariaDb();
      res.json({
        success: true, isSqlConfigured: true, localPersistence: true,
        database: 'mariadb', message: 'MariaDB opérationnelle',
      });
    } catch (error: any) {
      res.status(503).json({
        success: false, isSqlConfigured: false, localPersistence: true,
        message: 'Base MariaDB indisponible',
      });
    }
  });

  app.get('/api/data/:collection', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { collection } = req.params;
      if (!isSupportedMariaDbCollection(collection)) return res.status(404).json({ success: false, error: 'Collection inconnue ou non autorisée.' });
      if (isGenericMariaDbCollection(collection) && collection !== 'absences' && !isPrivileged(req.user)) return res.status(403).json({ success: false, error: 'Accès réservé aux responsables.' });
      if (ADMIN_READ_COLLECTIONS.has(collection) && !isAdmin(req.user)) {
        return res.status(403).json({ success: false, error: 'Accès réservé à l’administrateur.' });
      }
      if (MANAGER_READ_COLLECTIONS.has(collection) && !isPrivileged(req.user)) {
        return res.status(403).json({ success: false, error: 'Accès réservé aux responsables.' });
      }

      let data = await getCollectionData(collection);
      const privileged = isPrivileged(req.user);
      let employee: RowDataPacket | null = null;
      let allowedEmployeeIds = new Set<string>();

      if (!privileged && (OWN_READ_COLLECTIONS.has(collection) || collection === 'notifications')) {
        employee = await getOwnEmployeeScope(req);
        allowedEmployeeIds = employeeScopeIds(employee);
        allowedEmployeeIds.add(String(req.user?.id || ''));
      }

      if (!privileged && OWN_READ_COLLECTIONS.has(collection)) {
        if (collection === 'reminders') {
          data = data.filter((item: any) => {
            const employeeIds = Array.isArray(item.employeeIds) ? item.employeeIds.map(String) : [];
            return item.allEmployees === true || employeeIds.some((id: string) => allowedEmployeeIds.has(id));
          });
        } else if (collection === 'calls') {
          const userId = String(req.user?.id || '');
          data = data.filter((item: any) =>
            String(item.callerId || item.caller_id || '') === userId ||
            String(item.receiverId || item.receiver_id || '') === userId
          );
        } else {
          data = data.filter((item: any) => {
            const target = String(item.employeeId || item.employee_id || item.employeeDocId || item.employeeEmail || '');
            return target !== '' && allowedEmployeeIds.has(target);
          });
        }
      }

      if (!privileged && collection === 'notifications') {
        const userId = String(req.user?.id || '');
        data = data.filter((item: any) => {
          const targetUser = String(item.targetUserId || item.target_user_id || item.userId || '');
          let targetEmployees: any = item.targetEmployeeIds || item.target_employee_ids || [];
          if (typeof targetEmployees === 'string') {
            try { targetEmployees = JSON.parse(targetEmployees); } catch { targetEmployees = []; }
          }
          if (!Array.isArray(targetEmployees)) targetEmployees = [];
          const hasTarget = Boolean(targetUser || targetEmployees.length);
          if (hasTarget) {
            return targetUser === userId || allowedEmployeeIds.has(targetUser)
              || targetEmployees.some((id: any) => allowedEmployeeIds.has(String(id)));
          }
          const recipient = String(item.recipient || '').trim().toLowerCase();
          const employeeName = String(employee?.name || '').trim().toLowerCase();
          const employeeEmail = String(employee?.email || req.user?.email || '').trim().toLowerCase();
          return ['tous', 'broadcast'].includes(recipient)
            || recipient === employeeName || recipient === employeeEmail || recipient === userId.toLowerCase();
        });
      }

      if (!privileged && collection === 'users') {
        const ownUserId = String(req.user?.id || '');
        const ownUid = String(req.user?.uid || '');
        const ownEmail = String(req.user?.email || '').toLowerCase();
        data = data.filter((item: any) =>
          String(item.id || '') === ownUserId ||
          String(item.uid || '') === ownUid ||
          String(item.email || '').toLowerCase() === ownEmail
        );
      }

      if (!privileged && collection === 'employees') {
        data = data.map((item: any) => {
          const safe = { ...item };
          for (const key of ['salary', 'salaryAmount', 'emergencyContact', 'birthDate', 'bankAccount', 'rib', 'nationalId', 'taxId', 'socialSecurityNumber']) {
            delete safe[key];
          }
          return safe;
        });
      }

      if (collection === 'presences') {
        data = data.map((item: any) => {
          const safe = { ...item };
          delete safe.qrCodeToken;
          if (safe.clockLocations && typeof safe.clockLocations === 'object') {
            safe.clockLocations = Object.fromEntries(
              Object.entries(safe.clockLocations).map(([key, value]: [string, any]) => {
                const safeLocation = value && typeof value === 'object' ? { ...value } : value;
                if (safeLocation && typeof safeLocation === 'object') delete safeLocation.qrCodeToken;
                return [key, safeLocation];
              })
            );
          }
          return safe;
        });
      }

      if (collection === 'company_settings') {
        data = data.map((item: any) => ({
          ...item,
          smtpPass: '',
          smtpPassConfigured: Boolean(item.smtpPass),
          smtpPassword: undefined,
          ...(!isAdmin(req.user) ? {
            qrCodeSecret: undefined,
            doorQrCodeToken: undefined,
            qrToken: undefined,
          } : {}),
        }));
      }
      res.json({ success: true, data });
    } catch (error: any) {
      console.error(`Error fetching collection ${req.params.collection}:`, error);
      res.status(500).json({ success: false, error: 'Erreur lors de la lecture des données.' });
    }
  });

  app.post('/api/data/:collection', requireAuth, authorizeCollectionWrite, async (req: AuthRequest, res) => {
    try {
      const { collection } = req.params;
      if (!isSupportedMariaDbCollection(collection)) return res.status(404).json({ success: false, error: 'Collection inconnue ou non autorisée.' });
      if (isGenericMariaDbCollection(collection) && !isPrivileged(req.user)) return res.status(403).json({ success: false, error: 'Accès réservé aux responsables.' });
      const saved = await saveDocumentData(collection, req.body);
      broadcastRealtimeEvent('collection_update', { collection, id: saved?.id, action: 'upsert' });
      res.json({ success: true, data: saved });
    } catch (error: any) {
      console.error(`Error saving to collection ${req.params.collection}:`, error);
      res.status(500).json({ success: false, error: error.message || 'Failed to save data' });
    }
  });

  app.delete('/api/data/:collection/:id', requireAuth, authorizeCollectionDelete, async (req: AuthRequest, res) => {
    try {
      const { collection, id } = req.params;
      if (!isSupportedMariaDbCollection(collection)) return res.status(404).json({ success: false, error: 'Collection inconnue ou non autorisée.' });
      if (isGenericMariaDbCollection(collection) && !isPrivileged(req.user)) return res.status(403).json({ success: false, error: 'Accès réservé aux responsables.' });
      await deleteDocumentData(collection, id);
      broadcastRealtimeEvent('collection_update', { collection, id, action: 'delete' });
      res.json({ success: true });
    } catch (error: any) {
      console.error(`Error deleting from collection ${req.params.collection}:`, error);
      res.status(500).json({ success: false, error: error.message || 'Failed to delete data' });
    }
  });

  app.post('/api/users/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid, email, name, role } = req.body;
      if (!uid || !email) {
        return res.status(400).json({ success: false, error: 'Missing uid or email' });
      }
      if (String(uid) !== String(req.user?.uid) || String(email).trim().toLowerCase() !== String(req.user?.email || '').toLowerCase()) {
        return res.status(403).json({ success: false, error: 'Synchronisation limitée au compte connecté.' });
      }
      const user = await getOrCreateUserRecord(uid, email, name, role);
      if (user) delete (user as any).raw_data;
      res.json({ success: true, data: user });
    } catch (error: any) {
      console.error('Error syncing user:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to sync user' });
    }
  });

  app.post('/api/collaborators/transactional', requireAuth, requireAdminOrResponsable, async (req: AuthRequest, res: express.Response) => {
    try {
      const input = req.body;
      if (String(req.user?.role || '').toLowerCase() === 'responsable' && [input?.userRole, input?.roleType].some((role: any) => String(role || '').toLowerCase().includes('admin'))) {
        return res.status(403).json({ success: false, error: 'Seul un administrateur peut attribuer le rôle administrateur.' });
      }
      if (!input?.name || !input?.email) {
        return res.status(400).json({ success: false, error: 'Nom et adresse email requis.' });
      }
      const result = await executeCollaboratorCreationTransaction(input);
      res.json(result);
    } catch (error: any) {
      console.error('[API Collaborator Transaction Error]:', error);
      res.status(500).json({ success: false, error: error.message || 'Échec de la transaction.' });
    }
  });

  app.post('/api/collaborators/update-transactional', requireAuth, requireAdminOrResponsable, async (req: AuthRequest, res) => {
    try {
      if (!req.body?.employee) return res.status(400).json({ success: false, error: 'Données collaborateur manquantes.' });
      if (String(req.user?.role || '').toLowerCase() === 'responsable') {
        const employeeInput = req.body.employee || {};
        const requestedRoleValues = [
          req.body.userRole, employeeInput.roleType, employeeInput.role,
          employeeInput.roleId, employeeInput.role_id,
        ];
        const requestsAdminRole = requestedRoleValues.some((value: any) =>
          String(value || '').toLowerCase().includes('admin') || (value !== null && value !== undefined && String(value).trim() !== '' && Number(value) === 1)
        );
        if (requestsAdminRole) {
          return res.status(403).json({ success: false, error: 'Seul un administrateur peut attribuer le rôle administrateur.' });
        }

        const targetKey = String(employeeInput._dbId || employeeInput.id || employeeInput.docId || employeeInput.doc_id || employeeInput.uid || employeeInput.email || '').trim();
        if (targetKey) {
          const [targetRows] = await getMariaDbPool().execute<RowDataPacket[]>(
            `SELECT COALESCE(u.role_id, e.role_id) AS role_id, r.code AS role_code
             FROM employees e
             LEFT JOIN users u ON u.id = e.user_id
             LEFT JOIN roles r ON r.id = COALESCE(u.role_id, e.role_id)
             WHERE e.id = ? OR e.doc_id = ? OR e.uid = ? OR LOWER(e.email) = ?
             LIMIT 1`,
            [/^\d+$/.test(targetKey) ? Number(targetKey) : -1, targetKey, targetKey, targetKey.toLowerCase()]
          );
          const targetRole = String(targetRows[0]?.role_code || '').toUpperCase();
          if (Number(targetRows[0]?.role_id) === 1 || targetRole.includes('ADMIN')) {
            return res.status(403).json({ success: false, error: 'Un responsable ne peut pas modifier le compte d’un administrateur.' });
          }
        }
      }
      const result = await executeCollaboratorUpdateTransaction(req.body);
      broadcastRealtimeEvent('collection_update', { collection: 'employees', action: 'upsert', id: result.employee?.id });
      broadcastRealtimeEvent('collection_update', { collection: 'users', action: 'upsert', id: result.user?.id });
      return res.json(result);
    } catch (error: any) {
      console.error('[API Collaborator Update Transaction Error]:', error);
      return res.status(500).json({ success: false, error: error.message || 'Échec de la mise à jour du collaborateur.' });
    }
  });

  app.post('/api/clocking/atomic', requireAuth, async (req: AuthRequest, res: express.Response) => {
    try {
      const input = req.body;
      if (!input?.presence) {
        return res.status(400).json({ success: false, error: 'Données de présence manquantes.' });
      }
      const targetEmployee = input.presence.employeeId || input.presence.employee_id || input.presence.employeeEmail;
      if (!(await authorizeClockingTarget(req, targetEmployee, res))) return;
      const result = await executeAtomicClockingTransaction({ ...input, actor: { id: String(req.user?.id), role: String(req.user?.role || '') } });
      if (result.success) {
        broadcastRealtimeEvent('presence_update', {
          presence: result.presence,
          incident: result.incident,
          notification: result.notification,
          timestamp: new Date().toISOString(),
        });
        if (String(input.presence.clockingMethod || input.presence.method || '').toLowerCase() === 'qr_code_dynamic') {
          broadcastRealtimeEvent('collection_update', { collection: 'dynamic_qr_sessions', action: 'upsert' });
        }

        const reqOrigin =
          (typeof req.headers.origin === 'string' && req.headers.origin) ||
          (req.headers.host ? `${req.protocol || 'https'}://${req.headers.host}` : undefined);

        publishClockingBeamsNotification({
          presence: result.presence || input.presence,
          action: input.action,
          origin: reqOrigin,
        }).catch((beamsErr) => {
          console.warn('[API /api/clocking/atomic] Beams publish notice:', beamsErr?.message || beamsErr);
        });
      }
      res.json(result);
    } catch (error: any) {
      console.error('[API Atomic Clocking Error]:', error);
      const message = error?.message || 'Échec du pointage atomique.';
      res.status(String(message).startsWith('Pointage rejeté') ? 403 : 500).json({ success: false, error: message });
    }
  });

  app.get('/api/push/beams/config', (_req: express.Request, res: express.Response) => {
    const { instanceId, secretKey } = getBeamsCredentials();
    res.json({
      success: true,
      configured: Boolean(instanceId && secretKey),
      instanceId,
    });
  });

  app.post('/api/push/beams/publish', requireAuth, requireAdminOrResponsable, async (req: express.Request, res: express.Response) => {
    try {
      const {
        title,
        body,
        interests,
        targetRoles,
        targetUserIds,
        targetEmployeeIds,
        targetEmails,
        link,
        operationKey,
        data,
      } = req.body || {};

      if (!title || !body) {
        return res.status(400).json({ success: false, error: 'Titre et message requis.' });
      }

      const reqOrigin =
        (typeof req.headers.origin === 'string' && req.headers.origin) ||
        (req.headers.host ? `${req.protocol || 'https'}://${req.headers.host}` : undefined);

      const result = await publishBeamsNotification({
        title,
        body,
        interests,
        targetRoles,
        targetUserIds,
        targetEmployeeIds,
        targetEmails,
        link,
        origin: reqOrigin,
        operationKey,
        data,
      });

      res.json(result);
    } catch (error: any) {
      console.error('[API /api/push/beams/publish Error]:', error);
      res.status(500).json({ success: false, error: error?.message || 'Erreur publication Pusher Beams.' });
    }
  });

  app.get('/api/clocking/eligibility', requireAuth, async (req: AuthRequest, res: express.Response) => {
    try {
      let employeeId = req.query.employeeId as string | undefined;
      let userId = req.query.userId as string | undefined;
      let email = req.query.email as string | undefined;
      if (!isPrivileged(req.user)) {
        const [rows] = await getMariaDbPool().execute<RowDataPacket[]>(
          'SELECT id FROM employees WHERE user_id = ? LIMIT 1', [Number(req.user?.id)]
        );
        if (!rows[0]) return res.status(403).json({ success: false, error: 'Aucun dossier collaborateur associé au compte.' });
        employeeId = String(rows[0].id);
        userId = String(req.user?.id);
        email = String(req.user?.email || '');
      }
      const result = await checkClockingEligibilityBackend({ employeeId, userId, email });
      res.json(result);
    } catch (error: any) {
      console.error('[API Clocking Eligibility Error]:', error);
      res.status(500).json({ success: false, error: error.message || 'Erreur vérification éligibilité pointage.' });
    }
  });
}
