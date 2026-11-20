/**
 * Pure browser-safe formatters & schedule helpers for the HeroCab SQL Backup UI.
 * Keeps Node builtins (crypto/zlib) strictly out of the Vite client bundle.
 */

export function formatBackupSize(bytes: number | null | undefined): string {
  const n = Number(bytes || 0);
  if (!Number.isFinite(n) || n <= 0) return '0 o';
  if (n < 1024) return `${Math.round(n)} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} Mo`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}

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

export function formatDateTimeDouala(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Africa/Douala',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return d.toLocaleString('fr-FR');
  }
}

export function formatShortTimeUntil(targetIso?: string | null, now: Date = new Date()): string {
  if (!targetIso) return '00:00 (Douala)';
  const diffMs = new Date(targetIso).getTime() - now.getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) return 'Imminent';
  const totalMin = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours <= 0) return `Dans ${mins} min`;
  return `Dans ${hours} h ${String(mins).padStart(2, '0')} min`;
}

export function getStatusDisplay(status: string): {
  label: string;
  textClass: string;
} {
  switch (status) {
    case 'verified':
      return { label: 'Vérifiée', textClass: 'text-[#16A34A]' };
    case 'warning':
      return { label: 'Vérifiée (avertissement)', textClass: 'text-[#D97706]' };
    case 'running':
      return { label: 'En cours', textClass: 'text-[#2A7B76]' };
    case 'corrupted':
      return { label: 'Corrompue', textClass: 'text-[#DC2626]' };
    case 'failed':
      return { label: 'Échec', textClass: 'text-[#DC2626]' };
    default:
      return { label: status || 'Inconnu', textClass: 'text-stone-600' };
  }
}

export function getTriggerLabel(source: string): string {
  switch (source) {
    case 'cron_midnight':
      return 'Auto 00h00';
    case 'manual_ui':
      return 'Manuel';
    case 'api_cron':
      return 'Cron API';
    case 'github_workflow':
      return 'GitHub Actions';
    default:
      return source || 'Manuel';
  }
}
