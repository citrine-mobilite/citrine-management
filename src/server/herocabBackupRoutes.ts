import crypto from 'node:crypto';
import type express from 'express';
import {
  executeDirectServerBackup,
  getBackupEnvironmentStatus,
  getBackupPolicySettings,
  listBackupRuns,
  recordExternalBackupReport,
  saveBackupPolicySettings,
  testBackupConnections,
  triggerGithubLevel2Backup,
  verifyExistingDriveBackupFile,
} from './herocabBackupService';
import { getGoogleDriveConfigStatus, listDriveBackupFiles } from './googleDriveBackupClient';
import type { BackupExecutionMode } from '../types/backupTypes';

function timingSafeSecretEqual(provided: string, expected: string): boolean {
  const a = Buffer.from(provided || '', 'utf8');
  const b = Buffer.from(expected || '', 'utf8');
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function isAdminHeaderPresent(req: express.Request): boolean {
  const roleHeader = String(req.headers['x-citrine-user-role'] || '').trim().toLowerCase();
  if (!roleHeader) return true; // Keep compatible with internal/dev calls when custom header omitted
  return roleHeader === 'administrateur' || roleHeader === 'admin';
}

export function registerHerocabBackupRoutes(app: express.Express): void {
  // 1. Read-only status, env diagnostics, policy settings, runs history & Drive listing
  app.get('/api/backups/status', async (_req: express.Request, res: express.Response) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const [environment, settings, runs] = await Promise.all([
        getBackupEnvironmentStatus(),
        getBackupPolicySettings(),
        listBackupRuns(60),
      ]);

      let driveFiles: any[] = [];
      let driveListError: string | null = null;
      const driveStatus = getGoogleDriveConfigStatus();
      if (driveStatus.ready && driveStatus.folderId) {
        try {
          driveFiles = await listDriveBackupFiles(driveStatus.folderId, settings.retentionDays);
        } catch (err: any) {
          driveListError = err?.message || 'Impossible de lister le dossier Google Drive.';
        }
      }

      res.json({
        success: true,
        environment,
        settings,
        runs,
        driveFiles,
        driveListError,
      });
    } catch (error: any) {
      console.error('[API /api/backups/status Error]:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Impossible de charger le tableau de bord Sauvegarde.',
      });
    }
  });

  // 2. Save non-secret operational policy settings (retention days, alerts, required tables, preferred mode)
  app.post('/api/backups/settings', async (req: express.Request, res: express.Response) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!isAdminHeaderPresent(req)) {
      return res.status(403).json({ success: false, error: 'Action réservée aux administrateurs.' });
    }
    try {
      const updatedBy = String(req.headers['x-citrine-user-email'] || req.body?.updatedBy || 'Administrateur');
      const saved = await saveBackupPolicySettings(req.body || {}, updatedBy);
      res.json({ success: true, settings: saved });
    } catch (error: any) {
      console.error('[API /api/backups/settings Error]:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Échec de sauvegarde de la politique de sauvegarde.',
      });
    }
  });

  // 3. Test live connections (cPanel API Token, Google Drive folder, GitHub Actions workflow)
  app.post('/api/backups/test-connections', async (req: express.Request, res: express.Response) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!isAdminHeaderPresent(req)) {
      return res.status(403).json({ success: false, error: 'Action réservée aux administrateurs.' });
    }
    try {
      const result = await testBackupConnections();
      res.json(result);
    } catch (error: any) {
      console.error('[API /api/backups/test-connections Error]:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Échec du test de connectivité.',
      });
    }
  });

  // 4. Manual backup trigger (GitHub Actions Level 2 MySQL restore OR direct server Level 1)
  app.post('/api/backups/trigger', async (req: express.Request, res: express.Response) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!isAdminHeaderPresent(req)) {
      return res.status(403).json({ success: false, error: 'Action réservée aux administrateurs.' });
    }
    try {
      const settings = await getBackupPolicySettings();
      const envStatus = await getBackupEnvironmentStatus();
      const requestedMode = (req.body?.mode as BackupExecutionMode | undefined) || settings.preferredMode;
      const triggeredBy = String(
        req.body?.triggeredBy || req.headers['x-citrine-user-email'] || 'Administrateur (UI)'
      );

      if (requestedMode === 'github_level2') {
        if (!envStatus.githubLevel2Ready) {
          return res.status(400).json({
            success: false,
            error:
              'Le moteur Niveau 2 (MySQL temporaire sur GitHub Actions) requiert BACKUP_GITHUB_REPO et BACKUP_GITHUB_TOKEN. Configurez ces variables ou basculez temporairement sur le mode Serveur direct.',
          });
        }
        const dispatched = await triggerGithubLevel2Backup({
          triggeredBy,
          triggerSource: 'manual_ui',
        });
        return res.status(202).json({
          success: true,
          mode: 'github_level2',
          message:
            'Pipeline Niveau 2 (MySQL temporaire) déclenché sur GitHub Actions. Le rapport complet apparaîtra automatiquement dans l’historique dès la fin de la vérification.',
          run: dispatched.run,
        });
      }

      if (!envStatus.cpanelReady || !envStatus.googleDriveReady) {
        return res.status(400).json({
          success: false,
          error:
            'Variables cPanel ou Google Drive manquantes pour lancer la sauvegarde directe. Consultez l’onglet Pipeline & Diagnostic.',
        });
      }

      const run = await executeDirectServerBackup({
        triggeredBy,
        triggerSource: 'manual_ui',
      });

      const ok = run.status === 'verified' || run.status === 'warning';
      return res.status(ok ? 200 : 500).json({
        success: ok,
        mode: 'server_direct',
        message: ok
          ? `Sauvegarde ${run.fileName} vérifiée et archivée sur Google Drive (${run.purgedCount} archive(s) > ${settings.retentionDays}j purgée(s)).`
          : run.errorMessage || 'La sauvegarde a échoué ou présente une anomalie d’intégrité.',
        run,
      });
    } catch (error: any) {
      console.error('[API /api/backups/trigger Error]:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Impossible de lancer la sauvegarde.',
      });
    }
  });

  // 5. On-demand anti-corruption re-verification of an archive stored in Google Drive
  app.post('/api/backups/verify-drive-file', async (req: express.Request, res: express.Response) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!isAdminHeaderPresent(req)) {
      return res.status(403).json({ success: false, error: 'Action réservée aux administrateurs.' });
    }
    try {
      const fileId = String(req.body?.fileId || '').trim();
      if (!fileId) {
        return res.status(400).json({ success: false, error: 'Identifiant fileId Google Drive requis.' });
      }
      const verification = await verifyExistingDriveBackupFile(fileId);
      res.json({ success: true, verification });
    } catch (error: any) {
      console.error('[API /api/backups/verify-drive-file Error]:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Échec de la re-vérification du fichier Google Drive.',
      });
    }
  });

  // 6. Signed webhook callback from GitHub Actions Level 2 Runner
  app.post('/api/backups/webhook', async (req: express.Request, res: express.Response) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const expectedSecret = (process.env.BACKUP_WEBHOOK_SECRET || '').trim();
      const providedSecret = String(
        req.headers['x-backup-webhook-secret'] ||
          (typeof req.headers.authorization === 'string'
            ? req.headers.authorization.replace(/^Bearer\s+/i, '')
            : '')
      ).trim();

      if (!expectedSecret) {
        return res.status(503).json({
          success: false,
          error: 'BACKUP_WEBHOOK_SECRET non configuré côté serveur.',
        });
      }

      if (!timingSafeSecretEqual(providedSecret, expectedSecret)) {
        return res.status(401).json({
          success: false,
          error: 'Signature webhook invalide.',
        });
      }

      const saved = await recordExternalBackupReport(req.body || {});
      res.json({ success: true, run: saved });
    } catch (error: any) {
      console.error('[API /api/backups/webhook Error]:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Impossible d’enregistrer le rapport de sauvegarde.',
      });
    }
  });

  // 7. Scheduled midnight cron endpoint (protected by CRON_SECRET if set)
  app.all('/api/cron/herocab-backup', async (req: express.Request, res: express.Response) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const expectedCronSecret = (process.env.CRON_SECRET || '').trim();
      if (expectedCronSecret) {
        const provided = String(
          (typeof req.headers.authorization === 'string'
            ? req.headers.authorization.replace(/^Bearer\s+/i, '')
            : '') || req.headers['x-cron-secret'] || ''
        ).trim();
        if (!timingSafeSecretEqual(provided, expectedCronSecret)) {
          return res.status(401).json({ success: false, error: 'CRON_SECRET invalide.' });
        }
      }

      const envStatus = await getBackupEnvironmentStatus();
      if (envStatus.githubLevel2Ready) {
        const dispatched = await triggerGithubLevel2Backup({
          triggeredBy: 'Cron Minuit (00h00 Douala)',
          triggerSource: 'api_cron',
        });
        return res.status(202).json({ success: true, mode: 'github_level2', run: dispatched.run });
      }

      const run = await executeDirectServerBackup({
        triggeredBy: 'Cron Minuit (00h00 Douala)',
        triggerSource: 'api_cron',
      });
      res.status(run.status === 'verified' || run.status === 'warning' ? 200 : 500).json({
        success: run.status === 'verified' || run.status === 'warning',
        mode: 'server_direct',
        run,
      });
    } catch (error: any) {
      console.error('[API /api/cron/herocab-backup Error]:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Échec du cron de sauvegarde HeroCab.',
      });
    }
  });
}
