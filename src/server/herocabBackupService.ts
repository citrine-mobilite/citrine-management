import crypto from 'node:crypto';
import { getCollectionData, saveDocumentData } from '../db/repository';
import { sendConsolidatedReportEmail, getEffectiveSmtpConfig, parseEmailList } from '../services/serverMailService';
import {
  DEFAULT_BACKUP_POLICY_SETTINGS,
  type BackupConnectionTestResult,
  type BackupEnvironmentStatus,
  type BackupExecutionMode,
  type BackupIntegritySummary,
  type BackupPolicySettings,
  type BackupRunRecord,
  type BackupTriggerSource,
  type EnvVarDiagnosticItem,
} from '../types/backupTypes';
import {
  buildBackupFileName,
  computeBufferChecksums,
  computeRetentionPurgePlan,
  ensureGzipBuffer,
  formatBackupSize,
  getNextMidnightDoualaIso,
  validateSqlBackupBuffer,
} from '../utils/backupIntegrityHelpers';
import {
  deleteDriveFile,
  downloadDriveFileBuffer,
  getGoogleDriveConfigStatus,
  listDriveBackupFiles,
  uploadBackupToDrive,
  verifyDriveFolderAccess,
} from './googleDriveBackupClient';

const BACKUP_RUNS_COLLECTION = 'herocab_backup_runs';
const BACKUP_SETTINGS_COLLECTION = 'herocab_backup_settings';
const BACKUP_SETTINGS_DOC_ID = 'herocab_backup_policy';
const GITHUB_WORKFLOW_FILE = 'herocab-sql-backup.yml';

function cleanHost(raw: string | undefined): string {
  return (raw || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '');
}

function getCpanelBaseUrl(): { baseUrl: string; host: string; port: string; username: string; token: string; dbName: string } | null {
  const host = cleanHost(process.env.CPANEL_HOST);
  const port = (process.env.CPANEL_PORT || '2083').trim();
  const username = (process.env.CPANEL_USERNAME || '').trim();
  const token = (process.env.CPANEL_API_TOKEN || '').trim();
  const dbName = (process.env.HEROCAB_DB_NAME || '').trim();

  if (!host || !username || !token || !dbName) {
    return null;
  }
  return {
    baseUrl: `https://${host}:${port}`,
    host,
    port,
    username,
    token,
    dbName,
  };
}

function getGithubActionsConfig(): { token: string; repo: string; ref: string } | null {
  const token = (process.env.BACKUP_GITHUB_TOKEN || '').trim();
  const repo = (process.env.BACKUP_GITHUB_REPO || '').trim();
  const ref = (process.env.BACKUP_GITHUB_REF || 'main').trim();
  if (!token || !repo || !repo.includes('/')) return null;
  return { token, repo, ref };
}

export async function getBackupEnvironmentStatus(): Promise<BackupEnvironmentStatus> {
  const cpanelHost = cleanHost(process.env.CPANEL_HOST) || null;
  const cpanelUser = (process.env.CPANEL_USERNAME || '').trim();
  const cpanelToken = (process.env.CPANEL_API_TOKEN || '').trim();
  const dbName = (process.env.HEROCAB_DB_NAME || '').trim() || null;
  const cpanelReady = Boolean(cpanelHost && cpanelUser && cpanelToken && dbName);

  const driveStatus = getGoogleDriveConfigStatus();
  const ghConfig = getGithubActionsConfig();
  const webhookSecretConfigured = Boolean((process.env.BACKUP_WEBHOOK_SECRET || '').trim());
  const cronSecretConfigured = Boolean((process.env.CRON_SECRET || '').trim());

  let smtpReady = false;
  try {
    const smtp = await getEffectiveSmtpConfig();
    smtpReady = Boolean(smtp.host && smtp.user && smtp.pass);
  } catch {
    smtpReady = false;
  }

  const hasSa = Boolean(
    (process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON || '').trim() ||
      ((process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL || '').trim() &&
        (process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY || '').trim())
  );
  const hasOauthRefresh = Boolean(
    (process.env.GOOGLE_DRIVE_CLIENT_ID || '').trim() &&
      (process.env.GOOGLE_DRIVE_CLIENT_SECRET || '').trim() &&
      (process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '').trim()
  );

  const variables: EnvVarDiagnosticItem[] = [
    {
      key: 'CPANEL_HOST',
      group: 'cpanel',
      requiredFor: 'Export SQL cPanel',
      configured: Boolean(cpanelHost),
      hint: 'Domaine ou IP du serveur cPanel HeroCab (ex: cpanel.herocab.cm)',
    },
    {
      key: 'CPANEL_USERNAME',
      group: 'cpanel',
      requiredFor: 'Export SQL cPanel',
      configured: Boolean(cpanelUser),
      hint: 'Identifiant du compte cPanel propriétaire de la BD HeroCab',
    },
    {
      key: 'CPANEL_API_TOKEN',
      group: 'cpanel',
      requiredFor: 'Export SQL cPanel',
      configured: Boolean(cpanelToken),
      hint: 'Jeton créé dans cPanel → Sécurité → Gérer les jetons API (aucun port 3306 ouvert)',
    },
    {
      key: 'HEROCAB_DB_NAME',
      group: 'cpanel',
      requiredFor: 'Export SQL cPanel',
      configured: Boolean(dbName),
      hint: 'Nom complet de la base MySQL/MariaDB (ex: herocab_prod)',
    },
    {
      key: 'GOOGLE_DRIVE_BACKUP_FOLDER_ID',
      group: 'google_drive',
      requiredFor: 'Archivage Drive & Purge 45j',
      configured: Boolean(driveStatus.folderId),
      hint: 'ID du dossier Google Drive cible (chaîne dans l’URL après /folders/)',
    },
    {
      key: 'GOOGLE_DRIVE_CLIENT_ID',
      group: 'google_drive',
      requiredFor: 'Option A · Gmail personnel',
      configured: Boolean((process.env.GOOGLE_DRIVE_CLIENT_ID || '').trim()),
      optional: hasSa,
      hint: 'ID client OAuth Google Cloud (requis avec CLIENT_SECRET et REFRESH_TOKEN)',
    },
    {
      key: 'GOOGLE_DRIVE_CLIENT_SECRET',
      group: 'google_drive',
      requiredFor: 'Option A · Gmail personnel',
      configured: Boolean((process.env.GOOGLE_DRIVE_CLIENT_SECRET || '').trim()),
      optional: hasSa,
      hint: 'Secret client OAuth Google Cloud (pour renouvellement automatique à minuit)',
    },
    {
      key: 'GOOGLE_DRIVE_REFRESH_TOKEN',
      group: 'google_drive',
      requiredFor: 'Option A · Gmail personnel',
      configured: Boolean((process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '').trim()),
      optional: hasSa,
      hint: 'Jeton hors-ligne Google Drive (utilise votre quota Gmail personnel sans blocage 0 Go)',
    },
    {
      key: 'GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON',
      group: 'google_drive',
      requiredFor: 'Option B · Drive partagé',
      configured: hasSa,
      optional: true,
      hint: 'Alternative à l’Option A uniquement si vous utilisez un Drive partagé Google Workspace',
    },
    {
      key: 'BACKUP_GITHUB_REPO',
      group: 'github_actions',
      requiredFor: 'Test MySQL temporaire (Niveau 2)',
      configured: Boolean(ghConfig?.repo),
      hint: 'Dépôt GitHub hébergeant le workflow (ex: citrine-mobilite/citrine-management)',
    },
    {
      key: 'BACKUP_GITHUB_TOKEN',
      group: 'github_actions',
      requiredFor: 'Déclenchement manuel Niveau 2',
      configured: Boolean(ghConfig?.token),
      hint: 'Fine-grained PAT GitHub avec permission Actions: Read & Write',
    },
    {
      key: 'BACKUP_WEBHOOK_SECRET',
      group: 'security',
      requiredFor: 'Signature rapport GitHub → App',
      configured: webhookSecretConfigured,
      hint: 'Clé aléatoire partagée entre Vercel et GitHub Secrets pour sécuriser les rapports',
    },
    {
      key: 'CRON_SECRET',
      group: 'security',
      requiredFor: 'Protection route Cron',
      configured: cronSecretConfigured,
      optional: true,
      hint: 'Clé Bearer protégeant l’endpoint /api/cron/herocab-backup',
    },
  ];

  return {
    cpanelReady,
    cpanelHostConfigured: cpanelHost,
    databaseNameConfigured: dbName,
    googleDriveReady: driveStatus.ready,
    googleDriveAuthMode: driveStatus.authMode,
    googleDriveFolderConfigured: Boolean(driveStatus.folderId),
    githubLevel2Ready: Boolean(ghConfig),
    githubRepoConfigured: ghConfig?.repo || null,
    webhookSecretConfigured,
    cronSecretConfigured,
    smtpReady,
    nextMidnightDoualaIso: getNextMidnightDoualaIso(),
    variables,
  };
}

export async function getBackupPolicySettings(): Promise<BackupPolicySettings> {
  try {
    const items = await getCollectionData(BACKUP_SETTINGS_COLLECTION);
    const existing = Array.isArray(items)
      ? items.find((item: any) => item.id === BACKUP_SETTINGS_DOC_ID) || items[0]
      : null;

    if (!existing) {
      return { ...DEFAULT_BACKUP_POLICY_SETTINGS };
    }

    return {
      ...DEFAULT_BACKUP_POLICY_SETTINGS,
      ...existing,
      id: BACKUP_SETTINGS_DOC_ID,
      retentionDays: Math.min(365, Math.max(7, Number(existing.retentionDays ?? 45))),
      minKeepValidBackups: Math.min(30, Math.max(1, Number(existing.minKeepValidBackups ?? 7))),
      requiredTables: Array.isArray(existing.requiredTables)
        ? existing.requiredTables.map((t: any) => String(t).trim()).filter(Boolean)
        : [],
    };
  } catch (err) {
    console.warn('[BackupService] Erreur lecture politique de sauvegarde:', err);
    return { ...DEFAULT_BACKUP_POLICY_SETTINGS };
  }
}

export async function saveBackupPolicySettings(
  patch: Partial<BackupPolicySettings>,
  updatedBy: string
): Promise<BackupPolicySettings> {
  const current = await getBackupPolicySettings();
  const retentionDays = Math.min(365, Math.max(7, Number(patch.retentionDays ?? current.retentionDays ?? 45)));
  const minKeepValidBackups = Math.min(
    30,
    Math.max(1, Number(patch.minKeepValidBackups ?? current.minKeepValidBackups ?? 7))
  );
  const preferredMode: BackupExecutionMode =
    patch.preferredMode === 'server_direct' || patch.preferredMode === 'github_level2'
      ? patch.preferredMode
      : current.preferredMode;

  const requiredTables = Array.isArray(patch.requiredTables)
    ? patch.requiredTables.map((t) => String(t).trim()).filter(Boolean)
    : current.requiredTables;

  const updated: BackupPolicySettings = {
    ...current,
    id: BACKUP_SETTINGS_DOC_ID,
    databaseLabel: (patch.databaseLabel ?? current.databaseLabel ?? 'Base SQL HeroCab (cPanel)').trim().slice(0, 120),
    retentionDays,
    minKeepValidBackups,
    preferredMode,
    requiredTables,
    alertOnFailure: patch.alertOnFailure !== undefined ? Boolean(patch.alertOnFailure) : current.alertOnFailure,
    alertOnSuccess: patch.alertOnSuccess !== undefined ? Boolean(patch.alertOnSuccess) : current.alertOnSuccess,
    alertEmails: patch.alertEmails !== undefined ? String(patch.alertEmails).trim() : current.alertEmails,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  await saveDocumentData(BACKUP_SETTINGS_COLLECTION, updated);
  return updated;
}

export async function listBackupRuns(limit: number = 60): Promise<BackupRunRecord[]> {
  try {
    const items = await getCollectionData(BACKUP_RUNS_COLLECTION);
    const list: BackupRunRecord[] = Array.isArray(items) ? items : [];
    return list
      .sort((a, b) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime())
      .slice(0, limit);
  } catch (err) {
    console.warn('[BackupService] Erreur lecture historique sauvegardes:', err);
    return [];
  }
}

export async function saveBackupRunRecord(record: BackupRunRecord): Promise<BackupRunRecord> {
  await saveDocumentData(BACKUP_RUNS_COLLECTION, record);
  return record;
}

async function sendBackupAlertEmail(
  run: BackupRunRecord,
  settings: BackupPolicySettings
): Promise<boolean> {
  const isFailure = run.status === 'failed' || run.status === 'corrupted';
  if (isFailure && !settings.alertOnFailure) return false;
  if (!isFailure && !settings.alertOnSuccess) return false;

  const recipientEmails = parseEmailList(settings.alertEmails);
  const statusLabel =
    run.status === 'verified'
      ? 'RÉUSSIE & VÉRIFIÉE'
      : run.status === 'warning'
        ? 'VÉRIFIÉE AVEC AVERTISSEMENT'
        : run.status === 'corrupted'
          ? 'CORROMPUE — ACTION REQUISE'
          : 'ÉCHEC DE SAUVEGARDE';

  const color = isFailure ? '#DC2626' : run.status === 'warning' ? '#D97706' : '#16A34A';
  const subject = `[HeroCab Backup] ${statusLabel} — ${run.databaseName}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #1c1917;">
      <h2 style="margin: 0 0 12px 0; color: ${color};">Rapport de sauvegarde SQL HeroCab : ${statusLabel}</h2>
      <p style="margin: 0 0 14px 0; font-size: 14px;">
        <strong>Base :</strong> ${run.databaseName}<br/>
        <strong>Fichier :</strong> ${run.fileName}<br/>
        <strong>Mode :</strong> ${run.verificationLevel === 'level2_mysql_restore_md5' ? 'Niveau 2 (Restauration MySQL temporaire + MD5 Drive)' : 'Niveau 1 (GZIP + Structure SQL + MD5 Drive)'}<br/>
        <strong>Taille :</strong> ${formatBackupSize(run.compressedBytes)} (brut : ${formatBackupSize(run.uncompressedBytes)})<br/>
        <strong>SHA-256 :</strong> <code>${run.sha256 || '—'}</code><br/>
        <strong>Fichiers purgés (&gt; ${settings.retentionDays} j) :</strong> ${run.purgedCount}
      </p>
      ${
        run.errorMessage
          ? `<div style="padding: 12px; background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; border-radius: 6px; margin-bottom: 12px;">
              <strong>Détail de l'anomalie :</strong> ${run.errorMessage}
            </div>`
          : ''
      }
      ${
        run.driveWebViewLink
          ? `<p><a href="${run.driveWebViewLink}" style="color: #2A7B76; font-weight: bold;">Ouvrir l'archive sur Google Drive</a></p>`
          : ''
      }
    </div>
  `;

  try {
    const res = await sendConsolidatedReportEmail({
      subject,
      title: subject,
      htmlContent,
      recipientEmails: recipientEmails.length > 0 ? recipientEmails : undefined,
      plainText: `${subject}\nFichier: ${run.fileName}\nTaille: ${formatBackupSize(run.compressedBytes)}\nErreur: ${run.errorMessage || 'Aucune'}`,
    });
    return Boolean(res.success);
  } catch (err) {
    console.warn('[BackupService] Envoi alerte SMTP ignoré:', err);
    return false;
  }
}

export async function fetchCpanelSqlDumpBuffer(): Promise<{ buffer: Buffer; dbName: string }> {
  const cpanel = getCpanelBaseUrl();
  if (!cpanel) {
    throw new Error(
      'Configuration cPanel incomplète. Renseignez CPANEL_HOST, CPANEL_USERNAME, CPANEL_API_TOKEN et HEROCAB_DB_NAME.'
    );
  }

  const endpoint = `${cpanel.baseUrl}/getsqlbackup/${encodeURIComponent(cpanel.dbName)}.sql.gz`;
  const resp = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `cpanel ${cpanel.username}:${cpanel.token}`,
      Accept: 'application/gzip, application/octet-stream, */*',
    },
  });

  if (!resp.ok) {
    const snippet = (await resp.text().catch(() => '')).slice(0, 240);
    throw new Error(
      `Échec de l'export SQL cPanel (HTTP ${resp.status}) sur ${cpanel.host} : ${snippet || 'Vérifiez CPANEL_API_TOKEN et HEROCAB_DB_NAME'}`
    );
  }

  const arrayBuf = await resp.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuf),
    dbName: cpanel.dbName,
  };
}

export async function testBackupConnections(): Promise<BackupConnectionTestResult> {
  const checkedAt = new Date().toISOString();
  const cpanel = getCpanelBaseUrl();
  const driveStatus = getGoogleDriveConfigStatus();
  const gh = getGithubActionsConfig();

  // 1. Test cPanel API Token (read-only list_databases)
  let cpanelCheck: BackupConnectionTestResult['checks']['cpanel'] = {
    ok: false,
    configured: Boolean(cpanel),
    message: 'Variables cPanel manquantes (CPANEL_HOST, CPANEL_USERNAME, CPANEL_API_TOKEN, HEROCAB_DB_NAME).',
  };

  if (cpanel) {
    try {
      const resp = await fetch(`${cpanel.baseUrl}/execute/Mysql/list_databases`, {
        headers: { Authorization: `cpanel ${cpanel.username}:${cpanel.token}` },
      });
      const json: any = await resp.json().catch(() => null);
      if (resp.ok && json && json.status === 1) {
        const dbs: string[] = Array.isArray(json.data)
          ? json.data.map((d: any) => String(d.database || d.db || d))
          : [];
        const dbFound = dbs.some((d) => d.toLowerCase() === cpanel.dbName.toLowerCase());
        cpanelCheck = {
          ok: dbFound,
          configured: true,
          message: dbFound
            ? `Connexion cPanel valide — base "${cpanel.dbName}" détectée (${dbs.length} base(s) sur le compte).`
            : `Connexion cPanel OK, mais la base "${cpanel.dbName}" est introuvable parmi : ${dbs.slice(0, 6).join(', ') || 'aucune'}.`,
        };
      } else {
        cpanelCheck = {
          ok: false,
          configured: true,
          message: `Réponse cPanel invalide (HTTP ${resp.status}) : ${json?.errors?.[0] || 'Vérifiez le jeton API cPanel.'}`,
        };
      }
    } catch (err: any) {
      cpanelCheck = {
        ok: false,
        configured: true,
        message: `Impossible de joindre ${cpanel.host}:${cpanel.port} — ${err?.message || 'Erreur réseau'}`,
      };
    }
  }

  // 2. Test Google Drive access
  let driveCheck: BackupConnectionTestResult['checks']['googleDrive'] = {
    ok: false,
    configured: driveStatus.ready,
    authMode: driveStatus.authMode,
    message: 'Variables Google Drive manquantes (GOOGLE_DRIVE_BACKUP_FOLDER_ID + authentification Drive).',
  };

  if (driveStatus.ready && driveStatus.folderId) {
    try {
      const res = await verifyDriveFolderAccess(driveStatus.folderId);
      driveCheck = {
        ok: res.ok,
        configured: true,
        authMode: res.authMode,
        folderName: res.folderName,
        message: res.message,
      };
    } catch (err: any) {
      driveCheck = {
        ok: false,
        configured: true,
        authMode: driveStatus.authMode,
        message: err?.message || 'Erreur de connexion Google Drive.',
      };
    }
  }

  // 3. Test GitHub Actions Level 2 Workflow presence
  let ghCheck: BackupConnectionTestResult['checks']['githubActions'] = {
    ok: false,
    configured: Boolean(gh),
    workflowPath: `.github/workflows/${GITHUB_WORKFLOW_FILE}`,
    message: 'Variables GitHub Actions manquantes (BACKUP_GITHUB_REPO, BACKUP_GITHUB_TOKEN) pour le Niveau 2 MySQL temporaire.',
  };

  if (gh) {
    try {
      const resp = await fetch(
        `https://api.github.com/repos/${gh.repo}/actions/workflows/${GITHUB_WORKFLOW_FILE}`,
        {
          headers: {
            Authorization: `Bearer ${gh.token}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'Citrine-HeroCab-Backup',
          },
        }
      );
      const json: any = await resp.json().catch(() => ({}));
      if (resp.ok && json?.id) {
        ghCheck = {
          ok: json.state === 'active',
          configured: true,
          workflowPath: json.path,
          message:
            json.state === 'active'
              ? `Workflow Niveau 2 "${json.name}" actif sur ${gh.repo}.`
              : `Workflow trouvé sur ${gh.repo}, mais état actuel : ${json.state}.`,
        };
      } else {
        ghCheck = {
          ok: false,
          configured: true,
          workflowPath: `.github/workflows/${GITHUB_WORKFLOW_FILE}`,
          message: `Workflow introuvable ou accès refusé sur ${gh.repo} (HTTP ${resp.status}) : ${json?.message || 'Vérifiez le PAT (Actions: Read & Write) et poussez le workflow sur GitHub.'}`,
        };
      }
    } catch (err: any) {
      ghCheck = {
        ok: false,
        configured: true,
        workflowPath: `.github/workflows/${GITHUB_WORKFLOW_FILE}`,
        message: `Erreur API GitHub : ${err?.message || 'Réseau inaccessible'}`,
      };
    }
  }

  return {
    success: cpanelCheck.ok && driveCheck.ok,
    checkedAt,
    checks: {
      cpanel: cpanelCheck,
      googleDrive: driveCheck,
      githubActions: ghCheck,
    },
  };
}

/**
 * Triggers Level 2 backup (ephemeral MySQL 8 restore verification) via GitHub Actions workflow_dispatch.
 */
export async function triggerGithubLevel2Backup(options: {
  triggeredBy: string;
  triggerSource: BackupTriggerSource;
}): Promise<{ run: BackupRunRecord; dispatched: boolean }> {
  const gh = getGithubActionsConfig();
  if (!gh) {
    throw new Error(
      'GitHub Actions Niveau 2 non configuré : définissez BACKUP_GITHUB_REPO et BACKUP_GITHUB_TOKEN dans vos variables d’environnement.'
    );
  }

  const settings = await getBackupPolicySettings();
  const dbName = (process.env.HEROCAB_DB_NAME || 'herocab').trim();
  const runId = `bkp-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const startedAt = new Date().toISOString();

  const dispatchResp = await fetch(
    `https://api.github.com/repos/${gh.repo}/actions/workflows/${GITHUB_WORKFLOW_FILE}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${gh.token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Citrine-HeroCab-Backup',
      },
      body: JSON.stringify({
        ref: gh.ref,
        inputs: {
          run_id: runId,
          trigger_source: options.triggerSource,
          triggered_by: options.triggeredBy,
          retention_days: String(settings.retentionDays),
          min_keep_backups: String(settings.minKeepValidBackups),
          required_tables: settings.requiredTables.join(','),
        },
      }),
    }
  );

  if (!dispatchResp.ok) {
    const errJson: any = await dispatchResp.json().catch(() => ({}));
    throw new Error(
      `Impossible de lancer le workflow GitHub Actions Niveau 2 (HTTP ${dispatchResp.status}) : ${errJson?.message || 'Vérifiez BACKUP_GITHUB_TOKEN (permission Actions: Write) et que le fichier .github/workflows/herocab-sql-backup.yml est poussé sur la branche.'}`
    );
  }

  const runRecord: BackupRunRecord = {
    id: runId,
    databaseName: dbName,
    fileName: buildBackupFileName(dbName),
    startedAt,
    completedAt: null,
    durationMs: null,
    triggerSource: options.triggerSource,
    triggeredBy: options.triggeredBy,
    executionMode: 'github_level2',
    verificationLevel: 'level2_mysql_restore_md5',
    status: 'running',
    compressedBytes: 0,
    uncompressedBytes: 0,
    sha256: null,
    md5: null,
    driveFileId: null,
    driveWebViewLink: null,
    driveFolderId: (process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID || '').trim() || null,
    githubRunUrl: `https://github.com/${gh.repo}/actions/workflows/${GITHUB_WORKFLOW_FILE}`,
    purgedCount: 0,
    purgedFiles: [],
    integrity: null,
    errorMessage: null,
    alertEmailSent: false,
  };

  await saveBackupRunRecord(runRecord);
  return { run: runRecord, dispatched: true };
}

/**
 * Runs a direct Level 1 server-side backup (cPanel API -> GZIP/SQL integrity -> Google Drive -> MD5 check -> 45-day purge).
 * Ideal for immediate manual runs while HeroCab DB is < 30 MB compressed.
 */
export async function executeDirectServerBackup(options: {
  triggeredBy: string;
  triggerSource: BackupTriggerSource;
}): Promise<BackupRunRecord> {
  const startMs = Date.now();
  const startedAt = new Date(startMs).toISOString();
  const runId = `bkp-${startMs}-${crypto.randomBytes(3).toString('hex')}`;
  const settings = await getBackupPolicySettings();
  const driveStatus = getGoogleDriveConfigStatus();
  const dbName = (process.env.HEROCAB_DB_NAME || 'herocab').trim();
  const fileName = buildBackupFileName(dbName, new Date(startMs));

  const previousRuns = await listBackupRuns(15);
  const lastValidRun = previousRuns.find((r) => r.status === 'verified' && r.compressedBytes > 0);

  const runRecord: BackupRunRecord = {
    id: runId,
    databaseName: dbName,
    fileName,
    startedAt,
    completedAt: null,
    durationMs: null,
    triggerSource: options.triggerSource,
    triggeredBy: options.triggeredBy,
    executionMode: 'server_direct',
    verificationLevel: 'level1_gzip_sql_md5',
    status: 'running',
    compressedBytes: 0,
    uncompressedBytes: 0,
    sha256: null,
    md5: null,
    driveFileId: null,
    driveWebViewLink: null,
    driveFolderId: driveStatus.folderId,
    githubRunUrl: null,
    purgedCount: 0,
    purgedFiles: [],
    integrity: null,
    errorMessage: null,
    alertEmailSent: false,
  };

  try {
    if (!driveStatus.ready || !driveStatus.folderId) {
      throw new Error(
        'Google Drive non configuré : renseignez GOOGLE_DRIVE_BACKUP_FOLDER_ID ainsi que les variables d’authentification Google Drive.'
      );
    }

    // 1. Export SQL from cPanel via HTTPS API Token
    const { buffer: rawBuffer, dbName: resolvedDbName } = await fetchCpanelSqlDumpBuffer();
    runRecord.databaseName = resolvedDbName;

    // 2. Validate GZIP + SQL integrity
    const validation = validateSqlBackupBuffer(rawBuffer, {
      previousValidSizeBytes: lastValidRun?.compressedBytes ?? null,
      requiredTables: settings.requiredTables,
    });

    const gzipBuffer = ensureGzipBuffer(rawBuffer);
    const { sha256, md5 } = computeBufferChecksums(gzipBuffer);

    const integrity: BackupIntegritySummary = {
      ...validation.summary,
      compressedBytes: gzipBuffer.length,
      sha256,
      md5,
    };

    runRecord.compressedBytes = gzipBuffer.length;
    runRecord.uncompressedBytes = integrity.uncompressedBytes;
    runRecord.sha256 = sha256;
    runRecord.md5 = md5;
    runRecord.integrity = integrity;

    if (!validation.valid) {
      runRecord.status = 'corrupted';
      runRecord.errorMessage = integrity.errors.join(' | ');
      runRecord.completedAt = new Date().toISOString();
      runRecord.durationMs = Date.now() - startMs;
      runRecord.alertEmailSent = await sendBackupAlertEmail(runRecord, settings);
      await saveBackupRunRecord(runRecord);
      return runRecord;
    }

    // 3. Upload archive to Google Drive
    const uploaded = await uploadBackupToDrive({
      folderId: driveStatus.folderId,
      fileName,
      buffer: gzipBuffer,
      sha256,
      databaseName: resolvedDbName,
    });

    runRecord.driveFileId = uploaded.id;
    runRecord.driveWebViewLink = uploaded.webViewLink;

    // 4. Verify MD5 checksum returned by Google Drive API v3
    const driveMd5 = uploaded.md5Checksum ? uploaded.md5Checksum.toLowerCase() : null;
    const driveMd5Verified = driveMd5 ? driveMd5 === md5.toLowerCase() : null;
    integrity.driveMd5Checksum = driveMd5;
    integrity.driveMd5Verified = driveMd5Verified;

    if (driveMd5Verified === false) {
      // Delete corrupted upload immediately so Google Drive never stores a damaged archive
      await deleteDriveFile(uploaded.id).catch(() => {});
      integrity.errors.push(
        `Discordance MD5 Google Drive : local=${md5} vs Drive=${driveMd5}. Fichier distant supprimé par sécurité.`
      );
      runRecord.status = 'corrupted';
      runRecord.driveFileId = null;
      runRecord.driveWebViewLink = null;
      runRecord.errorMessage = integrity.errors.join(' | ');
      runRecord.completedAt = new Date().toISOString();
      runRecord.durationMs = Date.now() - startMs;
      runRecord.alertEmailSent = await sendBackupAlertEmail(runRecord, settings);
      await saveBackupRunRecord(runRecord);
      return runRecord;
    }

    // 5. Purge backups older than retentionDays (45 days) ONLY after verified upload
    try {
      const driveFiles = await listDriveBackupFiles(driveStatus.folderId, settings.retentionDays);
      const plan = computeRetentionPurgePlan(driveFiles, {
        retentionDays: settings.retentionDays,
        minKeepValidBackups: settings.minKeepValidBackups,
        todayBackupSucceeded: true,
      });

      const purgedNames: string[] = [];
      for (const expired of plan.toDelete) {
        await deleteDriveFile(expired.id);
        purgedNames.push(expired.name);
      }
      runRecord.purgedCount = purgedNames.length;
      runRecord.purgedFiles = purgedNames;
    } catch (purgeErr: any) {
      integrity.warnings.push(`Purge 45j partielle : ${purgeErr?.message || 'erreur Drive'}`);
    }

    runRecord.status = integrity.warnings.length > 0 ? 'warning' : 'verified';
    runRecord.completedAt = new Date().toISOString();
    runRecord.durationMs = Date.now() - startMs;
    runRecord.alertEmailSent = await sendBackupAlertEmail(runRecord, settings);
    await saveBackupRunRecord(runRecord);
    return runRecord;
  } catch (err: any) {
    runRecord.status = 'failed';
    runRecord.errorMessage = err?.message || 'Erreur inattendue lors de la sauvegarde HeroCab.';
    runRecord.completedAt = new Date().toISOString();
    runRecord.durationMs = Date.now() - startMs;
    runRecord.alertEmailSent = await sendBackupAlertEmail(runRecord, settings);
    await saveBackupRunRecord(runRecord);
    return runRecord;
  }
}

/**
 * Records a completed (or failed) Level 2 backup report sent via webhook by GitHub Actions.
 */
export async function recordExternalBackupReport(payload: Partial<BackupRunRecord>): Promise<BackupRunRecord> {
  const settings = await getBackupPolicySettings();
  const nowIso = new Date().toISOString();

  const record: BackupRunRecord = {
    id: payload.id || `bkp-gh-${Date.now()}`,
    databaseName: payload.databaseName || (process.env.HEROCAB_DB_NAME || 'herocab'),
    fileName: payload.fileName || buildBackupFileName(payload.databaseName || 'herocab'),
    startedAt: payload.startedAt || nowIso,
    completedAt: payload.completedAt || nowIso,
    durationMs: typeof payload.durationMs === 'number' ? payload.durationMs : null,
    triggerSource: payload.triggerSource || 'cron_midnight',
    triggeredBy: payload.triggeredBy || 'GitHub Actions (00h00)',
    executionMode: payload.executionMode || 'github_level2',
    verificationLevel: payload.verificationLevel || 'level2_mysql_restore_md5',
    status: payload.status || 'failed',
    compressedBytes: Number(payload.compressedBytes || 0),
    uncompressedBytes: Number(payload.uncompressedBytes || 0),
    sha256: payload.sha256 || null,
    md5: payload.md5 || null,
    driveFileId: payload.driveFileId || null,
    driveWebViewLink: payload.driveWebViewLink || null,
    driveFolderId: payload.driveFolderId || (process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID || '').trim() || null,
    githubRunUrl: payload.githubRunUrl || null,
    purgedCount: Number(payload.purgedCount || 0),
    purgedFiles: Array.isArray(payload.purgedFiles) ? payload.purgedFiles : [],
    integrity: payload.integrity || null,
    errorMessage: payload.errorMessage || null,
    alertEmailSent: false,
  };

  record.alertEmailSent = await sendBackupAlertEmail(record, settings);
  await saveBackupRunRecord(record);
  return record;
}

/**
 * Downloads an existing archive from Google Drive and runs a live anti-corruption re-verification.
 */
export async function verifyExistingDriveBackupFile(fileId: string): Promise<{
  fileId: string;
  fileName: string;
  valid: boolean;
  status: 'verified' | 'warning' | 'corrupted';
  driveMd5Match: boolean | null;
  summary: BackupIntegritySummary;
}> {
  const settings = await getBackupPolicySettings();
  const downloaded = await downloadDriveFileBuffer(fileId);
  const validation = validateSqlBackupBuffer(downloaded.buffer, {
    requiredTables: settings.requiredTables,
  });

  const driveMd5 = downloaded.md5Checksum ? downloaded.md5Checksum.toLowerCase() : null;
  const driveMd5Match = driveMd5 ? driveMd5 === validation.summary.md5.toLowerCase() : null;

  if (driveMd5Match === false) {
    validation.summary.errors.push(
      `MD5 incohérent avec Google Drive (local=${validation.summary.md5} vs Drive=${driveMd5}).`
    );
  }

  const finalValid = validation.valid && driveMd5Match !== false;
  const finalStatus: 'verified' | 'warning' | 'corrupted' = !finalValid
    ? 'corrupted'
    : validation.summary.warnings.length > 0
      ? 'warning'
      : 'verified';

  return {
    fileId,
    fileName: downloaded.name,
    valid: finalValid,
    status: finalStatus,
    driveMd5Match,
    summary: {
      ...validation.summary,
      driveMd5Checksum: driveMd5,
      driveMd5Verified: driveMd5Match,
    },
  };
}
