import express from 'express';
import { pingMariaDb, getMariaDbPool } from '../db/mariadb';
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
  'presences', 'attendance_incidents', 'leave_requests', 'expense_claims',
]);

async function getOwnEmployeeScope(req: AuthRequest): Promise<RowDataPacket | null> {
  const [rows] = await getMariaDbPool().execute<RowDataPacket[]>(
    'SELECT id, doc_id, uid, email FROM employees WHERE user_id = ? LIMIT 1',
    [Number(req.user?.id)]
  );
  return rows[0] || null;
}

function employeeScopeIds(employee: RowDataPacket | null): Set<string> {
  return new Set(employee
    ? [employee.id, employee.doc_id, employee.uid, employee.email].filter(Boolean).map(String)
    : []);
}

function authorizeCollectionWrite(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  const collection = String(req.params.collection || '');
  if (ADMIN_ONLY_COLLECTIONS.has(collection)) return requireAdmin(req, res, next);
  if (MANAGER_COLLECTIONS.has(collection)) return requireAdminOrResponsable(req, res, next);
  if (collection === 'leave_requests' || collection === 'expense_claims') {
    return authorizeOwnEmployeeRecord(req, res, next);
  }
  return next();
}

function authorizeCollectionDelete(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  const collection = String(req.params.collection || '');
  if (ADMIN_ONLY_COLLECTIONS.has(collection)) return requireAdmin(req, res, next);
  return requireAdminOrResponsable(req, res, next);
}

async function authorizeOwnEmployeeRecord(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  if (isPrivileged(req.user)) return next();
  try {
    const [rows] = await getMariaDbPool().execute<RowDataPacket[]>(
      'SELECT id, doc_id, uid, email FROM employees WHERE user_id = ? LIMIT 1',
      [Number(req.user?.id)]
    );
    const employee = rows[0];
    const body = req.body || {};
    const target = String(body.employeeId || body.employee_id || body.employeeDocId || body.email || '');
    const allowed = employee
      ? [employee.id, employee.doc_id, employee.uid, employee.email].filter(Boolean).map(String)
      : [];
    if (!target || !allowed.includes(target)) {
      return res.status(403).json({ success: false, error: 'Tu ne peux modifier que tes propres demandes.' });
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
      }

      if (!privileged && OWN_READ_COLLECTIONS.has(collection)) {
        data = data.filter((item: any) => {
          const target = String(item.employeeId || item.employee_id || item.employeeDocId || item.employeeEmail || '');
          return target !== '' && allowedEmployeeIds.has(target);
        });
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
          return !hasTarget || targetUser === userId || targetEmployees.some((id: any) => allowedEmployeeIds.has(String(id)));
        });
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
      if (String(req.user?.role || '').toLowerCase() === 'responsable' && [req.body?.userRole, req.body?.employee?.roleType].some((role: any) => String(role || '').toLowerCase().includes('admin'))) {
        return res.status(403).json({ success: false, error: 'Seul un administrateur peut attribuer le rôle administrateur.' });
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
