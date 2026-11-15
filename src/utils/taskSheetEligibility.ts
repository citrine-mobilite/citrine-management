import { Task, Subtask } from '../types';

/**
 * Extrait la date d'achèvement (YYYY-MM-DD) d'une tâche ou sous-tâche.
 */
export function getCompletionDate(item: Task | Subtask, fallbackParentDate?: string): string | null {
  const isDone = item.status === 'completed' || (item as any).completed === true || (item.status as string) === 'fait';
  if (!isDone) return null;

  if (item.completedAt && typeof item.completedAt === 'string') {
    const d = item.completedAt.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  }

  const lastUpdated = (item as any).lastUpdatedTime || (item as any).updatedAt || (item as any).updated_at;
  if (lastUpdated && typeof lastUpdated === 'string') {
    const d = lastUpdated.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  }

  const itemCreatedAt = (item as any).createdAt;
  if (itemCreatedAt && typeof itemCreatedAt === 'string') {
    const d = itemCreatedAt.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  }

  if ((item as any).date && typeof (item as any).date === 'string') {
    const d = (item as any).date.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  }

  if (fallbackParentDate && /^\d{4}-\d{2}-\d{2}$/.test(fallbackParentDate)) {
    return fallbackParentDate;
  }

  return null;
}

/**
 * RÈGLE MÉTIER STRICTE :
 * Dans la feuille d'avancement des tâches (TaskSheet) :
 * - Seules les tâches terminées CETTE JOURNÉE ou EN COURS cette journée sont incluses.
 * - Toute tâche terminée AVANT targetDate est strictement exclue.
 */
export function isTaskEligibleForDayTaskSheet(
  item: Task | Subtask,
  targetDate: string,
  fallbackParentDate?: string
): boolean {
  if (!item || !targetDate) return false;

  const isDone = item.status === 'completed' || (item as any).completed === true || (item.status as string) === 'fait';
  const isInProgress = item.status === 'in_progress' || item.status === 'en_cours';
  const isBlocked = item.status === 'blocked' || (item as any).isBlocked === true;

  if (isDone) {
    const completionDate = getCompletionDate(item, fallbackParentDate);
    if (completionDate && completionDate < targetDate) {
      return false;
    }
    if (completionDate && completionDate === targetDate) {
      return true;
    }
    if ((item as any).date === targetDate || fallbackParentDate === targetDate) {
      return true;
    }
    return false;
  }

  if (isInProgress) {
    const start = (item as any).startDate || (item as any).date || (item as any).createdAt?.split('T')[0];
    if (start && start > targetDate) {
      return false;
    }
    return true;
  }

  if (isBlocked) {
    return true;
  }

  const itemDate = (item as any).date || (item as any).startDate || item.dueDate;
  if (itemDate === targetDate) {
    return true;
  }

  return false;
}

/**
 * Détermine le libellé de statut d'une tâche pour le TaskSheet d'un jour donné.
 */
export function getItemTaskSheetStatus(
  item: Task | Subtask,
  targetDate: string,
  fallbackParentDate?: string
): 'Fait' | 'En cours' | 'À faire' | 'Bloqué' | null {
  if (!isTaskEligibleForDayTaskSheet(item, targetDate, fallbackParentDate)) {
    return null;
  }

  const isDone = item.status === 'completed' || (item as any).completed === true || (item.status as string) === 'fait';
  if (isDone) return 'Fait';

  if (item.status === 'in_progress' || item.status === 'en_cours') return 'En cours';
  if (item.status === 'blocked' || (item as any).isBlocked === true) return 'Bloqué';

  return 'À faire';
}
