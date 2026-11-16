import {
  Subtask,
  Task,
  TaskProject,
  TaskRecurrence,
  TaskSection,
  TaskStatus,
} from '../../../types';
import { DEFAULT_PROJECT_RULES, DEFAULT_PROJECT_SECTIONS } from '../taskConstants';

export interface AsanaBreadcrumbItem {
  id: string;
  title: string;
  kind: 'project' | 'task' | 'subtask';
  path: string[];
}

export interface DependencyRef {
  id: string;
  title: string;
  completed: boolean;
  parentTaskTitle?: string;
}

/**
 * Retourne les sections ordonnées d'un projet (ou les sections par défaut si non définies).
 */
export function resolveProjectSections(project?: TaskProject | null): TaskSection[] {
  const source =
    project?.sections && project.sections.length > 0
      ? project.sections
      : DEFAULT_PROJECT_SECTIONS;
  return [...source].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
}

/**
 * Détermine la section cible d'une tâche dans un projet, avec repli intelligent sur son statut.
 */
export function resolveTaskSectionId(task: Task, sections: TaskSection[]): string {
  if (task.sectionId && sections.some((s) => s.id === task.sectionId)) {
    return task.sectionId;
  }
  const statusToDefaultSec: Record<TaskStatus, string> = {
    idea: 'sec_todo',
    todo: 'sec_todo',
    in_progress: 'sec_in_progress',
    en_cours: 'sec_in_progress',
    pending_validation: 'sec_review',
    blocked: 'sec_in_progress',
    completed: 'sec_completed',
  };
  const preferred = statusToDefaultSec[task.status || 'todo'] || sections[0]?.id || 'sec_todo';
  if (sections.some((s) => s.id === preferred)) return preferred;
  return sections[0]?.id || 'sec_todo';
}

/**
 * Associe un nom ou ID de section par défaut au statut Kanban correspondant si applicable.
 */
export function inferStatusFromSection(section: TaskSection, currentStatus: TaskStatus): TaskStatus {
  const titleLower = section.title.toLowerCase();
  if (section.id === 'sec_completed' || titleLower.includes('termin') || titleLower.includes('fait') || titleLower.includes('done')) {
    return 'completed';
  }
  if (section.id === 'sec_review' || titleLower.includes('revue') || titleLower.includes('valid')) {
    return 'pending_validation';
  }
  if (section.id === 'sec_in_progress' || titleLower.includes('cours') || titleLower.includes('progress')) {
    return currentStatus === 'blocked' ? 'blocked' : 'in_progress';
  }
  if (section.id === 'sec_todo' || titleLower.includes('faire') || titleLower.includes('backlog')) {
    return currentStatus === 'idea' ? 'idea' : 'todo';
  }
  return currentStatus;
}

export function sortTasksByOrder(list: Task[]): Task[] {
  return [...list].sort((a, b) => {
    const oA = typeof a.orderIndex === 'number' ? a.orderIndex : Number.MAX_SAFE_INTEGER;
    const oB = typeof b.orderIndex === 'number' ? b.orderIndex : Number.MAX_SAFE_INTEGER;
    if (oA !== oB) return oA - oB;
    return (a.date || '').localeCompare(b.date || '');
  });
}

export function sortSubtasksByOrder(list: Subtask[]): Subtask[] {
  return [...list].sort((a, b) => {
    const oA = typeof a.orderIndex === 'number' ? a.orderIndex : Number.MAX_SAFE_INTEGER;
    const oB = typeof b.orderIndex === 'number' ? b.orderIndex : Number.MAX_SAFE_INTEGER;
    if (oA !== oB) return oA - oB;
    return (a.createdAt || '').localeCompare(b.createdAt || '');
  });
}

/**
 * Réordonne une liste (Task ou Subtask) suite à un glisser-déposer et recalcule orderIndex.
 */
export function reorderItemsWithDrag<T extends { id: string; orderIndex?: number }>(
  list: T[],
  draggedId: string,
  targetId: string,
  placeAfter: boolean = false
): T[] {
  const draggedIdx = list.findIndex((item) => item.id === draggedId);
  const targetIdx = list.findIndex((item) => item.id === targetId);
  if (draggedIdx === -1 || targetIdx === -1 || draggedIdx === targetIdx) {
    return list;
  }
  const copy = [...list];
  const [moved] = copy.splice(draggedIdx, 1);
  const adjustedTargetIdx = copy.findIndex((item) => item.id === targetId);
  const insertAt = placeAfter ? adjustedTargetIdx + 1 : adjustedTargetIdx;
  copy.splice(Math.max(0, insertAt), 0, moved);
  return copy.map((item, idx) => ({ ...item, orderIndex: idx }));
}

/**
 * Trouve une sous-tâche par son chemin d'IDs (['sub-1', 'sub-2', ...]).
 */
export function findSubtaskByPath(subtasks: Subtask[], path: string[]): Subtask | null {
  if (!path || path.length === 0) return null;
  let currentList = subtasks || [];
  let found: Subtask | null = null;
  for (const id of path) {
    found = currentList.find((s) => s.id === id) || null;
    if (!found) return null;
    currentList = found.subtasks || [];
  }
  return found;
}

/**
 * Construit le fil d'Ariane Asana (Projet > Tâche > Sous-tâche > Sous-sous-tâche).
 */
export function buildAsanaBreadcrumb(
  task: Task,
  path: string[],
  project?: TaskProject | null
): AsanaBreadcrumbItem[] {
  const trail: AsanaBreadcrumbItem[] = [];
  if (project) {
    trail.push({ id: project.id, title: project.name, kind: 'project', path: [] });
  }
  trail.push({ id: task.id, title: task.title, kind: 'task', path: [] });

  let currentList = task.subtasks || [];
  const accPath: string[] = [];
  for (const subId of path) {
    const sub = currentList.find((s) => s.id === subId);
    if (!sub) break;
    accPath.push(sub.id);
    trail.push({
      id: sub.id,
      title: sub.title,
      kind: 'subtask',
      path: [...accPath],
    });
    currentList = sub.subtasks || [];
  }
  return trail;
}

/**
 * Met à jour de manière immuable une sous-tâche située à n'importe quelle profondeur.
 */
export function updateSubtaskAtPath(
  subtasks: Subtask[],
  path: string[],
  updater: (sub: Subtask) => Subtask
): Subtask[] {
  if (path.length === 0) return subtasks;
  const [head, ...rest] = path;
  return (subtasks || []).map((s) => {
    if (s.id !== head) return s;
    if (rest.length === 0) {
      return updater(s);
    }
    return {
      ...s,
      subtasks: updateSubtaskAtPath(s.subtasks || [], rest, updater),
    };
  });
}

/**
 * Ajoute une sous-tâche enfant au chemin donné (path=[] => ajoute sur la tâche racine).
 */
export function addSubtaskToTaskAtPath(
  task: Task,
  path: string[],
  newSubtask: Subtask
): Task {
  if (path.length === 0) {
    const list = task.subtasks || [];
    const nextOrder = list.length;
    return {
      ...task,
      subtasks: [...list, { ...newSubtask, orderIndex: nextOrder }],
      lastUpdatedTime: new Date().toISOString(),
    };
  }
  return {
    ...task,
    subtasks: updateSubtaskAtPath(task.subtasks || [], path, (parentSub) => {
      const children = parentSub.subtasks || [];
      return {
        ...parentSub,
        subtasks: [...children, { ...newSubtask, orderIndex: children.length }],
      };
    }),
    lastUpdatedTime: new Date().toISOString(),
  };
}

/**
 * Supprime une sous-tâche à n'importe quelle profondeur.
 */
export function deleteSubtaskAtPath(subtasks: Subtask[], path: string[]): Subtask[] {
  if (path.length === 0) return subtasks;
  if (path.length === 1) {
    return (subtasks || []).filter((s) => s.id !== path[0]);
  }
  const [head, ...rest] = path;
  return (subtasks || []).map((s) =>
    s.id === head ? { ...s, subtasks: deleteSubtaskAtPath(s.subtasks || [], rest) } : s
  );
}

/**
 * Compte récursivement les sous-tâches (tous niveaux confondus).
 */
export function countRecursiveSubtasks(subtasks: Subtask[] = []): {
  total: number;
  completed: number;
  blocked: number;
} {
  let total = 0;
  let completed = 0;
  let blocked = 0;
  const walk = (list: Subtask[]) => {
    for (const s of list) {
      total += 1;
      if (s.completed || s.status === 'completed') completed += 1;
      if (s.status === 'blocked' || s.isBlocked || (s.incidents && s.incidents.length > 0)) blocked += 1;
      if (s.subtasks && s.subtasks.length > 0) walk(s.subtasks);
    }
  };
  walk(subtasks);
  return { total, completed, blocked };
}

/**
 * Indexe toutes les tâches et sous-tâches pour la résolution des dépendances bloquantes.
 */
export function collectAllDependencyCandidates(
  tasks: Task[],
  excludeId?: string
): DependencyRef[] {
  const results: DependencyRef[] = [];
  const walkSubtasks = (list: Subtask[], parentTitle: string) => {
    for (const s of list) {
      if (s.id !== excludeId) {
        results.push({
          id: s.id,
          title: s.title,
          completed: Boolean(s.completed || s.status === 'completed'),
          parentTaskTitle: parentTitle,
        });
      }
      if (s.subtasks && s.subtasks.length > 0) {
        walkSubtasks(s.subtasks, `${parentTitle} › ${s.title}`);
      }
    }
  };
  for (const t of tasks) {
    if (t.id !== excludeId) {
      results.push({
        id: t.id,
        title: t.title,
        completed: t.status === 'completed',
      });
    }
    if (t.subtasks && t.subtasks.length > 0) {
      walkSubtasks(t.subtasks, t.title);
    }
  }
  return results;
}

export function getUnfinishedBlockers(
  dependsOnIds: string[] | undefined,
  tasks: Task[]
): DependencyRef[] {
  if (!dependsOnIds || dependsOnIds.length === 0) return [];
  const candidates = collectAllDependencyCandidates(tasks);
  const byId = new Map(candidates.map((c) => [c.id, c]));
  return dependsOnIds
    .map((id) => byId.get(id))
    .filter((ref): ref is DependencyRef => Boolean(ref && !ref.completed));
}

export function computeNextRecurrenceDate(
  baseDateStr: string | undefined,
  recurrence: TaskRecurrence | undefined
): string | null {
  if (!recurrence || recurrence === 'none') return null;
  const base = baseDateStr ? new Date(`${baseDateStr}T12:00:00`) : new Date();
  if (isNaN(base.getTime())) return null;
  if (recurrence === 'daily') base.setDate(base.getDate() + 1);
  else if (recurrence === 'weekly') base.setDate(base.getDate() + 7);
  else if (recurrence === 'monthly') base.setMonth(base.getMonth() + 1);
  return base.toISOString().split('T')[0];
}

export function isAutoCompleteParentEnabled(project?: TaskProject | null): boolean {
  const rules = project?.rules && project.rules.length > 0 ? project.rules : DEFAULT_PROJECT_RULES;
  return rules.some(
    (r) => r.enabled && r.trigger === 'all_subtasks_done' && r.action === 'complete_parent'
  );
}
