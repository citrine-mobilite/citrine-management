import { Subtask } from '../types';

export type SubtaskFilterPeriod =
  | 'current_week'
  | 'last_week'
  | 'current_month'
  | 'specific_date'
  | 'date_range'
  | 'all'
  | 'last3days';

export interface SubtaskFilterOptions {
  period?: SubtaskFilterPeriod;
  specificDate?: string;
  startDate?: string;
  endDate?: string;
  referenceDate?: Date;
}

const toLocalIsoDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatShortFr = (iso: string): string => {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}`;
};

/**
 * Calcule les bornes (Lundi -> Dimanche) de la semaine en cours.
 */
export function getCurrentWeekBounds(referenceDate: Date = new Date()): {
  startIso: string;
  endIso: string;
  startMs: number;
  endMs: number;
  labelFr: string;
} {
  const base = new Date(referenceDate);
  base.setHours(0, 0, 0, 0);
  const day = base.getDay(); // 0 = Dim, 1 = Lun, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(base);
  monday.setDate(base.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const startIso = toLocalIsoDate(monday);
  const endIso = toLocalIsoDate(sunday);
  return {
    startIso,
    endIso,
    startMs: monday.getTime(),
    endMs: sunday.getTime(),
    labelFr: `${formatShortFr(startIso)} au ${formatShortFr(endIso)}`,
  };
}

/**
 * Calcule les bornes (Lundi -> Dimanche) de la semaine précédente.
 */
export function getLastWeekBounds(referenceDate: Date = new Date()): {
  startIso: string;
  endIso: string;
  labelFr: string;
} {
  const ref = new Date(referenceDate);
  ref.setDate(ref.getDate() - 7);
  const bounds = getCurrentWeekBounds(ref);
  return {
    startIso: bounds.startIso,
    endIso: bounds.endIso,
    labelFr: bounds.labelFr,
  };
}

/**
 * Calcule les bornes du mois en cours.
 */
export function getCurrentMonthBounds(referenceDate: Date = new Date()): {
  startIso: string;
  endIso: string;
  labelFr: string;
} {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
  const startIso = toLocalIsoDate(start);
  const endIso = toLocalIsoDate(end);
  const labelFr = start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return { startIso, endIso, labelFr };
}

/**
 * Extrait le timestamp de création pur d'une sous-tâche (createdAt ou ID sub-timestamp)
 * pour départager de manière déterministe de la plus récente à la plus ancienne.
 */
export function getSubtaskCreatedTimestamp(subtask: Subtask): number {
  if (subtask.createdAt) {
    const t = new Date(subtask.createdAt).getTime();
    if (!isNaN(t)) return t;
  }
  if (subtask.id) {
    const match = subtask.id.match(/sub-(\d{10,13})/);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > 1600000000000) {
        return parsed;
      }
    }
  }
  return 0;
}

/**
 * Récupère le timestamp milliseconde d'une sous-tâche à des fins de tri et filtrage temporel.
 */
export function getSubtaskTimestamp(subtask: Subtask, parentTaskDate?: string): number {
  // PRIORITÉ 1 : Date d'échéance propre de la sous-tâche (dueDate)
  if (subtask.dueDate) {
    const timePart = subtask.time && /^\d{2}:\d{2}/.test(subtask.time) ? subtask.time.slice(0, 5) : '12:00';
    const t = new Date(`${subtask.dueDate.slice(0, 10)}T${timePart}:00`).getTime();
    if (!isNaN(t)) return t;
  }

  // PRIORITÉ 2 : Date de fin explicite de la sous-tâche (endDate)
  if (subtask.endDate) {
    const timePart = subtask.time && /^\d{2}:\d{2}/.test(subtask.time) ? subtask.time.slice(0, 5) : '12:00';
    const t = new Date(`${subtask.endDate.slice(0, 10)}T${timePart}:00`).getTime();
    if (!isNaN(t)) return t;
  }

  // PRIORITÉ 3 : Date de début de la sous-tâche (startDate)
  if (subtask.startDate) {
    const timePart = subtask.time && /^\d{2}:\d{2}/.test(subtask.time) ? subtask.time.slice(0, 5) : '12:00';
    const t = new Date(`${subtask.startDate.slice(0, 10)}T${timePart}:00`).getTime();
    if (!isNaN(t)) return t;
  }

  // PRIORITÉ 4 : Date de création exacte de la sous-tâche (createdAt)
  if (subtask.createdAt) {
    const t = new Date(subtask.createdAt).getTime();
    if (!isNaN(t)) return t;
  }

  // PRIORITÉ 5 : Timestamp embarqué dans l'ID (sub-1730000...)
  const createdTs = getSubtaskCreatedTimestamp(subtask);
  if (createdTs > 0) return createdTs;

  // PRIORITÉ 6 : Repli sur la date de la tâche parente
  if (parentTaskDate) {
    const t = new Date(`${parentTaskDate.slice(0, 10)}T12:00:00`).getTime();
    if (!isNaN(t)) return t;
  }

  return Date.now();
}

/**
 * Retourne la date ISO (YYYY-MM-DD) représentative d'une sous-tâche.
 */
export function getSubtaskEffectiveIsoDate(subtask: Subtask, parentTaskDate?: string): string {
  if (subtask.dueDate && /^\d{4}-\d{2}-\d{2}/.test(subtask.dueDate)) {
    return subtask.dueDate.slice(0, 10);
  }
  if (subtask.endDate && /^\d{4}-\d{2}-\d{2}/.test(subtask.endDate)) {
    return subtask.endDate.slice(0, 10);
  }
  if (subtask.startDate && /^\d{4}-\d{2}-\d{2}/.test(subtask.startDate)) {
    return subtask.startDate.slice(0, 10);
  }
  if (subtask.createdAt) {
    const d = new Date(subtask.createdAt);
    if (!isNaN(d.getTime())) return toLocalIsoDate(d);
  }
  const createdTs = getSubtaskCreatedTimestamp(subtask);
  if (createdTs > 0) {
    return toLocalIsoDate(new Date(createdTs));
  }
  if (parentTaskDate && /^\d{4}-\d{2}-\d{2}/.test(parentTaskDate)) {
    return parentTaskDate.slice(0, 10);
  }
  return toLocalIsoDate(new Date());
}

/**
 * Vérifie si une sous-tâche appartient à une plage de dates [startIso, endIso] (inclus).
 */
export function isSubtaskInDateRange(
  subtask: Subtask,
  startIso: string,
  endIso: string,
  parentTaskDate?: string
): boolean {
  const cleanStart = startIso <= endIso ? startIso : endIso;
  const cleanEnd = startIso <= endIso ? endIso : startIso;

  const subStart = subtask.startDate?.slice(0, 10);
  const subEnd = (subtask.dueDate || subtask.endDate)?.slice(0, 10);

  // Si la sous-tâche couvre une plage [subStart, subEnd], vérifier l'intersection avec [cleanStart, cleanEnd]
  if (subStart && subEnd) {
    const effectiveEnd = subEnd >= subStart ? subEnd : subStart;
    return effectiveEnd >= cleanStart && subStart <= cleanEnd;
  }

  const effectiveIso = getSubtaskEffectiveIsoDate(subtask, parentTaskDate);
  return effectiveIso >= cleanStart && effectiveIso <= cleanEnd;
}

/**
 * Vérifie si une sous-tâche appartient à la semaine en cours (Lundi -> Dimanche).
 */
export function isSubtaskInCurrentWeek(
  subtask: Subtask,
  parentTaskDate?: string,
  referenceDate: Date = new Date()
): boolean {
  const { startIso, endIso } = getCurrentWeekBounds(referenceDate);
  return isSubtaskInDateRange(subtask, startIso, endIso, parentTaskDate);
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
  const cutoff = new Date(referenceDate);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 2);
  return ts >= cutoff.getTime();
}

/**
 * Trie les sous-tâches de la plus récente à la plus ancienne (ordre antéchronologique strict).
 * Compare d'abord la date effective (YYYY-MM-DD), puis départage les sous-tâches d'un même jour
 * par leur horodatage de création (createdAt / timestamp d'ID, plus récente en premier).
 */
export function sortSubtasksNewestFirst(subtasks: Subtask[], parentTaskDate?: string): Subtask[] {
  return [...subtasks].sort((a, b) => {
    const isoA = getSubtaskEffectiveIsoDate(a, parentTaskDate);
    const isoB = getSubtaskEffectiveIsoDate(b, parentTaskDate);
    if (isoB !== isoA) {
      return isoB.localeCompare(isoA);
    }

    const createdA = getSubtaskCreatedTimestamp(a);
    const createdB = getSubtaskCreatedTimestamp(b);
    if (createdB !== createdA) {
      return createdB - createdA;
    }

    const timeA = getSubtaskTimestamp(a, parentTaskDate);
    const timeB = getSubtaskTimestamp(b, parentTaskDate);
    if (timeB !== timeA) {
      return timeB - timeA;
    }

    return String(b.id || '').localeCompare(String(a.id || ''));
  });
}

/**
 * Filtre et ordonne la liste des sous-tâches de la plus récente à la plus ancienne.
 * Par défaut : 'current_week' (semaine en cours uniquement).
 */
export function filterAndSortSubtasks(
  subtasks: Subtask[],
  filterInput: SubtaskFilterPeriod | SubtaskFilterOptions = 'current_week',
  parentTaskDate?: string
): {
  displayedSubtasks: Subtask[];
  hiddenCount: number;
  totalCount: number;
  activeRangeLabel: string;
} {
  const opts: SubtaskFilterOptions =
    typeof filterInput === 'string' ? { period: filterInput } : filterInput;

  const period: SubtaskFilterPeriod = opts.period || 'current_week';
  const refDate = opts.referenceDate || new Date();
  const sorted = sortSubtasksNewestFirst(subtasks, parentTaskDate);
  const totalCount = sorted.length;

  if (period === 'all') {
    return {
      displayedSubtasks: sorted,
      hiddenCount: 0,
      totalCount,
      activeRangeLabel: 'Toutes les périodes',
    };
  }

  let filtered: Subtask[] = sorted;
  let activeRangeLabel = '';

  if (period === 'current_week') {
    const bounds = getCurrentWeekBounds(refDate);
    activeRangeLabel = `Semaine en cours (${bounds.labelFr})`;
    filtered = sorted.filter((s) =>
      isSubtaskInDateRange(s, bounds.startIso, bounds.endIso, parentTaskDate)
    );
  } else if (period === 'last_week') {
    const bounds = getLastWeekBounds(refDate);
    activeRangeLabel = `Semaine dernière (${bounds.labelFr})`;
    filtered = sorted.filter((s) =>
      isSubtaskInDateRange(s, bounds.startIso, bounds.endIso, parentTaskDate)
    );
  } else if (period === 'current_month') {
    const bounds = getCurrentMonthBounds(refDate);
    activeRangeLabel = `Mois en cours (${bounds.labelFr})`;
    filtered = sorted.filter((s) =>
      isSubtaskInDateRange(s, bounds.startIso, bounds.endIso, parentTaskDate)
    );
  } else if (period === 'specific_date') {
    const targetIso = (opts.specificDate || toLocalIsoDate(refDate)).slice(0, 10);
    activeRangeLabel = `Date : ${formatShortFr(targetIso)}/${targetIso.slice(0, 4)}`;
    filtered = sorted.filter((s) => isSubtaskInDateRange(s, targetIso, targetIso, parentTaskDate));
  } else if (period === 'date_range') {
    const week = getCurrentWeekBounds(refDate);
    const startIso = (opts.startDate || week.startIso).slice(0, 10);
    const endIso = (opts.endDate || opts.startDate || week.endIso).slice(0, 10);
    activeRangeLabel = `Période : ${formatShortFr(startIso)} → ${formatShortFr(endIso)}`;
    filtered = sorted.filter((s) => isSubtaskInDateRange(s, startIso, endIso, parentTaskDate));
  } else if (period === 'last3days') {
    activeRangeLabel = '3 derniers jours';
    filtered = sorted.filter((s) => isSubtaskInLast3Days(s, parentTaskDate, refDate));
  }

  const hiddenCount = Math.max(0, totalCount - filtered.length);
  return {
    displayedSubtasks: filtered,
    hiddenCount,
    totalCount,
    activeRangeLabel,
  };
}

/**
 * Formate lisiblement la date relative d'une sous-tâche (ex: "Aujourd'hui", "Hier", "26/10/2026")
 */
export function formatSubtaskRelativeDate(subtask: Subtask, parentTaskDate?: string): string {
  const effectiveIso = subtask.dueDate || subtask.endDate || subtask.startDate;
  if (effectiveIso) {
    const clean = effectiveIso.slice(0, 10);
    const parts = clean.split('-');
    if (parts.length === 3) {
      const targetDay = new Date(`${clean}T12:00:00`);
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const diffDays = Math.round((targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Aujourd'hui";
      if (diffDays === 1) return 'Demain';
      if (diffDays === -1) return 'Hier';
      if (diffDays > 1 && diffDays <= 7) return `Dans ${diffDays} j (${parts[2]}/${parts[1]})`;
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

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
  if (diffDays < 0) return `Échéance : ${date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}
