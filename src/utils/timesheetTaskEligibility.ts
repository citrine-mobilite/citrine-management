import { Task, Subtask } from '../types';

/**
 * Extrait la date d'achèvement (YYYY-MM-DD) d'une tâche ou sous-tâche
 */
export function getCompletionDate(item: Task | Subtask, fallbackParentDate?: string): string | null {
  const isDone = item.status === 'completed' || (item as any).completed === true || (item.status as string) === 'fait';
  if (!isDone) return null;

  // 1. Champ explicite completedAt
  if (item.completedAt && typeof item.completedAt === 'string') {
    const d = item.completedAt.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  }

  // 2. Dernière date de mise à jour (si marquée terminée récemment)
  const lastUpdated = (item as any).lastUpdatedTime || (item as any).updatedAt || (item as any).updated_at;
  if (lastUpdated && typeof lastUpdated === 'string') {
    const d = lastUpdated.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  }

  // 3. Date de création (si créée et close le même jour)
  const itemCreatedAt = (item as any).createdAt;
  if (itemCreatedAt && typeof itemCreatedAt === 'string') {
    const d = itemCreatedAt.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  }

  // 4. Date de planification directe
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
 * Dans la feuille de temps :
 * - Seules les tâches qui ont été terminées CETTE JOURNÉE ou sont EN COURS cette journée peuvent être envoyées.
 * - Si une tâche a été terminée AVANT cette journée (ex: terminée hier ou il y a 3 jours),
 *   elle NE DOIT PAS être envoyée ni listée, MÊME SI son échéance est aujourd'hui.
 */
export function isTaskEligibleForDayTimesheet(
  item: Task | Subtask,
  targetDate: string,
  fallbackParentDate?: string
): boolean {
  if (!item || !targetDate) return false;

  const isDone = item.status === 'completed' || (item as any).completed === true || (item.status as string) === 'fait';
  const isInProgress = item.status === 'in_progress' || item.status === 'en_cours';
  const isBlocked = item.status === 'blocked' || (item as any).isBlocked === true;

  // CAS 1 : Tâche terminée
  if (isDone) {
    const completionDate = getCompletionDate(item, fallbackParentDate);
    // Si la tâche a été terminée AVANT targetDate, elle est STRICTEMENT EXCLUE
    if (completionDate && completionDate < targetDate) {
      return false;
    }
    // Si elle a été terminée CE JOUR-LÀ (ou aujourd'hui si targetDate est aujourd'hui)
    if (completionDate && completionDate === targetDate) {
      return true;
    }
    // Si aucune date de fin n'est traçable mais que la date de la tâche est ce jour-là
    if ((item as any).date === targetDate || fallbackParentDate === targetDate) {
      return true;
    }
    // Par précaution : si elle a été terminée sans date prouvant que c'était aujourd'hui, on ne l'envoie pas
    return false;
  }

  // CAS 2 : Tâche EN COURS cette journée
  if (isInProgress) {
    // Si elle a une date de début ou création, vérifier qu'elle a déjà commencé
    const start = (item as any).startDate || (item as any).date || (item as any).createdAt?.split('T')[0];
    if (start && start > targetDate) {
      return false; // Ne commence que dans le futur
    }
    return true;
  }

  // CAS 3 : Tâche BLOQUÉE ou À FAIRE pour cette journée
  if (isBlocked) {
    return true;
  }

  // Tâche 'todo' : incluse seulement si explicitement planifiée pour ce jour-là
  const itemDate = (item as any).date || (item as any).startDate || item.dueDate;
  if (itemDate === targetDate) {
    return true;
  }

  return false;
}

/**
 * Détermine le libellé de statut d'une tâche pour la feuille de temps d'un jour donné
 */
export function getItemTimesheetStatus(
  item: Task | Subtask,
  targetDate: string,
  fallbackParentDate?: string
): 'Fait' | 'En cours' | 'À faire' | 'Bloqué' | null {
  if (!isTaskEligibleForDayTimesheet(item, targetDate, fallbackParentDate)) {
    return null;
  }

  const isDone = item.status === 'completed' || (item as any).completed === true || (item.status as string) === 'fait';
  if (isDone) return 'Fait';

  if (item.status === 'in_progress' || item.status === 'en_cours') return 'En cours';
  if (item.status === 'blocked' || (item as any).isBlocked === true) return 'Bloqué';

  return 'À faire';
}
