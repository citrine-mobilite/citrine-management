export type BackupExecutionMode = 'github_level2' | 'server_direct';

export type BackupTriggerSource = 'cron_midnight' | 'manual_ui' | 'api_cron' | 'github_workflow';

export type BackupRunStatus = 'running' | 'verified' | 'warning' | 'corrupted' | 'failed';

export type BackupVerificationLevel = 'level1_gzip_sql_md5' | 'level2_mysql_restore_md5';

export interface BackupIntegritySummary {
  gzipValid: boolean;
  sqlHeaderValid: boolean;
  hasDumpCompletedFooter: boolean;
  htmlErrorDetected: boolean;
  tableCount: number;
  tablesSample: string[];
  insertStatementsCount: number;
  missingRequiredTables: string[];
  compressedBytes: number;
  uncompressedBytes: number;
  sha256: string;
  md5: string;
  sizeDropPercent: number | null;
  mysqlRestoreAttempted: boolean;
  mysqlRestorePassed: boolean | null;
  mysqlRestoreTablesCount: number | null;
  mysqlRestoreDurationMs: number | null;
  mysqlRestoreError: string | null;
  driveMd5Verified: boolean | null;
  driveMd5Checksum: string | null;
  warnings: string[];
  errors: string[];
}

export interface BackupRunRecord {
  id: string;
  databaseName: string;
  fileName: string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  triggerSource: BackupTriggerSource;
  triggeredBy: string;
  executionMode: BackupExecutionMode;
  verificationLevel: BackupVerificationLevel;
  status: BackupRunStatus;
  compressedBytes: number;
  uncompressedBytes: number;
  sha256: string | null;
  md5: string | null;
  driveFileId: string | null;
  driveWebViewLink: string | null;
  driveFolderId: string | null;
  githubRunUrl: string | null;
  purgedCount: number;
  purgedFiles: string[];
  integrity: BackupIntegritySummary | null;
  errorMessage: string | null;
  alertEmailSent: boolean;
}

export interface DriveBackupFileItem {
  id: string;
  name: string;
  sizeBytes: number;
  createdTime: string;
  md5Checksum: string | null;
  webViewLink: string | null;
  ageDays: number;
  eligibleForPurge: boolean;
}

export interface BackupPolicySettings {
  id?: string;
  databaseLabel: string;
  retentionDays: number;
  minKeepValidBackups: number;
  preferredMode: BackupExecutionMode;
  scheduleTimezone: string;
  scheduleTimeLabel: string;
  requiredTables: string[];
  alertOnFailure: boolean;
  alertOnSuccess: boolean;
  alertEmails: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface EnvVarDiagnosticItem {
  key: string;
  group: 'cpanel' | 'google_drive' | 'github_actions' | 'security';
  requiredFor: string;
  configured: boolean;
  optional?: boolean;
  hint: string;
}

export interface BackupEnvironmentStatus {
  cpanelReady: boolean;
  cpanelHostConfigured: string | null;
  databaseNameConfigured: string | null;
  googleDriveReady: boolean;
  googleDriveAuthMode: 'service_account' | 'oauth_refresh_token' | 'unconfigured';
  googleDriveFolderConfigured: boolean;
  githubLevel2Ready: boolean;
  githubRepoConfigured: string | null;
  webhookSecretConfigured: boolean;
  cronSecretConfigured: boolean;
  smtpReady: boolean;
  nextMidnightDoualaIso: string;
  variables: EnvVarDiagnosticItem[];
}

export interface BackupStatusApiResponse {
  success: boolean;
  environment: BackupEnvironmentStatus;
  settings: BackupPolicySettings;
  runs: BackupRunRecord[];
  driveFiles: DriveBackupFileItem[];
  driveListError: string | null;
  error?: string;
}

export interface BackupConnectionTestResult {
  success: boolean;
  checkedAt: string;
  checks: {
    cpanel: { ok: boolean; configured: boolean; message: string };
    googleDrive: { ok: boolean; configured: boolean; authMode: string; folderName?: string; message: string };
    githubActions: { ok: boolean; configured: boolean; workflowPath?: string; message: string };
  };
}

export const DEFAULT_BACKUP_POLICY_SETTINGS: BackupPolicySettings = {
  id: 'herocab_backup_policy',
  databaseLabel: 'Base SQL HeroCab (cPanel)',
  retentionDays: 45,
  minKeepValidBackups: 7,
  preferredMode: 'github_level2',
  scheduleTimezone: 'Africa/Douala',
  scheduleTimeLabel: '00:00 (UTC+1)',
  requiredTables: [],
  alertOnFailure: true,
  alertOnSuccess: false,
  alertEmails: '',
};
