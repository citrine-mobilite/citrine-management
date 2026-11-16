import express from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import {
  getCollectionData,
  saveDocumentData,
  deleteDocumentData,
  getOrCreateUserRecord,
  executeCollaboratorCreationTransaction,
  executeAtomicClockingTransaction,
  checkClockingEligibilityBackend,
} from '../db/repository';
import { broadcastRealtimeEvent } from './expressRealtimeHub';
import {
  getBeamsCredentials,
  publishBeamsNotification,
  publishClockingBeamsNotification,
} from './services/pusherBeamsService';

export function registerCoreDataAndClockingRoutes(app: express.Express): void {
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/database/status', async (_req, res) => {
    try {
      const isSql = Boolean(process.env.SQL_HOST || process.env.DATABASE_URL);
      res.json({
        success: true,
        isSqlConfigured: isSql,
        localPersistence: true,
        message: isSql ? 'Base de données SQL active' : 'Persistance disque locale active',
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get('/api/data/:collection', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { collection } = req.params;
      const data = await getCollectionData(collection);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error(`Error fetching collection ${req.params.collection}:`, error);
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch data' });
    }
  });

  app.post('/api/data/:collection', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { collection } = req.params;
      const saved = await saveDocumentData(collection, req.body);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      console.error(`Error saving to collection ${req.params.collection}:`, error);
      res.status(500).json({ success: false, error: error.message || 'Failed to save data' });
    }
  });

  app.delete('/api/data/:collection/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { collection, id } = req.params;
      await deleteDocumentData(collection, id);
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
      const user = await getOrCreateUserRecord(uid, email, name, role);
      res.json({ success: true, data: user });
    } catch (error: any) {
      console.error('Error syncing user:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to sync user' });
    }
  });

  app.post('/api/collaborators/transactional', async (req: express.Request, res: express.Response) => {
    try {
      const input = req.body;
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

  app.post('/api/clocking/atomic', async (req: express.Request, res: express.Response) => {
    try {
      const input = req.body;
      if (!input?.presence) {
        return res.status(400).json({ success: false, error: 'Données de présence manquantes.' });
      }
      const result = await executeAtomicClockingTransaction(input);
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
      res.status(500).json({ success: false, error: error.message || 'Échec du pointage atomique.' });
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

  app.post('/api/push/beams/publish', async (req: express.Request, res: express.Response) => {
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

  app.get('/api/clocking/eligibility', async (req: express.Request, res: express.Response) => {
    try {
      const result = await checkClockingEligibilityBackend({
        employeeId: req.query.employeeId as string | undefined,
        userId: req.query.userId as string | undefined,
        email: req.query.email as string | undefined,
      });
      res.json(result);
    } catch (error: any) {
      console.error('[API Clocking Eligibility Error]:', error);
      res.status(500).json({ success: false, error: error.message || 'Erreur vérification éligibilité pointage.' });
    }
  });
}
