import { Subtask, Task } from '../types';

/**
 * Récupère le timestamp milliseconde d'une sous-tâche à des fins de tri et filtrage temporel.
 * Priorise :
 * 1. createdAt (date de création exacte)
 * 2. dueDate (date d'échéance)
 * 3. startDate / endDate
 * 4. Timestamp embarqué dans l'ID (ex: sub-1730100000000)
 * 5. Date de la tâche parente
 * 6. Date du jour en repli
 */
export function getSubtaskTimestamp(subtask: Subtask, parentTaskDate?: string): number {
  if (subtask.createdAt) {
    const t = new Date(subtask.createdAt).getTime();
    if (!isNaN(t)) return t;
  }

  if (subtask.dueDate) {
    const t = new Date(`${subtask.dueDate}T12:00:00`).getTime();
    if (!isNaN(t)) return t;
  }

  if (subtask.endDate) {
    const t = new Date(`${subtask.endDate}T12:00:00`).getTime();
    if (!isNaN(t)) return t;
  }

  if (subtask.startDate) {
    const t = new Date(`${subtask.startDate}T12:00:00`).getTime();
    if (!isNaN(t)) return t;
  }

  // Si l'identifiant est généré comme sub-1730000...
  if (subtask.id) {
    const match = subtask.id.match(/sub-(\d{10,13})/);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > 1600000000000) {
        return parsed;
      }
    }
  }

  if (parentTaskDate) {
    const t = new Date(`${parentTaskDate}T12:00:00`).getTime();
    if (!isNaN(t)) return t;
  }

  return Date.now();
}

/**
 * Détermine si une sous-tâche se situe dans la fenêtre des 3 derniers jours glissants
 * (Aujourd'hui, J-1, J-2, ainsi que toute date future/en cours).
 */
export function isSubtaskInLast3Days(
  subtask: Subtask,
  parentTaskDate?: string,
  referenceDate: Date = new Date()
): boolean {
  const ts = getSubtaskTimestamp(subtask, parentTaskDate);

  // Début du jour il y a 3 jours à 00:00:00
  const cutoff = new Date(referenceDate);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 2); // J (aujourd'hui) + J-1 + J-2 = 3 jours glissants

  // Les sous-tâches postérieures ou égales au seuil (incluant les futures) sont dans la fenêtre
  return ts >= cutoff.getTime();
}

/**
 * Trie les sous-tâches de la plus récente à la plus ancienne (ordre antéchronologique strict).
 */
export function sortSubtasksNewestFirst(subtasks: Subtask[], parentTaskDate?: string): Subtask[] {
  return [...subtasks].sort((a, b) => {
    const timeA = getSubtaskTimestamp(a, parentTaskDate);
    const timeB = getSubtaskTimestamp(b, parentTaskDate);
    return timeB - timeA; // Du plus grand (plus récent) au plus petit (plus ancien)
  });
}

/**
 * Filtre et ordonne la liste des sous-tâches :
 * - Si filterPeriod === 'last3days' : uniquement les 3 derniers jours (antéchronologique)
 * - Si filterPeriod === 'all' : toutes les sous-tâches (antéchronologique)
 */
export function filterAndSortSubtasks(
  subtasks: Subtask[],
  filterPeriod: 'last3days' | 'all' = 'last3days',
  parentTaskDate?: string
): {
  displayedSubtasks: Subtask[];
  hiddenCount: number;
  totalCount: number;
} {
  const sorted = sortSubtasksNewestFirst(subtasks, parentTaskDate);
  const totalCount = sorted.length;

  if (filterPeriod === 'all') {
    return {
      displayedSubtasks: sorted,
      hiddenCount: 0,
      totalCount,
    };
  }

  const filtered = sorted.filter((s) => isSubtaskInLast3Days(s, parentTaskDate));
  const hiddenCount = totalCount - filtered.length;

  return {
    displayedSubtasks: filtered,
    hiddenCount: Math.max(0, hiddenCount),
    totalCount,
  };
}

/**
 * Formate lisiblement la date relative d'une sous-tâche (ex: "Aujourd'hui", "Hier", "Il y a 2 j", "26/10/2026")
 */
export function formatSubtaskRelativeDate(subtask: Subtask, parentTaskDate?: string): string {
  const ts = getSubtaskTimestamp(subtask, parentTaskDate);
  const date = new Date(ts);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDay = new Date(date);
  targetDay.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays === 2) return 'Il y a 2 j';
  if (diffDays < 0) return `Prévue (${date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })})`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}
