import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import type { BackupRunRecord } from '../../types/backupTypes';
import {
  formatBackupSize,
  formatDateTimeDouala,
  formatDurationMs,
  getStatusDisplay,
  getTriggerLabel,
} from '../../utils/backupFormatters';

interface BackupRunDetailModalProps {
  run: BackupRunRecord | null;
  onClose: () => void;
}

export const BackupRunDetailModal: React.FC<BackupRunDetailModalProps> = ({ run, onClose }) => {
  if (!run) return null;

  const st = getStatusDisplay(run.status);
  const integrity = run.integrity;

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/45 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-detail-title"
      onClick={onClose}
    >
      <div
        className="bg-white border border-stone-200 rounded-xl w-full max-w-2xl max-h-[88vh] overflow-y-auto shadow-xl divide-y divide-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 id="backup-detail-title" className="text-base font-semibold text-stone-900 truncate">
              Rapport d’intégrité · {run.fileName}
            </h3>
            <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5 flex-wrap">
              <span className={`font-semibold ${st.textClass}`}>{st.label}</span>
              <span aria-hidden="true">·</span>
              <span>{getTriggerLabel(run.triggerSource)}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{formatDateTimeDouala(run.startedAt)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer shrink-0"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Core Metadata */}
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-stone-500 block">Base SQL</span>
            <span className="font-mono font-medium text-stone-900 mt-0.5 block">{run.databaseName}</span>
          </div>
          <div>
            <span className="text-stone-500 block">Archive (.sql.gz)</span>
            <span className="font-mono font-medium text-stone-900 tabular-nums mt-0.5 block">
              {formatBackupSize(run.compressedBytes)}
            </span>
          </div>
          <div>
            <span className="text-stone-500 block">SQL brut</span>
            <span className="font-mono font-medium text-stone-900 tabular-nums mt-0.5 block">
              {formatBackupSize(run.uncompressedBytes)}
            </span>
          </div>
          <div>
            <span className="text-stone-500 block">Durée</span>
            <span className="font-mono font-medium text-stone-900 tabular-nums mt-0.5 block">
              {formatDurationMs(run.durationMs)}
            </span>
          </div>
        </div>

        {/* Error / Warnings */}
        {(run.errorMessage || (integrity?.errors?.length ?? 0) > 0) && (
          <div className="p-5 bg-red-50/70 space-y-1.5 text-xs text-[#DC2626]">
            <div className="font-semibold">Anomalie détectée</div>
            <p className="leading-relaxed">
              {run.errorMessage || integrity?.errors.join(' | ')}
            </p>
          </div>
        )}

        {integrity && integrity.warnings.length > 0 && (
          <div className="p-5 bg-amber-50/70 space-y-1.5 text-xs text-[#D97706]">
            <div className="font-semibold">Avertissements</div>
            <ul className="list-disc pl-4 space-y-1 text-amber-900">
              {integrity.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Integrity Checklist */}
        {integrity && (
          <div className="p-5 space-y-3">
            <h4 className="text-xs font-semibold text-stone-900">Contrôles anti-corruption exécutés</h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-stone-100">
                <dt className="text-stone-500">Décompression GZIP (CRC32)</dt>
                <dd className={`font-medium ${integrity.gzipValid ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                  {integrity.gzipValid ? 'Valide' : 'Non compressé / Échec'}
                </dd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-stone-100">
                <dt className="text-stone-500">Marqueur -- Dump completed</dt>
                <dd className={`font-medium ${integrity.hasDumpCompletedFooter ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                  {integrity.hasDumpCompletedFooter ? 'Présent' : 'Absent'}
                </dd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-stone-100">
                <dt className="text-stone-500">Tables SQL détectées</dt>
                <dd className="font-mono font-medium text-stone-900 tabular-nums">
                  {integrity.tableCount} ({integrity.insertStatementsCount} INSERT)
                </dd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-stone-100">
                <dt className="text-stone-500">MySQL 8 temporaire (Niveau 2)</dt>
                <dd
                  className={`font-medium ${
                    integrity.mysqlRestorePassed === true
                      ? 'text-[#16A34A]'
                      : integrity.mysqlRestorePassed === false
                        ? 'text-[#DC2626]'
                        : 'text-stone-500'
                  }`}
                >
                  {integrity.mysqlRestorePassed === true
                    ? `Réussi (${integrity.mysqlRestoreTablesCount ?? 0} tables · ${formatDurationMs(integrity.mysqlRestoreDurationMs)})`
                    : integrity.mysqlRestorePassed === false
                      ? 'Échec restauration'
                      : 'Non exécuté (Niveau 1)'}
                </dd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-stone-100">
                <dt className="text-stone-500">Vérification MD5 Google Drive</dt>
                <dd
                  className={`font-medium ${
                    integrity.driveMd5Verified === true
                      ? 'text-[#16A34A]'
                      : integrity.driveMd5Verified === false
                        ? 'text-[#DC2626]'
                        : 'text-stone-500'
                  }`}
                >
                  {integrity.driveMd5Verified === true
                    ? 'Identique octet par octet'
                    : integrity.driveMd5Verified === false
                      ? 'Discordance détectée'
                      : 'En attente'}
                </dd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-stone-100">
                <dt className="text-stone-500">Alerte e-mail SMTP</dt>
                <dd className="font-medium text-stone-700">
                  {run.alertEmailSent ? 'Envoyée' : 'Non requise'}
                </dd>
              </div>
            </dl>

            {/* Cryptographic digests */}
            <div className="pt-2 space-y-1.5 text-[11px] font-mono text-stone-600 break-all">
              <div>
                <span className="text-stone-400">SHA-256 : </span>
                {run.sha256 || '—'}
              </div>
              <div>
                <span className="text-stone-400">MD5 local : </span>
                {run.md5 || '—'}
              </div>
              {integrity.driveMd5Checksum && (
                <div>
                  <span className="text-stone-400">MD5 Drive : </span>
                  {integrity.driveMd5Checksum}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Purged files */}
        {run.purgedFiles && run.purgedFiles.length > 0 && (
          <div className="p-5 space-y-2 text-xs">
            <h4 className="font-semibold text-stone-900">
              Archives expirées supprimées ({run.purgedFiles.length})
            </h4>
            <ul className="space-y-1 font-mono text-[11px] text-stone-600">
              {run.purgedFiles.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer links */}
        <div className="px-5 py-3.5 bg-stone-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs">
            {run.driveWebViewLink && (
              <a
                href={run.driveWebViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-[#2A7B76] hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Ouvrir sur Google Drive</span>
              </a>
            )}
            {run.githubRunUrl && (
              <a
                href={run.githubRunUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-stone-700 hover:text-stone-900 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Journal GitHub Actions</span>
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-100 rounded-lg transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
