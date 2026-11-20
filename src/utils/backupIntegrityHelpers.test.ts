import test from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import {
  buildBackupFileName,
  computeRetentionPurgePlan,
  getNextMidnightDoualaIso,
  isManagedBackupFileName,
  validateSqlBackupBuffer,
} from './backupIntegrityHelpers';

const VALID_MYSQL_DUMP = `-- MySQL dump 10.13  Distrib 8.0.36, for Linux (x86_64)
-- Host: localhost    Database: herocab_prod
-- ------------------------------------------------------
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
CREATE TABLE \`drivers\` (
  \`id\` bigint NOT NULL AUTO_INCREMENT,
  \`full_name\` varchar(120) NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO \`drivers\` VALUES (1,'Jean Mballa'),(2,'Amina Oumarou');
CREATE TABLE \`rides\` (
  \`id\` bigint NOT NULL AUTO_INCREMENT,
  \`driver_id\` bigint NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO \`rides\` VALUES (101,1),(102,2);
-- Dump completed on 2026-11-20  0:00:04
`;

test('validateSqlBackupBuffer validates a clean gzipped MySQL dump', () => {
  const gz = zlib.gzipSync(Buffer.from(VALID_MYSQL_DUMP, 'utf8'));
  const result = validateSqlBackupBuffer(gz, { requiredTables: ['drivers', 'rides'] });

  assert.equal(result.valid, true);
  assert.equal(result.status, 'verified');
  assert.equal(result.summary.gzipValid, true);
  assert.equal(result.summary.sqlHeaderValid, true);
  assert.equal(result.summary.hasDumpCompletedFooter, true);
  assert.equal(result.summary.htmlErrorDetected, false);
  assert.equal(result.summary.tableCount, 2);
  assert.equal(result.summary.insertStatementsCount, 2);
  assert.deepEqual(result.summary.missingRequiredTables, []);
  assert.equal(result.summary.sha256.length, 64);
  assert.equal(result.summary.md5.length, 32);
});

test('validateSqlBackupBuffer rejects corrupted/truncated GZIP archives', () => {
  const gz = zlib.gzipSync(Buffer.from(VALID_MYSQL_DUMP, 'utf8'));
  const truncated = gz.subarray(0, Math.floor(gz.length / 2));
  const result = validateSqlBackupBuffer(truncated);

  assert.equal(result.valid, false);
  assert.equal(result.status, 'corrupted');
  assert.equal(result.summary.gzipValid, false);
  assert.ok(result.summary.errors.some((e) => e.toLowerCase().includes('corrompue')));
});

test('validateSqlBackupBuffer rejects cPanel HTML error pages disguised as backups', () => {
  const html = '<!DOCTYPE html><html><head><title>cPanel Login</title></head><body>401 Unauthorized</body></html>';
  const gz = zlib.gzipSync(Buffer.from(html, 'utf8'));
  const result = validateSqlBackupBuffer(gz);

  assert.equal(result.valid, false);
  assert.equal(result.status, 'corrupted');
  assert.equal(result.summary.htmlErrorDetected, true);
});

test('validateSqlBackupBuffer rejects SQL dumps missing the -- Dump completed footer', () => {
  const incompleteSql = VALID_MYSQL_DUMP.replace(/-- Dump completed[\s\S]*$/i, '');
  const gz = zlib.gzipSync(Buffer.from(incompleteSql, 'utf8'));
  const result = validateSqlBackupBuffer(gz);

  assert.equal(result.valid, false);
  assert.equal(result.status, 'corrupted');
  assert.equal(result.summary.hasDumpCompletedFooter, false);
});

test('validateSqlBackupBuffer flags warning on brutal size drop (>= 45%)', () => {
  const gz = zlib.gzipSync(Buffer.from(VALID_MYSQL_DUMP, 'utf8'));
  const result = validateSqlBackupBuffer(gz, {
    previousValidSizeBytes: gz.length * 3,
  });

  assert.equal(result.valid, true);
  assert.equal(result.status, 'warning');
  assert.ok(result.summary.sizeDropPercent !== null && result.summary.sizeDropPercent >= 60);
  assert.ok(result.summary.warnings.length > 0);
});

test('computeRetentionPurgePlan deletes only managed files older than 45 days while enforcing minimum floor', () => {
  const now = new Date('2026-11-20T00:05:00.000Z');
  const makeDate = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400_000).toISOString();

  const files = [
    // 8 recent backups within 45 days
    ...[0, 1, 5, 10, 20, 30, 40, 44].map((d, idx) => ({
      id: `recent-${idx}`,
      name: `herocab-backup-herocab-recent-${d}.sql.gz`,
      createdTime: makeDate(d),
    })),
    // 2 expired managed backups (> 45 days)
    { id: 'old-1', name: 'herocab-backup-herocab-old-46.sql.gz', createdTime: makeDate(46) },
    { id: 'old-2', name: 'herocab-backup-herocab-old-60.sql.gz', createdTime: makeDate(60) },
    // 1 unrelated file in the same Drive folder (must NEVER be deleted)
    { id: 'other-1', name: 'Contrat-HeroCab-2024.pdf', createdTime: makeDate(300) },
  ];

  const plan = computeRetentionPurgePlan(files, {
    now,
    retentionDays: 45,
    minKeepValidBackups: 7,
    todayBackupSucceeded: true,
  });

  assert.equal(plan.skippedReason, null);
  assert.deepEqual(
    plan.toDelete.map((f) => f.id).sort(),
    ['old-1', 'old-2']
  );
  assert.equal(plan.toKeep.length, 8);
  assert.equal(plan.ignoredUnmanaged.length, 1);
  assert.equal(plan.ignoredUnmanaged[0].id, 'other-1');
});

test('computeRetentionPurgePlan aborts purge completely when today backup failed', () => {
  const now = new Date('2026-11-20T00:05:00.000Z');
  const files = Array.from({ length: 12 }, (_, idx) => ({
    id: `f-${idx}`,
    name: `herocab-backup-herocab-${idx}.sql.gz`,
    createdTime: new Date(now.getTime() - (idx * 10 + 1) * 86400_000).toISOString(),
  }));

  const plan = computeRetentionPurgePlan(files, {
    now,
    retentionDays: 45,
    minKeepValidBackups: 7,
    todayBackupSucceeded: false,
  });

  assert.equal(plan.toDelete.length, 0);
  assert.equal(plan.toKeep.length, 12);
  assert.ok(plan.skippedReason && plan.skippedReason.includes('sécurité'));
});

test('computeRetentionPurgePlan preserves minimum floor even when all backups are > 45 days old', () => {
  const now = new Date('2026-11-20T00:05:00.000Z');
  const files = Array.from({ length: 9 }, (_, idx) => ({
    id: `old-${idx}`,
    name: `herocab-backup-herocab-${idx}.sql.gz`,
    createdTime: new Date(now.getTime() - (50 + idx) * 86400_000).toISOString(),
  }));

  const plan = computeRetentionPurgePlan(files, {
    now,
    retentionDays: 45,
    minKeepValidBackups: 7,
    todayBackupSucceeded: true,
  });

  assert.equal(plan.toKeep.length, 7);
  assert.equal(plan.toDelete.length, 2);
});

test('buildBackupFileName and getNextMidnightDoualaIso format Africa/Douala schedule accurately', () => {
  // 2026-11-20T22:30:00Z = 2026-11-20 23:30:00 Africa/Douala (UTC+1)
  const now = new Date('2026-11-20T22:30:00.000Z');
  const fileName = buildBackupFileName('HeroCab_Prod!', now);
  assert.equal(fileName, 'herocab-backup-herocab_prod-2026-11-20-233000.sql.gz');
  assert.equal(isManagedBackupFileName(fileName), true);

  // Next midnight Africa/Douala is 2026-11-21 00:00:00 UTC+1 = 2026-11-20T23:00:00.000Z
  assert.equal(getNextMidnightDoualaIso(now), '2026-11-20T23:00:00.000Z');
});
