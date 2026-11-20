import React, { useMemo, useState } from 'react';
import { ExternalLink, Eye, Search, ShieldCheck, RefreshCw } from 'lucide-react';
import type { BackupRunRecord, DriveBackupFileItem } from '../../types/backupTypes';
import {
  formatBackupSize,
  formatDateTimeDouala,
  formatDurationMs,
  getStatusDisplay,
  getTriggerLabel,
} from '../../utils/backupFormatters';

interface BackupHistorySectionProps {
  runs: BackupRunRecord[];
  driveFiles: DriveBackupFileItem[];
  driveListError: string | null;
  googleDriveReady: boolean;
  retentionDays: number;
  loading: boolean;
  verifyingFileId: string | null;
  onSelectRun: (run: BackupRunRecord) => void;
  onVerifyDriveFile: (fileId: string) => void;
  onTriggerBackup: () => void;
  triggerBusy: boolean;
}

export const BackupHistorySection: React.FC<BackupHistorySectionProps> = ({
  runs,
  driveFiles,
  driveListError,
  googleDriveReady,
  retentionDays,
  loading,
  verifyingFileId,
  onSelectRun,
  onVerifyDriveFile,
  onTriggerBackup,
  triggerBusy,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'errors'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRuns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return runs.filter((run) => {
      if (statusFilter === 'verified' && run.status !== 'verified' && run.status !== 'warning') {
        return false;
      }
      if (statusFilter === 'errors' && run.status !== 'failed' && run.status !== 'corrupted') {
        return false;
      }
      if (!q) return true;
      return (
        run.fileName.toLowerCase().includes(q) ||
        run.databaseName.toLowerCase().includes(q) ||
        run.triggeredBy.toLowerCase().includes(q) ||
        (run.sha256 || '').toLowerCase().includes(q)
      );
    });
  }, [runs, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Execution History Table */}
      <section className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Journal des sauvegardes HeroCab</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Traçabilité complète des exports SQL, tests de restauration MySQL temporaire et purges {retentionDays} jours
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Segmented filter buttons */}
            <div className="inline-flex items-center p-0.5 bg-stone-100 rounded-lg border border-stone-200/80">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap shrink-0 cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Toutes ({runs.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('verified')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap shrink-0 cursor-pointer ${
                  statusFilter === 'verified'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Vérifiées
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('errors')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap shrink-0 cursor-pointer ${
                  statusFilter === 'errors'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Anomalies
              </button>
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer par fichier ou SHA..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#2A7B76] w-52"
              />
            </div>
          </div>
        </div>

        {loading && runs.length === 0 ? (
          <div className="p-5 space-y-3 animate-pulse">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-stone-100 rounded-lg" />
            ))}
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-stone-800">
              {runs.length === 0
                ? 'Aucune sauvegarde SQL HeroCab enregistrée pour le moment'
                : 'Aucun résultat ne correspond à ce filtre'}
            </p>
            <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
              {runs.length === 0
                ? 'Dès que vos variables cPanel et Google Drive seront renseignées, les sauvegardes automatiques de 00h00 et les exports manuels apparaîtront ici avec leur rapport d’intégrité.'
                : 'Essayez un autre mot-clé ou réinitialisez le filtre de statut.'}
            </p>
            {runs.length === 0 && (
              <button
                type="button"
                onClick={onTriggerBackup}
                disabled={triggerBusy}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-[#2A7B76] hover:bg-[#226460] disabled:opacity-60 rounded-lg transition cursor-pointer whitespace-nowrap"
              >
                Lancer la première sauvegarde
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 text-xs font-medium text-stone-500">
                  <th className="py-2.5 px-4">Date (Douala)</th>
                  <th className="py-2.5 px-4">Archive SQL</th>
                  <th className="py-2.5 px-4">Statut & Intégrité</th>
                  <th className="py-2.5 px-4 text-right">Taille</th>
                  <th className="py-2.5 px-4 text-right">Durée</th>
                  <th className="py-2.5 px-4 text-right">Purge {retentionDays}j</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {filteredRuns.map((run) => {
                  const st = getStatusDisplay(run.status);
                  const mysqlLabel =
                    run.integrity?.mysqlRestorePassed === true
                      ? `MySQL OK (${run.integrity.mysqlRestoreTablesCount ?? 0} tables)`
                      : run.integrity?.mysqlRestorePassed === false
                        ? 'MySQL échec'
                        : run.verificationLevel === 'level2_mysql_restore_md5'
                          ? 'Niveau 2'
                          : 'Niveau 1';

                  return (
                    <tr
                      key={run.id}
                      className="hover:bg-stone-50/80 transition-colors"
                    >
                      <td className="py-3 px-4 whitespace-nowrap align-top">
                        <div className="text-xs font-medium text-stone-900 tabular-nums">
                          {formatDateTimeDouala(run.startedAt)}
                        </div>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          {getTriggerLabel(run.triggerSource)} · {run.triggeredBy}
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top max-w-[280px]">
                        <div className="text-xs font-mono text-stone-900 truncate" title={run.fileName}>
                          {run.fileName}
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono mt-0.5 truncate">
                          {run.sha256 ? `SHA256 ${run.sha256.slice(0, 12)}…` : run.databaseName}
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <div className={`text-xs font-semibold ${st.textClass}`}>{st.label}</div>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          {mysqlLabel}
                          {run.integrity?.driveMd5Verified === true && ' · MD5 Drive OK'}
                          {run.integrity?.driveMd5Verified === false && ' · MD5 incohérent'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right align-top whitespace-nowrap font-mono text-xs text-stone-800 tabular-nums">
                        {run.compressedBytes > 0 ? formatBackupSize(run.compressedBytes) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right align-top whitespace-nowrap font-mono text-xs text-stone-600 tabular-nums">
                        {formatDurationMs(run.durationMs)}
                      </td>
                      <td className="py-3 px-4 text-right align-top whitespace-nowrap font-mono text-xs text-stone-600 tabular-nums">
                        {run.purgedCount > 0 ? `-${run.purgedCount}` : '0'}
                      </td>
                      <td className="py-3 px-4 text-right align-top whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectRun(run)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-stone-700 hover:text-[#2A7B76] transition cursor-pointer"
                            title="Inspecter le rapport d'intégrité complet"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Détails</span>
                          </button>
                          {run.driveWebViewLink && (
                            <a
                              href={run.driveWebViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#2A7B76] hover:underline"
                              title="Ouvrir l'archive sur Google Drive"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>Drive</span>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Google Drive Live Archives Section */}
      <section className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Archives présentes sur Google Drive</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Fichiers <span className="font-mono">herocab-backup-*.sql.gz</span> détectés dans votre dossier cible (purge automatique au-delà de {retentionDays} jours)
            </p>
          </div>
          <span className="text-xs font-mono text-stone-500 tabular-nums whitespace-nowrap shrink-0">
            {driveFiles.length} fichier{driveFiles.length > 1 ? 's' : ''}
          </span>
        </div>

        {driveListError && (
          <div className="px-5 py-3 bg-amber-50/70 border-b border-amber-200/80 text-xs text-amber-900">
            Lecture du dossier Google Drive impossible : {driveListError}
          </div>
        )}

        {!googleDriveReady ? (
          <div className="px-5 py-8 text-center text-xs text-stone-500">
            Google Drive n’est pas encore relié. Ajoutez <span className="font-mono text-stone-700">GOOGLE_DRIVE_BACKUP_FOLDER_ID</span> et vos identifiants Drive dans vos variables d’environnement, puis consultez l’onglet <strong>Pipeline & Diagnostic</strong>.
          </div>
        ) : driveFiles.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-stone-500">
            Aucune archive <span className="font-mono">herocab-backup-*.sql.gz</span> présente dans le dossier Drive configuré.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 text-xs font-medium text-stone-500">
                  <th className="py-2.5 px-4">Nom du fichier</th>
                  <th className="py-2.5 px-4">Créé le</th>
                  <th className="py-2.5 px-4 text-right">Âge</th>
                  <th className="py-2.5 px-4 text-right">Taille</th>
                  <th className="py-2.5 px-4">MD5 Google Drive</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {driveFiles.map((file) => {
                  const isVerifying = verifyingFileId === file.id;
                  return (
                    <tr key={file.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-stone-900 whitespace-nowrap">{file.name}</td>
                      <td className="py-2.5 px-4 text-stone-600 tabular-nums whitespace-nowrap">
                        {formatDateTimeDouala(file.createdTime)}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums whitespace-nowrap">
                        <span className={file.eligibleForPurge ? 'text-[#D97706] font-medium' : 'text-stone-700'}>
                          {file.ageDays} j{file.eligibleForPurge ? ' (éligible purge)' : ''}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-stone-800 tabular-nums whitespace-nowrap">
                        {formatBackupSize(file.sizeBytes)}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-stone-500 whitespace-nowrap">
                        {file.md5Checksum ? `${file.md5Checksum.slice(0, 14)}…` : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-3">
                          <button
                            type="button"
                            disabled={isVerifying}
                            onClick={() => onVerifyDriveFile(file.id)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-stone-700 hover:text-[#2A7B76] disabled:opacity-50 transition cursor-pointer"
                            title="Télécharger et re-vérifier l'intégrité GZIP, SQL et MD5"
                          >
                            {isVerifying ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ShieldCheck className="h-3.5 w-3.5" />
                            )}
                            <span>{isVerifying ? 'Vérification…' : 'Vérifier'}</span>
                          </button>
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#2A7B76] hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>Ouvrir</span>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
