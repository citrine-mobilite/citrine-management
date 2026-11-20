import crypto from 'node:crypto';
import zlib from 'node:zlib';
import type { BackupIntegritySummary } from '../types/backupTypes';

export const BACKUP_FILE_PREFIX = 'herocab-backup-';
export const DEFAULT_RETENTION_DAYS = 45;
export const DEFAULT_MIN_KEEP_BACKUPS = 7;

export interface ValidateSqlBackupOptions {
  previousValidSizeBytes?: number | null;
  requiredTables?: string[];
  maxAllowedSizeDropPercent?: number;
}

export interface ValidateSqlBackupResult {
  valid: boolean;
  status: 'verified' | 'warning' | 'corrupted';
  summary: BackupIntegritySummary;
  sqlPreviewHead: string;
  sqlPreviewTail: string;
}

/**
 * Checks whether a buffer starts with the standard GZIP magic bytes (0x1f, 0x8b).
 */
export function isGzipBuffer(buffer: Buffer): boolean {
  return buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
}

/**
 * Computes SHA-256 and MD5 digests for a buffer.
 */
export function computeBufferChecksums(buffer: Buffer): { sha256: string; md5: string } {
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const md5 = crypto.createHash('md5').update(buffer).digest('hex');
  return { sha256, md5 };
}

/**
 * Extracts created table names from a MySQL / MariaDB SQL dump text.
 */
export function extractSqlTableNames(sqlText: string): string[] {
  const tables = new Set<string>();
  const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`([^`]+)`|"([^"]+)"|([a-zA-Z0-9_]+))/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(sqlText)) !== null) {
    const name = (match[1] || match[2] || match[3] || '').trim();
    if (name) {
      tables.add(name);
    }
  }
  return Array.from(tables);
}

/**
 * Counts INSERT INTO statements in an SQL dump.
 */
export function countSqlInsertStatements(sqlText: string): number {
  const matches = sqlText.match(/\bINSERT\s+(?:IGNORE\s+)?INTO\s+/gi);
  return matches ? matches.length : 0;
}

/**
 * Validates a `.sql.gz` (or raw `.sql`) dump buffer for corruption, truncation,
 * cPanel HTML error pages, missing tables, and abnormal size drops.
 */
export function validateSqlBackupBuffer(
  rawBuffer: Buffer,
  options: ValidateSqlBackupOptions = {}
): ValidateSqlBackupResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const requiredTables = (options.requiredTables || [])
    .map((t) => t.trim())
    .filter(Boolean);
  const maxAllowedSizeDropPercent =
    typeof options.maxAllowedSizeDropPercent === 'number'
      ? options.maxAllowedSizeDropPercent
      : 45;

  if (!rawBuffer || rawBuffer.length === 0) {
    return {
      valid: false,
      status: 'corrupted',
      sqlPreviewHead: '',
      sqlPreviewTail: '',
      summary: {
        gzipValid: false,
        sqlHeaderValid: false,
        hasDumpCompletedFooter: false,
        htmlErrorDetected: false,
        tableCount: 0,
        tablesSample: [],
        insertStatementsCount: 0,
        missingRequiredTables: requiredTables,
        compressedBytes: 0,
        uncompressedBytes: 0,
        sha256: '',
        md5: '',
        sizeDropPercent: null,
        mysqlRestoreAttempted: false,
        mysqlRestorePassed: null,
        mysqlRestoreTablesCount: null,
        mysqlRestoreDurationMs: null,
        mysqlRestoreError: null,
        driveMd5Verified: null,
        driveMd5Checksum: null,
        warnings: [],
        errors: ['Le fichier de sauvegarde est vide (0 octet).'],
      },
    };
  }

  const { sha256, md5 } = computeBufferChecksums(rawBuffer);
  const compressedBytes = rawBuffer.length;
  let gzipValid = false;
  let uncompressedBuffer: Buffer = rawBuffer;

  if (isGzipBuffer(rawBuffer)) {
    try {
      uncompressedBuffer = zlib.gunzipSync(rawBuffer);
      gzipValid = true;
    } catch (err: any) {
      errors.push(`Archive GZIP corrompue ou tronquée : ${err?.message || 'échec CRC32/décompression'}`);
      return {
        valid: false,
        status: 'corrupted',
        sqlPreviewHead: '',
        sqlPreviewTail: '',
        summary: {
          gzipValid: false,
          sqlHeaderValid: false,
          hasDumpCompletedFooter: false,
          htmlErrorDetected: false,
          tableCount: 0,
          tablesSample: [],
          insertStatementsCount: 0,
          missingRequiredTables: requiredTables,
          compressedBytes,
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
  } else {
    // Allow plain SQL buffer (e.g., before gzip compression) while flagging non-gzip input
    warnings.push("Le flux source n'était pas compressé en GZIP ; compression appliquée côté pipeline.");
    gzipValid = false;
  }

  const uncompressedBytes = uncompressedBuffer.length;
  const sqlText = uncompressedBuffer.toString('utf8');
  const sqlPreviewHead = sqlText.slice(0, 600);
  const sqlPreviewTail = sqlText.slice(Math.max(0, sqlText.length - 600));

  const trimmedStart = sqlText.trimStart().slice(0, 500).toLowerCase();
  const htmlErrorDetected =
    trimmedStart.startsWith('<!doctype html') ||
    trimmedStart.startsWith('<html') ||
    trimmedStart.includes('<title>cpanel') ||
    trimmedStart.includes('401 unauthorized') ||
    trimmedStart.includes('403 forbidden');

  if (htmlErrorDetected) {
    errors.push(
      "Réponse HTML détectée à la place d'un dump SQL (session cPanel expirée, token invalide ou nom de base incorrect)."
    );
  }

  const sqlHeaderValid =
    !htmlErrorDetected &&
    (/--\s*(?:MySQL|MariaDB)\s+dump/i.test(sqlPreviewHead) ||
      /\/\*\!40101\s+SET\s+/i.test(sqlPreviewHead) ||
      /CREATE\s+TABLE/i.test(sqlText) ||
      /SET\s+SQL_MODE/i.test(sqlPreviewHead));

  if (!sqlHeaderValid && !htmlErrorDetected) {
    errors.push("En-tête SQL MySQL/MariaDB introuvable : le fichier ne ressemble pas à un export SQL valide.");
  }

  const tables = extractSqlTableNames(sqlText);
  const tableCount = tables.length;
  const insertStatementsCount = countSqlInsertStatements(sqlText);

  if (tableCount === 0 && !htmlErrorDetected) {
    errors.push('Aucune instruction CREATE TABLE détectée dans le dump SQL.');
  }

  const hasDumpCompletedFooter = /--\s*Dump completed(?:\s+on\s+[^\r\n]+)?/i.test(sqlPreviewTail);
  if (!hasDumpCompletedFooter && !htmlErrorDetected) {
    errors.push(
      "Marqueur de fin '-- Dump completed' absent : l'export SQL semble interrompu ou tronqué avant la fin."
    );
  }

  const lowerTables = new Set(tables.map((t) => t.toLowerCase()));
  const missingRequiredTables = requiredTables.filter((reqTable) => !lowerTables.has(reqTable.toLowerCase()));
  if (missingRequiredTables.length > 0) {
    errors.push(`Tables obligatoires manquantes dans le dump : ${missingRequiredTables.join(', ')}`);
  }

  let sizeDropPercent: number | null = null;
  if (
    typeof options.previousValidSizeBytes === 'number' &&
    options.previousValidSizeBytes > 0 &&
    compressedBytes > 0
  ) {
    const drop = ((options.previousValidSizeBytes - compressedBytes) / options.previousValidSizeBytes) * 100;
    sizeDropPercent = Math.round(drop * 10) / 10;
    if (drop >= maxAllowedSizeDropPercent) {
      warnings.push(
        `Baisse brutale de taille détectée (-${sizeDropPercent}% par rapport à la sauvegarde valide précédente). Vérifiez les données HeroCab.`
      );
    }
  }

  const valid = errors.length === 0;
  const status: 'verified' | 'warning' | 'corrupted' = !valid
    ? 'corrupted'
    : warnings.length > 0
      ? 'warning'
      : 'verified';

  return {
    valid,
    status,
    sqlPreviewHead,
    sqlPreviewTail,
    summary: {
      gzipValid,
      sqlHeaderValid,
      hasDumpCompletedFooter,
      htmlErrorDetected,
      tableCount,
      tablesSample: tables.slice(0, 15),
      insertStatementsCount,
      missingRequiredTables,
      compressedBytes,
      uncompressedBytes,
      sha256,
      md5,
      sizeDropPercent,
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

/**
 * Ensures a SQL buffer is gzip-compressed; returns gzipped buffer without re-compressing if already gzipped.
 */
export function ensureGzipBuffer(rawBuffer: Buffer): Buffer {
  if (isGzipBuffer(rawBuffer)) {
    return rawBuffer;
  }
  return zlib.gzipSync(rawBuffer, { level: 9 });
}

/**
 * Sanitizes database name and builds a canonical backup archive filename.
 * Example: herocab-backup-herocab_prod-2026-11-20-000005.sql.gz
 */
export function buildBackupFileName(databaseName: string, now: Date = new Date()): string {
  const safeDb = (databaseName || 'herocab')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'herocab';

  // Format in Africa/Douala (UTC+1, no DST)
  const doualaMs = now.getTime() + 60 * 60 * 1000;
  const d = new Date(doualaMs);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  const sec = String(d.getUTCSeconds()).padStart(2, '0');

  return `${BACKUP_FILE_PREFIX}${safeDb}-${yyyy}-${mm}-${dd}-${hh}${min}${sec}.sql.gz`;
}

/**
 * Identifies whether a Google Drive filename belongs to our managed HeroCab backups.
 */
export function isManagedBackupFileName(fileName: string, prefix: string = BACKUP_FILE_PREFIX): boolean {
  if (!fileName || typeof fileName !== 'string') return false;
  const normalized = fileName.trim().toLowerCase();
  return normalized.startsWith(prefix.toLowerCase()) && normalized.endsWith('.sql.gz');
}

export interface RetentionCandidateFile {
  id: string;
  name: string;
  createdTime: string;
  sizeBytes?: number;
}

export interface RetentionPurgePlan {
  cutoffIso: string;
  toDelete: RetentionCandidateFile[];
  toKeep: RetentionCandidateFile[];
  ignoredUnmanaged: RetentionCandidateFile[];
  skippedReason: string | null;
}

/**
 * Computes which backups in Google Drive should be deleted under the 45-day retention policy.
 *
 * Guardrails:
 * 1. Never deletes anything if `todayBackupSucceeded` is false.
 * 2. Never touches unmanaged files that do not match `BACKUP_FILE_PREFIX` + `.sql.gz`.
 * 3. Always retains at least `minKeepValidBackups` (default 7) newest managed backups regardless of age.
 */
export function computeRetentionPurgePlan(
  files: RetentionCandidateFile[],
  options: {
    now?: Date;
    retentionDays?: number;
    minKeepValidBackups?: number;
    todayBackupSucceeded: boolean;
    filePrefix?: string;
  }
): RetentionPurgePlan {
  const now = options.now || new Date();
  const retentionDays = Math.max(1, Math.floor(options.retentionDays ?? DEFAULT_RETENTION_DAYS));
  const minKeepValidBackups = Math.max(1, Math.floor(options.minKeepValidBackups ?? DEFAULT_MIN_KEEP_BACKUPS));
  const filePrefix = options.filePrefix || BACKUP_FILE_PREFIX;

  const cutoffMs = now.getTime() - retentionDays * 24 * 60 * 60 * 1000;
  const cutoffIso = new Date(cutoffMs).toISOString();

  const managed: RetentionCandidateFile[] = [];
  const ignoredUnmanaged: RetentionCandidateFile[] = [];

  for (const file of files || []) {
    if (isManagedBackupFileName(file.name, filePrefix)) {
      managed.push(file);
    } else {
      ignoredUnmanaged.push(file);
    }
  }

  // Sort newest first
  const sortedManaged = [...managed].sort((a, b) => {
    const tA = new Date(a.createdTime).getTime();
    const tB = new Date(b.createdTime).getTime();
    return (Number.isNaN(tB) ? 0 : tB) - (Number.isNaN(tA) ? 0 : tA);
  });

  if (!options.todayBackupSucceeded) {
    return {
      cutoffIso,
      toDelete: [],
      toKeep: sortedManaged,
      ignoredUnmanaged,
      skippedReason: "Purge annulée par sécurité : la sauvegarde du jour n'a pas été validée.",
    };
  }

  const toKeep: RetentionCandidateFile[] = [];
  const toDelete: RetentionCandidateFile[] = [];

  sortedManaged.forEach((file, index) => {
    const createdMs = new Date(file.createdTime).getTime();
    const isProtectedFloor = index < minKeepValidBackups;
    const isExpired = !Number.isNaN(createdMs) && createdMs < cutoffMs;

    if (isExpired && !isProtectedFloor) {
      toDelete.push(file);
    } else {
      toKeep.push(file);
    }
  });

  return {
    cutoffIso,
    toDelete,
    toKeep,
    ignoredUnmanaged,
    skippedReason: null,
  };
}

/**
 * Computes the next 00:00 Africa/Douala (UTC+1, 23:00 UTC) timestamp as ISO string.
 */
export function getNextMidnightDoualaIso(now: Date = new Date()): string {
  // Africa/Douala is permanently UTC+1 (no daylight saving time)
  const offsetMs = 60 * 60 * 1000;
  const doualaNow = new Date(now.getTime() + offsetMs);
  const nextDoualaMidnightUtcMs =
    Date.UTC(
      doualaNow.getUTCFullYear(),
      doualaNow.getUTCMonth(),
      doualaNow.getUTCDate() + 1,
      0,
      0,
      0,
      0
    ) - offsetMs;
  return new Date(nextDoualaMidnightUtcMs).toISOString();
}

/**
 * Formats byte sizes in French units (o, Ko, Mo, Go).
 */
export function formatBackupSize(bytes: number | null | undefined): string {
  const n = Number(bytes || 0);
  if (!Number.isFinite(n) || n <= 0) return '0 o';
  if (n < 1024) return `${Math.round(n)} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} Mo`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}

/**
 * Formats durations in human-readable French string.
 */
export function formatDurationMs(ms: number | null | undefined): string {
  const n = Number(ms || 0);
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n < 1000) return `${Math.round(n)} ms`;
  const totalSec = Math.round(n / 1000);
  if (totalSec < 60) return `${totalSec} s`;
  const min = Math.floor(totalSec / 60);
  const remSec = totalSec % 60;
  return `${min} min ${remSec} s`;
}
