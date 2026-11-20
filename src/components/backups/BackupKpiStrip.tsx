import React from 'react';
import type {
  BackupEnvironmentStatus,
  BackupPolicySettings,
  BackupRunRecord,
  DriveBackupFileItem,
} from '../../types/backupTypes';
import {
  formatBackupSize,
  formatDateTimeDouala,
  formatShortTimeUntil,
  getStatusDisplay,
} from '../../utils/backupFormatters';

interface BackupKpiStripProps {
  runs: BackupRunRecord[];
  driveFiles: DriveBackupFileItem[];
  environment: BackupEnvironmentStatus | null;
  settings: BackupPolicySettings;
  loading: boolean;
}

export const BackupKpiStrip: React.FC<BackupKpiStripProps> = ({
  runs,
  driveFiles,
  environment,
  settings,
  loading,
}) => {
  const latestRun = runs[0] || null;
  const completedRuns = runs.filter((r) => r.status !== 'running');
  const verifiedRunsCount = completedRuns.filter(
    (r) => r.status === 'verified' || r.status === 'warning'
  ).length;
  const totalDriveBytes = driveFiles.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);
  const expiredPendingCount = driveFiles.filter((f) => f.eligibleForPurge).length;

  const latestStatus = latestRun ? getStatusDisplay(latestRun.status) : null;
  const level2Passed = latestRun?.integrity?.mysqlRestorePassed;

  if (loading && !environment) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="p-5 space-y-2.5 animate-pulse">
            <div className="h-3.5 w-28 bg-stone-200 rounded" />
            <div className="h-6 w-36 bg-stone-200 rounded" />
            <div className="h-3 w-44 bg-stone-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <section
      aria-label="Synthèse des sauvegardes HeroCab"
      className="bg-white border border-stone-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200"
    >
      {/* 1. Dernière sauvegarde */}
      <div className="p-5 flex flex-col justify-between gap-2">
        <span className="text-xs font-medium text-stone-500">Dernière sauvegarde</span>
        <div>
          <p className="text-lg font-semibold text-stone-900 tabular-nums leading-snug">
            {latestRun ? formatDateTimeDouala(latestRun.startedAt) : 'Aucune exécution'}
          </p>
          <p className="mt-1 text-xs text-stone-500 flex items-center gap-1.5 flex-wrap">
            {latestRun && latestStatus ? (
              <>
                <span className={`font-semibold ${latestStatus.textClass}`}>{latestStatus.label}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{formatBackupSize(latestRun.compressedBytes)}</span>
              </>
            ) : (
              <span>En attente du premier export SQL HeroCab</span>
            )}
          </p>
        </div>
      </div>

      {/* 2. Intégrité MySQL & MD5 */}
      <div className="p-5 flex flex-col justify-between gap-2">
        <span className="text-xs font-medium text-stone-500">Contrôle anti-corruption</span>
        <div>
          <p className="text-lg font-semibold text-stone-900 tabular-nums leading-snug">
            {completedRuns.length > 0
              ? `${verifiedRunsCount} / ${completedRuns.length} valides`
              : environment?.githubLevel2Ready
                ? 'Niveau 2 prêt'
                : 'Niveau 2 en attente'}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {level2Passed === true ? (
              <span className="text-[#16A34A] font-medium">
                Restauration MySQL temporaire validée ({latestRun?.integrity?.mysqlRestoreTablesCount ?? 0} tables)
              </span>
            ) : level2Passed === false ? (
              <span className="text-[#DC2626] font-medium">Dernière restauration MySQL en échec</span>
            ) : (
              <span>GZIP CRC32 · MySQL 8 temporaire · MD5 Drive</span>
            )}
          </p>
        </div>
      </div>

      {/* 3. Archives Google Drive */}
      <div className="p-5 flex flex-col justify-between gap-2">
        <span className="text-xs font-medium text-stone-500">Archives Google Drive</span>
        <div>
          <p className="text-lg font-semibold text-stone-900 tabular-nums leading-snug">
            {environment?.googleDriveReady ? (
              <>
                {driveFiles.length} archive{driveFiles.length > 1 ? 's' : ''}
              </>
            ) : (
              'Drive non configuré'
            )}
          </p>
          <p className="mt-1 text-xs text-stone-500 tabular-nums">
            {environment?.googleDriveReady ? (
              <>
                <span>{formatBackupSize(totalDriveBytes)} utilisés</span>
                <span aria-hidden="true"> · </span>
                <span>
                  {expiredPendingCount > 0
                    ? `${expiredPendingCount} > ${settings.retentionDays} j`
                    : `Rétention ${settings.retentionDays} j active`}
                </span>
              </>
            ) : (
              <span>Ajoutez les variables Google Drive pour lister les fichiers</span>
            )}
          </p>
        </div>
      </div>

      {/* 4. Prochaine sauvegarde automatique */}
      <div className="p-5 flex flex-col justify-between gap-2">
        <span className="text-xs font-medium text-stone-500">Planification automatique</span>
        <div>
          <p className="text-lg font-semibold text-stone-900 tabular-nums leading-snug">
            00:00 · Douala
          </p>
          <p className="mt-1 text-xs text-stone-500 tabular-nums">
            <span>{formatShortTimeUntil(environment?.nextMidnightDoualaIso)}</span>
            <span aria-hidden="true"> · </span>
            <span>Purge &gt; {settings.retentionDays} j (min {settings.minKeepValidBackups})</span>
          </p>
        </div>
      </div>
    </section>
  );
};
