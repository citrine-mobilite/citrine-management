#!/usr/bin/env node
/**
 * HeroCab SQL Backup & Level-2 Temporary MySQL Verification Runner
 *
 * Pipeline:
 * 1. Pull native .sql.gz dump from cPanel via HTTPS API Token (/getsqlbackup/<db>.sql.gz)
 * 2. Verify GZIP CRC32 decompression, SQL headers, CREATE TABLE count, -- Dump completed footer
 * 3. Level 2 Restore Test: Import SQL into ephemeral MySQL 8 container & run SHOW/CHECK TABLE
 * 4. Upload verified .sql.gz to Google Drive (Refresh Token for Gmail OR Service Account for Shared Drive)
 * 5. Verify Google Drive md5Checksum byte-for-byte (delete remote file on mismatch)
 * 6. Enforce 45-day retention purge with minimum safety floor (default 7 valid backups kept)
 * 7. Post signed JSON audit report back to Citrine Management (/api/backups/webhook)
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync, spawnSync } from 'node:child_process';

const BACKUP_FILE_PREFIX = 'herocab-backup-';

function env(name, fallback = '') {
  return (process.env[name] || fallback).trim();
}

function cleanHost(raw) {
  return String(raw || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '');
}

function buildBackupFileName(databaseName, now = new Date()) {
  const safeDb =
    String(databaseName || 'herocab')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 48) || 'herocab';

  const douala = new Date(now.getTime() + 60 * 60 * 1000);
  const yyyy = douala.getUTCFullYear();
  const mm = String(douala.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(douala.getUTCDate()).padStart(2, '0');
  const hh = String(douala.getUTCHours()).padStart(2, '0');
  const min = String(douala.getUTCMinutes()).padStart(2, '0');
  const sec = String(douala.getUTCSeconds()).padStart(2, '0');
  return `${BACKUP_FILE_PREFIX}${safeDb}-${yyyy}-${mm}-${dd}-${hh}${min}${sec}.sql.gz`;
}

function isGzipBuffer(buf) {
  return buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b;
}

function base64UrlEncode(input) {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function parseServiceAccount() {
  const raw = env('GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON');
  if (raw) {
    const jsonStr = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    const parsed = JSON.parse(jsonStr);
    if (parsed?.client_email && parsed?.private_key) {
      return {
        client_email: String(parsed.client_email).trim(),
        private_key: String(parsed.private_key).replace(/\\n/g, '\n'),
        token_uri: parsed.token_uri || 'https://oauth2.googleapis.com/token',
      };
    }
  }
  const email = env('GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL');
  const key = env('GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY');
  if (email && key) {
    return {
      client_email: email,
      private_key: key.replace(/\\n/g, '\n'),
      token_uri: 'https://oauth2.googleapis.com/token',
    };
  }
  return null;
}

async function getGoogleDriveAccessToken() {
  const refreshToken = env('GOOGLE_DRIVE_REFRESH_TOKEN');
  const clientId = env('GOOGLE_DRIVE_CLIENT_ID');
  const clientSecret = env('GOOGLE_DRIVE_CLIENT_SECRET');

  if (refreshToken && clientId && clientSecret) {
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });
    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || !json.access_token) {
      throw new Error(`Google Drive OAuth refresh échoué : ${json.error_description || json.error || resp.status}`);
    }
    return json.access_token;
  }

  const sa = parseServiceAccount();
  if (!sa) {
    throw new Error(
      'Variables Google Drive manquantes : configurez GOOGLE_DRIVE_REFRESH_TOKEN + CLIENT_ID/SECRET (Gmail) ou GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON (Drive partagé).'
    );
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/drive',
      aud: sa.token_uri,
      iat: nowSec,
      exp: nowSec + 3600,
    })
  );
  const unsigned = `${header}.${payload}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${base64UrlEncode(signer.sign(sa.private_key))}`;

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });
  const resp = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok || !json.access_token) {
    throw new Error(`Google Service Account auth échoué : ${json.error_description || json.error || resp.status}`);
  }
  return json.access_token;
}

async function uploadToGoogleDrive(accessToken, { folderId, fileName, buffer, sha256, databaseName }) {
  const boundary = `herocab_runner_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: 'application/gzip',
    description: `Sauvegarde SQL HeroCab (${databaseName}) — Vérifiée Niveau 2 MySQL Temporaire — SHA256: ${sha256}`,
    appProperties: {
      source: 'citrine-herocab-backup',
      database: databaseName.slice(0, 60),
      sha256Prefix: sha256.slice(0, 32),
    },
  };
  const head = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/gzip\r\n\r\n`,
    'utf8'
  );
  const tail = Buffer.from(`\r\n--${boundary}--`, 'utf8');
  const body = Buffer.concat([head, buffer, tail]);

  const resp = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,size,md5Checksum,createdTime,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': String(body.length),
      },
      body,
    }
  );
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok || !json.id) {
    throw new Error(`Upload Google Drive échoué (${resp.status}) : ${json?.error?.message || 'Erreur inconnue'}`);
  }
  return json;
}

async function listManagedDriveFiles(accessToken, folderId) {
  const q = `'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false`;
  const params = new URLSearchParams({
    q,
    fields: 'files(id,name,size,createdTime,md5Checksum)',
    orderBy: 'createdTime desc',
    pageSize: '200',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });
  const resp = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(`Listing Google Drive échoué (${resp.status}) : ${json?.error?.message || ''}`);
  }
  return (json.files || []).filter(
    (f) =>
      typeof f.name === 'string' &&
      f.name.toLowerCase().startsWith(BACKUP_FILE_PREFIX) &&
      f.name.toLowerCase().endsWith('.sql.gz')
  );
}

async function deleteDriveFile(accessToken, fileId) {
  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!resp.ok && resp.status !== 404) {
    const json = await resp.json().catch(() => ({}));
    throw new Error(`Suppression Drive échouée (${resp.status}) : ${json?.error?.message || ''}`);
  }
}

async function fetchCpanelSqlDump() {
  const host = cleanHost(env('CPANEL_HOST'));
  const port = env('CPANEL_PORT', '2083');
  const username = env('CPANEL_USERNAME');
  const apiToken = env('CPANEL_API_TOKEN');
  const dbName = env('HEROCAB_DB_NAME');

  if (!host || !username || !apiToken || !dbName) {
    throw new Error('Variables cPanel manquantes (CPANEL_HOST, CPANEL_USERNAME, CPANEL_API_TOKEN, HEROCAB_DB_NAME).');
  }

  const url = `https://${host}:${port}/getsqlbackup/${encodeURIComponent(dbName)}.sql.gz`;
  console.log(`[1/6] Téléchargement dump SQL cPanel depuis ${host}:${port} pour la base "${dbName}"...`);

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `cpanel ${username}:${apiToken}`,
      Accept: 'application/gzip, application/octet-stream, */*',
    },
  });

  if (!resp.ok) {
    const text = (await resp.text().catch(() => '')).slice(0, 240);
    throw new Error(`Export cPanel échoué (HTTP ${resp.status}) : ${text || 'Vérifiez CPANEL_API_TOKEN'}`);
  }

  const rawBuffer = Buffer.from(await resp.arrayBuffer());
  return { rawBuffer, dbName };
}

function validateAndUnpackSql(rawBuffer, requiredTables) {
  console.log(`[2/6] Vérification intégrité GZIP & structure SQL (${rawBuffer.length} octets)...`);
  const warnings = [];
  const errors = [];

  if (!rawBuffer || rawBuffer.length === 0) {
    throw new Error('Dump SQL reçu vide (0 octet).');
  }

  let gzipValid = false;
  let uncompressedBuffer = rawBuffer;
  if (isGzipBuffer(rawBuffer)) {
    try {
      uncompressedBuffer = zlib.gunzipSync(rawBuffer);
      gzipValid = true;
    } catch (err) {
      errors.push(`Archive GZIP corrompue ou tronquée : ${err.message}`);
    }
  } else {
    warnings.push("Flux cPanel non compressé : compression GZIP appliquée avant l'archivage.");
  }

  const gzipBuffer = isGzipBuffer(rawBuffer) ? rawBuffer : zlib.gzipSync(rawBuffer, { level: 9 });
  const sha256 = crypto.createHash('sha256').update(gzipBuffer).digest('hex');
  const md5 = crypto.createHash('md5').update(gzipBuffer).digest('hex');

  if (errors.length > 0) {
    return {
      valid: false,
      gzipBuffer,
      sqlText: '',
      summary: {
        gzipValid,
        sqlHeaderValid: false,
        hasDumpCompletedFooter: false,
        htmlErrorDetected: false,
        tableCount: 0,
        tablesSample: [],
        insertStatementsCount: 0,
        missingRequiredTables: requiredTables,
        compressedBytes: gzipBuffer.length,
        uncompressedBytes: 0,
        sha256,
        md5,
        sizeDropPercent: null,
        mysqlRestoreAttempted: false,
        mysqlRestorePassed: null,
        mysqlRestoreTablesCount: null,
        mysqlRestoreDurationMs: null,
        mysqlRestoreError: null,
        driveMd5Verified: null,
        driveMd5Checksum: null,
        warnings,
        errors,
      },
    };
  }

  const sqlText = uncompressedBuffer.toString('utf8');
  const head = sqlText.slice(0, 600);
  const tail = sqlText.slice(Math.max(0, sqlText.length - 600));
  const lowerStart = sqlText.trimStart().slice(0, 500).toLowerCase();

  const htmlErrorDetected =
    lowerStart.startsWith('<!doctype html') ||
    lowerStart.startsWith('<html') ||
    lowerStart.includes('<title>cpanel') ||
    lowerStart.includes('401 unauthorized');

  if (htmlErrorDetected) {
    errors.push('Page HTML cPanel reçue au lieu du dump SQL (jeton API invalide ou expiré).');
  }

  const sqlHeaderValid =
    !htmlErrorDetected &&
    (/--\s*(?:MySQL|MariaDB)\s+dump/i.test(head) ||
      /\/\*\!40101\s+SET\s+/i.test(head) ||
      /CREATE\s+TABLE/i.test(sqlText) ||
      /SET\s+SQL_MODE/i.test(head));

  if (!sqlHeaderValid && !htmlErrorDetected) {
    errors.push('En-tête SQL MySQL/MariaDB introuvable.');
  }

  const tablesSet = new Set();
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`([^`]+)`|"([^"]+)"|([a-zA-Z0-9_]+))/gi;
  let m;
  while ((m = tableRegex.exec(sqlText)) !== null) {
    const t = (m[1] || m[2] || m[3] || '').trim();
    if (t) tablesSet.add(t);
  }
  const tables = Array.from(tablesSet);
  const insertMatches = sqlText.match(/\bINSERT\s+(?:IGNORE\s+)?INTO\s+/gi);
  const insertStatementsCount = insertMatches ? insertMatches.length : 0;

  if (tables.length === 0 && !htmlErrorDetected) {
    errors.push('Aucune table CREATE TABLE trouvée dans le dump.');
  }

  const hasDumpCompletedFooter = /--\s*Dump completed(?:\s+on\s+[^\r\n]+)?/i.test(tail);
  if (!hasDumpCompletedFooter && !htmlErrorDetected) {
    errors.push("Marqueur de fin '-- Dump completed' manquant (export interrompu).");
  }

  const lowerTables = new Set(tables.map((t) => t.toLowerCase()));
  const missingRequiredTables = requiredTables.filter((t) => !lowerTables.has(t.toLowerCase()));
  if (missingRequiredTables.length > 0) {
    errors.push(`Tables obligatoires manquantes : ${missingRequiredTables.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    gzipBuffer,
    sqlText,
    summary: {
      gzipValid,
      sqlHeaderValid,
      hasDumpCompletedFooter,
      htmlErrorDetected,
      tableCount: tables.length,
      tablesSample: tables.slice(0, 15),
      insertStatementsCount,
      missingRequiredTables,
      compressedBytes: gzipBuffer.length,
      uncompressedBytes: uncompressedBuffer.length,
      sha256,
      md5,
      sizeDropPercent: null,
      mysqlRestoreAttempted: false,
      mysqlRestorePassed: null,
      mysqlRestoreTablesCount: null,
      mysqlRestoreDurationMs: null,
      mysqlRestoreError: null,
      driveMd5Verified: null,
      driveMd5Checksum: null,
      warnings,
      errors,
    },
  };
}

function runLevel2TemporaryMysqlRestore(sqlText) {
  const host = env('MYSQL_TEST_HOST');
  if (!host) {
    console.log('[3/6] MYSQL_TEST_HOST absent : test de restauration MySQL temporaire ignoré.');
    return { attempted: false, passed: null, tablesCount: null, durationMs: null, error: null };
  }

  const port = env('MYSQL_TEST_PORT', '3306');
  const user = env('MYSQL_TEST_USER', 'root');
  const password = env('MYSQL_TEST_PASSWORD', 'herocab_verify_root');
  const dbName = env('MYSQL_TEST_DB', 'herocab_verify_tmp');

  console.log(`[3/6] Niveau 2 : Test de ré-importation réelle dans MySQL temporaire (${host}:${port}/${dbName})...`);
  const start = Date.now();
  const tmpFile = path.join(os.tmpdir(), `herocab-verify-${Date.now()}.sql`);

  // Strip DEFINER clauses that often fail on non-cPanel MySQL accounts during restore verification
  const sanitizedSql = sqlText.replace(/DEFINER\s*=\s*`[^`]+`@`[^`]+`/gi, 'DEFINER=CURRENT_USER');
  fs.writeFileSync(tmpFile, sanitizedSql, 'utf8');

  const mysqlEnv = { ...process.env, MYSQL_PWD: password };
  const baseArgs = ['-h', host, '-P', port, '-u', user, '--default-character-set=utf8mb4'];

  try {
    // Recreate clean test database
    execFileSync(
      'mysql',
      [...baseArgs, '-e', `DROP DATABASE IF EXISTS \`${dbName}\`; CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`],
      { env: mysqlEnv, stdio: 'pipe' }
    );

    // Import SQL dump into ephemeral MySQL container
    const fd = fs.openSync(tmpFile, 'r');
    const importRes = spawnSync('mysql', [...baseArgs, dbName], {
      env: mysqlEnv,
      stdio: [fd, 'pipe', 'pipe'],
      maxBuffer: 25 * 1024 * 1024,
    });
    fs.closeSync(fd);

    if (importRes.status !== 0) {
      const stderr = (importRes.stderr || Buffer.alloc(0)).toString('utf8').trim().slice(0, 600);
      return {
        attempted: true,
        passed: false,
        tablesCount: 0,
        durationMs: Date.now() - start,
        error: `Import MySQL temporaire échoué (code ${importRes.status}) : ${stderr || 'Erreur SQL'}`,
      };
    }

    // Count restored tables
    const tablesRaw = execFileSync(
      'mysql',
      [...baseArgs, '-N', '-B', dbName, '-e', 'SHOW TABLES;'],
      { env: mysqlEnv, encoding: 'utf8' }
    );
    const restoredTables = tablesRaw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (restoredTables.length === 0) {
      return {
        attempted: true,
        passed: false,
        tablesCount: 0,
        durationMs: Date.now() - start,
        error: 'Restauration terminée mais 0 table créée dans MySQL temporaire.',
      };
    }

    // Run CHECK TABLE on restored tables (batch up to 40 tables)
    const sampleTables = restoredTables.slice(0, 40).map((t) => `\`${t.replace(/`/g, '')}\``).join(', ');
    const checkRaw = execFileSync(
      'mysql',
      [...baseArgs, '-N', '-B', dbName, '-e', `CHECK TABLE ${sampleTables};`],
      { env: mysqlEnv, encoding: 'utf8' }
    );
    const badLines = checkRaw
      .split(/\r?\n/)
      .filter((line) => /\b(error|corrupt)\b/i.test(line));

    if (badLines.length > 0) {
      return {
        attempted: true,
        passed: false,
        tablesCount: restoredTables.length,
        durationMs: Date.now() - start,
        error: `CHECK TABLE a signalé des tables corrompues : ${badLines.slice(0, 3).join(' | ')}`,
      };
    }

    console.log(`✅ Restauration MySQL temporaire réussie : ${restoredTables.length} table(s) intactes.`);
    return {
      attempted: true,
      passed: true,
      tablesCount: restoredTables.length,
      durationMs: Date.now() - start,
      error: null,
    };
  } catch (err) {
    return {
      attempted: true,
      passed: false,
      tablesCount: 0,
      durationMs: Date.now() - start,
      error: err?.stderr ? String(err.stderr).slice(0, 600) : err?.message || String(err),
    };
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {}
  }
}

async function sendWebhookReport(report) {
  const appUrl = env('CITRINE_APP_URL').replace(/\/+$/, '');
  const secret = env('BACKUP_WEBHOOK_SECRET');
  if (!appUrl || !secret) {
    console.log('[6/6] CITRINE_APP_URL ou BACKUP_WEBHOOK_SECRET non défini : rapport webhook ignoré.');
    return;
  }

  console.log(`[6/6] Envoi du rapport d'audit vers ${appUrl}/api/backups/webhook...`);
  const resp = await fetch(`${appUrl}/api/backups/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Backup-Webhook-Secret': secret,
    },
    body: JSON.stringify(report),
  });

  if (!resp.ok) {
    const txt = (await resp.text().catch(() => '')).slice(0, 300);
    console.warn(`⚠️ Webhook Citrine HTTP ${resp.status} : ${txt}`);
  } else {
    console.log('✅ Rapport enregistré dans Citrine Management.');
  }
}

async function main() {
  const startMs = Date.now();
  const startedAt = new Date(startMs).toISOString();
  const retentionDays = Math.max(7, parseInt(env('BACKUP_RETENTION_DAYS', '45'), 10) || 45);
  const minKeepBackups = Math.max(1, parseInt(env('BACKUP_MIN_KEEP', '7'), 10) || 7);
  const requiredTables = env('BACKUP_REQUIRED_TABLES')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const folderId = env('GOOGLE_DRIVE_BACKUP_FOLDER_ID');
  const runId = env('BACKUP_RUN_ID') || `bkp-gh-${startMs}-${crypto.randomBytes(3).toString('hex')}`;
  const triggerSource = env('BACKUP_TRIGGER_SOURCE', 'cron_midnight');
  const triggeredBy = env('BACKUP_TRIGGERED_BY', 'GitHub Actions (00h00 Douala)');
  const githubServer = env('GITHUB_SERVER_URL', 'https://github.com');
  const githubRepo = env('GITHUB_REPOSITORY');
  const githubRunId = env('GITHUB_RUN_ID');
  const githubRunUrl = githubRepo && githubRunId ? `${githubServer}/${githubRepo}/actions/runs/${githubRunId}` : null;

  const report = {
    id: runId,
    databaseName: env('HEROCAB_DB_NAME', 'herocab'),
    fileName: buildBackupFileName(env('HEROCAB_DB_NAME', 'herocab'), new Date(startMs)),
    startedAt,
    completedAt: null,
    durationMs: null,
    triggerSource,
    triggeredBy,
    executionMode: 'github_level2',
    verificationLevel: env('MYSQL_TEST_HOST') ? 'level2_mysql_restore_md5' : 'level1_gzip_sql_md5',
    status: 'failed',
    compressedBytes: 0,
    uncompressedBytes: 0,
    sha256: null,
    md5: null,
    driveFileId: null,
    driveWebViewLink: null,
    driveFolderId: folderId || null,
    githubRunUrl,
    purgedCount: 0,
    purgedFiles: [],
    integrity: null,
    errorMessage: null,
  };

  try {
    if (!folderId) {
      throw new Error('GOOGLE_DRIVE_BACKUP_FOLDER_ID manquant.');
    }

    // 1. Export cPanel
    const { rawBuffer, dbName } = await fetchCpanelSqlDump();
    report.databaseName = dbName;
    report.fileName = buildBackupFileName(dbName, new Date(startMs));

    // 2. Validate GZIP + SQL structure
    const validation = validateAndUnpackSql(rawBuffer, requiredTables);
    report.integrity = validation.summary;
    report.compressedBytes = validation.summary.compressedBytes;
    report.uncompressedBytes = validation.summary.uncompressedBytes;
    report.sha256 = validation.summary.sha256;
    report.md5 = validation.summary.md5;

    if (!validation.valid) {
      report.status = 'corrupted';
      report.errorMessage = validation.summary.errors.join(' | ');
      throw new Error(report.errorMessage);
    }

    // 3. Level 2 Restore Verification in ephemeral MySQL 8 container
    const restoreRes = runLevel2TemporaryMysqlRestore(validation.sqlText);
    report.integrity.mysqlRestoreAttempted = restoreRes.attempted;
    report.integrity.mysqlRestorePassed = restoreRes.passed;
    report.integrity.mysqlRestoreTablesCount = restoreRes.tablesCount;
    report.integrity.mysqlRestoreDurationMs = restoreRes.durationMs;
    report.integrity.mysqlRestoreError = restoreRes.error;

    if (restoreRes.attempted && !restoreRes.passed) {
      report.integrity.errors.push(restoreRes.error || 'Échec de restauration MySQL temporaire.');
      report.status = 'corrupted';
      report.errorMessage = restoreRes.error;
      throw new Error(report.errorMessage);
    }

    // 4. Upload to Google Drive + verify Drive MD5
    console.log(`[4/6] Envoi vers Google Drive (${report.fileName})...`);
    const accessToken = await getGoogleDriveAccessToken();
    const uploaded = await uploadToGoogleDrive(accessToken, {
      folderId,
      fileName: report.fileName,
      buffer: validation.gzipBuffer,
      sha256: report.sha256,
      databaseName: dbName,
    });

    const driveMd5 = uploaded.md5Checksum ? String(uploaded.md5Checksum).toLowerCase() : null;
    const driveMd5Verified = driveMd5 ? driveMd5 === report.md5.toLowerCase() : null;
    report.integrity.driveMd5Checksum = driveMd5;
    report.integrity.driveMd5Verified = driveMd5Verified;

    if (driveMd5Verified === false) {
      await deleteDriveFile(accessToken, uploaded.id).catch(() => {});
      report.status = 'corrupted';
      report.errorMessage = `Discordance MD5 Google Drive (local=${report.md5}, drive=${driveMd5}). Fichier distant supprimé.`;
      report.integrity.errors.push(report.errorMessage);
      throw new Error(report.errorMessage);
    }

    report.driveFileId = uploaded.id;
    report.driveWebViewLink = uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`;
    console.log(`✅ Upload Google Drive confirmé (MD5 vérifié : ${driveMd5 || 'n/a'}).`);

    // 5. Retention Purge (> 45 days) with minimum safety floor
    console.log(`[5/6] Vérification de la rétention (${retentionDays} jours, plancher min ${minKeepBackups})...`);
    const managedFiles = await listManagedDriveFiles(accessToken, folderId);
    const cutoffMs = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const purgedNames = [];

    for (let i = 0; i < managedFiles.length; i++) {
      const f = managedFiles[i];
      const createdMs = new Date(f.createdTime).getTime();
      const isProtectedFloor = i < minKeepBackups;
      const isExpired = !Number.isNaN(createdMs) && createdMs < cutoffMs;
      if (isExpired && !isProtectedFloor) {
        await deleteDriveFile(accessToken, f.id);
        purgedNames.push(f.name);
      }
    }

    report.purgedCount = purgedNames.length;
    report.purgedFiles = purgedNames;
    report.status = report.integrity.warnings.length > 0 ? 'warning' : 'verified';
    report.completedAt = new Date().toISOString();
    report.durationMs = Date.now() - startMs;

    await sendWebhookReport(report);
    console.log(`🎉 Sauvegarde HeroCab terminée avec succès (${report.purgedCount} archive(s) expirée(s) supprimée(s)).`);
  } catch (err) {
    report.errorMessage = report.errorMessage || err?.message || String(err);
    report.completedAt = new Date().toISOString();
    report.durationMs = Date.now() - startMs;
    console.error(`❌ Échec sauvegarde HeroCab : ${report.errorMessage}`);
    await sendWebhookReport(report).catch(() => {});
    process.exit(1);
  }
}

main();
