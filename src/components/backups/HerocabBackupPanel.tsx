import React, { useCallback, useEffect, useState } from 'react';
import { Play, RefreshCw, ShieldAlert } from 'lucide-react';
import type { AppUser } from '../../types';
import {
  DEFAULT_BACKUP_POLICY_SETTINGS,
  type BackupConnectionTestResult,
  type BackupEnvironmentStatus,
  type BackupExecutionMode,
  type BackupPolicySettings,
  type BackupRunRecord,
  type BackupStatusApiResponse,
  type DriveBackupFileItem,
} from '../../types/backupTypes';
import { parseApiJsonResponse } from '../../utils/safeJsonResponse';
import { BackupKpiStrip } from './BackupKpiStrip';
import { BackupHistorySection } from './BackupHistorySection';
import { BackupPipelineDiagnostics } from './BackupPipelineDiagnostics';
import { BackupPolicyForm } from './BackupPolicyForm';
import { BackupRunDetailModal } from './BackupRunDetailModal';

interface HerocabBackupPanelProps {
  currentUser: AppUser | null;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

type BackupSubTab = 'history' | 'diagnostics' | 'policy';

export const HerocabBackupPanel: React.FC<HerocabBackupPanelProps> = ({
  currentUser,
  showToast,
}) => {
  const [subTab, setSubTab] = useState<BackupSubTab>('history');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [environment, setEnvironment] = useState<BackupEnvironmentStatus | null>(null);
  const [settings, setSettings] = useState<BackupPolicySettings>(DEFAULT_BACKUP_POLICY_SETTINGS);
  const [runs, setRuns] = useState<BackupRunRecord[]>([]);
  const [driveFiles, setDriveFiles] = useState<DriveBackupFileItem[]>([]);
  const [driveListError, setDriveListError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [triggerMode, setTriggerMode] = useState<BackupExecutionMode>('github_level2');
  const [triggerBusy, setTriggerBusy] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [testingConnections, setTestingConnections] = useState(false);
  const [connectionResult, setConnectionResult] = useState<BackupConnectionTestResult | null>(null);
  const [verifyingFileId, setVerifyingFileId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<BackupRunRecord | null>(null);
  const [inlineFeedback, setInlineFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const authHeaders = useCallback((): Record<string, string> => {
    const h: Record<string, string> = {};
    if (currentUser?.role) h['X-Citrine-User-Role'] = currentUser.role;
    if (currentUser?.email) h['X-Citrine-User-Email'] = currentUser.email;
    return h;
  }, [currentUser?.role, currentUser?.email]);

  const loadBackupStatus = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);

    try {
      const res = await fetch('/api/backups/status', {
        cache: 'no-store',
        headers: authHeaders(),
      });
      const parsed = await parseApiJsonResponse<BackupStatusApiResponse>(res);
      if (!parsed.ok || !parsed.data?.success) {
        throw new Error(parsed.errorMessage || parsed.data?.error || 'Impossible de charger le module Sauvegarde.');
      }

      setEnvironment(parsed.data.environment);
      setSettings(parsed.data.settings || DEFAULT_BACKUP_POLICY_SETTINGS);
      setTriggerMode(parsed.data.settings?.preferredMode || 'github_level2');
      setRuns(parsed.data.runs || []);
      setDriveFiles(parsed.data.driveFiles || []);
      setDriveListError(parsed.data.driveListError || null);
    } catch (err: any) {
      setLoadError(err?.message || 'Erreur de communication avec le serveur de sauvegarde.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    loadBackupStatus(false);
  }, [loadBackupStatus]);

  const handleTriggerBackup = async () => {
    setTriggerBusy(true);
    setInlineFeedback(null);
    try {
      const res = await fetch('/api/backups/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          mode: triggerMode,
          triggeredBy: currentUser?.name || currentUser?.email || 'Administrateur',
        }),
      });
      const parsed = await parseApiJsonResponse<any>(res);
      if (!parsed.ok || !parsed.data?.success) {
        const msg = parsed.data?.error || parsed.errorMessage || 'Échec du déclenchement de la sauvegarde.';
        setInlineFeedback({ type: 'error', message: msg });
        showToast?.(msg, 'error');
        if (parsed.data?.run) {
          await loadBackupStatus(true);
        }
        return;
      }

      const okMsg = parsed.data.message || 'Sauvegarde HeroCab déclenchée avec succès.';
      setInlineFeedback({ type: 'success', message: okMsg });
      showToast?.(okMsg, 'success');
      await loadBackupStatus(true);
    } catch (err: any) {
      const msg = err?.message || 'Erreur réseau lors du lancement de la sauvegarde.';
      setInlineFeedback({ type: 'error', message: msg });
      showToast?.(msg, 'error');
    } finally {
      setTriggerBusy(false);
    }
  };

  const handleTestConnections = async () => {
    setTestingConnections(true);
    setInlineFeedback(null);
    try {
      const res = await fetch('/api/backups/test-connections', {
        method: 'POST',
        headers: authHeaders(),
      });
      const parsed = await parseApiJsonResponse<BackupConnectionTestResult>(res);
      if (!parsed.ok || !parsed.data) {
        throw new Error(parsed.errorMessage || 'Impossible d’exécuter le test de connectivité.');
      }
      setConnectionResult(parsed.data);
      const summary = parsed.data.success
        ? 'Connexions cPanel et Google Drive opérationnelles.'
        : 'Certaines connexions requièrent encore des variables d’environnement.';
      showToast?.(summary, parsed.data.success ? 'success' : 'error');
    } catch (err: any) {
      showToast?.(err?.message || 'Échec du test de connectivité.', 'error');
    } finally {
      setTestingConnections(false);
    }
  };

  const handleVerifyDriveFile = async (fileId: string) => {
    setVerifyingFileId(fileId);
    setInlineFeedback(null);
    try {
      const res = await fetch('/api/backups/verify-drive-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ fileId }),
      });
      const parsed = await parseApiJsonResponse<any>(res);
      if (!parsed.ok || !parsed.data?.success) {
        throw new Error(parsed.data?.error || parsed.errorMessage || 'Échec de vérification de l’archive Drive.');
      }
      const v = parsed.data.verification;
      const msg = v.valid
        ? `Archive ${v.fileName} intacte : GZIP CRC32 OK, ${v.summary.tableCount} tables SQL, marqueur de fin présent${v.driveMd5Match ? ' et MD5 Drive identique' : ''}.`
        : `Corruption détectée sur ${v.fileName} : ${(v.summary.errors || []).join(' | ')}`;
      setInlineFeedback({ type: v.valid ? 'success' : 'error', message: msg });
      showToast?.(msg, v.valid ? 'success' : 'error');
    } catch (err: any) {
      const msg = err?.message || 'Erreur lors de la re-vérification Drive.';
      setInlineFeedback({ type: 'error', message: msg });
      showToast?.(msg, 'error');
    } finally {
      setVerifyingFileId(null);
    }
  };

  const handleSavePolicy = async (patch: Partial<BackupPolicySettings>) => {
    setSavingPolicy(true);
    setInlineFeedback(null);
    try {
      const res = await fetch('/api/backups/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(patch),
      });
      const parsed = await parseApiJsonResponse<any>(res);
      if (!parsed.ok || !parsed.data?.success) {
        throw new Error(parsed.data?.error || parsed.errorMessage || 'Échec de sauvegarde de la politique.');
      }
      setSettings(parsed.data.settings);
      setTriggerMode(parsed.data.settings.preferredMode || 'github_level2');
      const msg = 'Politique de sauvegarde et de rétention enregistrée.';
      setInlineFeedback({ type: 'success', message: msg });
      showToast?.(msg, 'success');
    } catch (err: any) {
      const msg = err?.message || 'Erreur lors de l’enregistrement.';
      setInlineFeedback({ type: 'error', message: msg });
      showToast?.(msg, 'error');
    } finally {
      setSavingPolicy(false);
    }
  };

  const missingRequiredVarsCount = (environment?.variables || []).filter(
    (v) => !v.configured && !v.optional
  ).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs text-stone-500">
            Administration <span aria-hidden="true">/</span> Sauvegarde SQL HeroCab
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight mt-1">
            Sauvegarde base de données HeroCab
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Export automatique quotidien à 00h00 (Douala) depuis cPanel, test de restauration MySQL 8 temporaire, archivage Google Drive et purge automatique au-delà de {settings.retentionDays} jours.
          </p>
        </div>

        {/* Action Cluster */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <select
            aria-label="Mode de sauvegarde manuelle"
            value={triggerMode}
            onChange={(e) => setTriggerMode(e.target.value as BackupExecutionMode)}
            className="px-3 py-2 text-xs font-medium bg-white border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:border-[#2A7B76]"
          >
            <option value="github_level2">Niveau 2 · MySQL temporaire (GitHub)</option>
            <option value="server_direct">Niveau 1 · Serveur direct</option>
          </select>

          <button
            type="button"
            onClick={() => loadBackupStatus(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg transition disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerBackup}
            disabled={triggerBusy}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2A7B76] hover:bg-[#226460] disabled:opacity-60 rounded-lg transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            {triggerBusy ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            <span>{triggerBusy ? 'Exécution en cours…' : 'Lancer une sauvegarde'}</span>
          </button>
        </div>
      </div>

      {/* Configuration Readiness Notice (clean flat banner, no border-l-4) */}
      {!loading && environment && missingRequiredVarsCount > 0 && (
        <div className="bg-white border border-amber-200 rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs text-stone-700">
            <ShieldAlert className="h-4 w-4 text-[#D97706] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-stone-900">
                Configuration en attente : {missingRequiredVarsCount} variable{missingRequiredVarsCount > 1 ? 's' : ''} d’environnement à renseigner.
              </span>{' '}
              Consultez la liste exacte des clés cPanel, Google Drive et GitHub Secrets dans l’onglet Pipeline & Diagnostic.
            </div>
          </div>
          {subTab !== 'diagnostics' && (
            <button
              type="button"
              onClick={() => setSubTab('diagnostics')}
              className="text-xs font-semibold text-[#2A7B76] hover:underline whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-center"
            >
              Voir les variables requises
            </button>
          )}
        </div>
      )}

      {/* Load Error or Operation Feedback */}
      {(loadError || inlineFeedback) && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs ${
            loadError || inlineFeedback?.type === 'error'
              ? 'bg-red-50/80 border-red-200 text-[#DC2626]'
              : 'bg-emerald-50/80 border-emerald-200 text-[#16A34A]'
          }`}
        >
          {loadError || inlineFeedback?.message}
        </div>
      )}

      {/* 4-Column KPI Summary */}
      <BackupKpiStrip
        runs={runs}
        driveFiles={driveFiles}
        environment={environment}
        settings={settings}
        loading={loading}
      />

      {/* Segmented Module Sub-Navigation */}
      <div className="flex items-center gap-1 p-1 bg-stone-200/60 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setSubTab('history')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap shrink-0 cursor-pointer ${
            subTab === 'history'
              ? 'bg-white text-stone-900 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Historique & Drive
        </button>
        <button
          type="button"
          onClick={() => setSubTab('diagnostics')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap shrink-0 cursor-pointer ${
            subTab === 'diagnostics'
              ? 'bg-white text-stone-900 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Pipeline & Diagnostic
        </button>
        <button
          type="button"
          onClick={() => setSubTab('policy')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap shrink-0 cursor-pointer ${
            subTab === 'policy'
              ? 'bg-white text-stone-900 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Politique & Alertes
        </button>
      </div>

      {/* Active Sub-Tab View */}
      {subTab === 'history' && (
        <BackupHistorySection
          runs={runs}
          driveFiles={driveFiles}
          driveListError={driveListError}
          googleDriveReady={Boolean(environment?.googleDriveReady)}
          retentionDays={settings.retentionDays}
          loading={loading}
          verifyingFileId={verifyingFileId}
          onSelectRun={setSelectedRun}
          onVerifyDriveFile={handleVerifyDriveFile}
          onTriggerBackup={handleTriggerBackup}
          triggerBusy={triggerBusy}
        />
      )}

      {subTab === 'diagnostics' && (
        <BackupPipelineDiagnostics
          environment={environment}
          testingConnections={testingConnections}
          connectionResult={connectionResult}
          onTestConnections={handleTestConnections}
        />
      )}

      {subTab === 'policy' && (
        <BackupPolicyForm
          settings={settings}
          smtpReady={Boolean(environment?.smtpReady)}
          saving={savingPolicy}
          onSave={handleSavePolicy}
        />
      )}

      {/* Inspection Modal */}
      <BackupRunDetailModal run={selectedRun} onClose={() => setSelectedRun(null)} />
    </div>
  );
};

export default HerocabBackupPanel;
