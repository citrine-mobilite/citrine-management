import { Employee, Subtask, Task } from '../types';
import { isTaskAssignedToEmployee } from '../utils/rendementCalculator';

export interface RedundantItemRef {
  uid: string;
  kind: 'task' | 'subtask';
  taskId: string;
  subtaskId?: string;
  parentTaskTitle?: string;
  title: string;
  status: string;
  date?: string;
  estimatedHours?: number;
  ignoredDuplicateIds?: string[];
}

export interface RedundancyCluster {
  clusterId: string;
  employeeId: string;
  maxSimilarity: number;
  scope: 'task' | 'subtask' | 'mixed';
  reasonLabel: string;
  items: RedundantItemRef[];
}

export interface PotentialDuplicateMatch {
  uid: string;
  kind: 'task' | 'subtask';
  taskId: string;
  subtaskId?: string;
  parentTaskTitle?: string;
  title: string;
  status: string;
  similarity: number;
}

const FRENCH_STOPWORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd', 'l',
  'et', 'ou', 'a', 'au', 'aux', 'en', 'dans', 'sur', 'sous',
  'pour', 'par', 'avec', 'sans', 'chez', 'vers', 'ce', 'cet', 'cette',
  'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
  'faire', 'faut', 'etre', 'avoir', 'mise', 'mettre',
]);

/**
 * Normalise un titre pour comparaison lexicale (minuscules, sans accents ni ponctuation).
 */
export function normalizeTaskTitle(raw: string): string {
  return String(raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’`\-_/.,:;!?()[\]{}"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrait les jetons significatifs d'un titre en filtrant les mots vides.
 */
export function tokenizeTitle(raw: string): string[] {
  const norm = normalizeTaskTitle(raw);
  if (!norm) return [];
  return norm
    .split(' ')
    .filter((tok) => tok.length >= 2 && !FRENCH_STOPWORDS.has(tok));
}

function getBigrams(str: string): string[] {
  const clean = str.replace(/\s+/g, '');
  if (clean.length < 2) return [clean];
  const res: string[] = [];
  for (let i = 0; i < clean.length - 1; i++) {
    res.push(clean.slice(i, i + 2));
  }
  return res;
}

function diceSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const biA = getBigrams(a);
  const biB = getBigrams(b);
  const counts = new Map<string, number>();
  biA.forEach((bg) => counts.set(bg, (counts.get(bg) || 0) + 1));

  let intersection = 0;
  biB.forEach((bg) => {
    const c = counts.get(bg) || 0;
    if (c > 0) {
      intersection++;
      counts.set(bg, c - 1);
    }
  });
  return (2 * intersection) / (biA.length + biB.length);
}

/**
 * Calcule un score de similarité entre 0 et 1 combinant Jaccard sur tokens et Dice sur bigrammes.
 */
export function computeTitleSimilarity(titleA: string, titleB: string): number {
  const normA = normalizeTaskTitle(titleA);
  const normB = normalizeTaskTitle(titleB);
  if (normA.length < 4 || normB.length < 4) return 0;
  if (normA === normB) return 1;

  // Préserver les nombres/identifiants discriminants (ex: S12 vs S13, P1 vs P2, 2025 vs 2026)
  const numsA = normA.match(/\b\d+\b/g) || [];
  const numsB = normB.match(/\b\d+\b/g) || [];
  if (numsA.length > 0 && numsB.length > 0 && numsA.join('|') !== numsB.join('|')) {
    return 0;
  }

  const tokensA = new Set(tokenizeTitle(titleA));
  const tokensB = new Set(tokenizeTitle(titleB));
  if (tokensA.size === 0 || tokensB.size === 0) {
    return diceSimilarity(normA, normB);
  }

  let inter = 0;
  tokensA.forEach((t) => {
    if (tokensB.has(t)) inter++;
  });
  const union = new Set([...tokensA, ...tokensB]).size;
  const jaccard = union > 0 ? inter / union : 0;
  const dice = diceSimilarity(normA, normB);

  const containmentBonus =
    normA.length >= 8 && normB.length >= 8 && (normA.includes(normB) || normB.includes(normA))
      ? 0.12
      : 0;

  return Math.min(1, Math.round((jaccard * 0.55 + dice * 0.45 + containmentBonus) * 100) / 100);
}

function areIgnoredPair(a: RedundantItemRef, b: RedundantItemRef): boolean {
  if (a.ignoredDuplicateIds?.includes(b.uid) || a.ignoredDuplicateIds?.includes(b.taskId)) return true;
  if (b.ignoredDuplicateIds?.includes(a.uid) || b.ignoredDuplicateIds?.includes(a.taskId)) return true;
  return false;
}

/**
 * Collecte toutes les tâches et sous-tâches assignées à un collaborateur.
 */
function collectEmployeeWorkItems(tasks: Task[], employee: Employee): RedundantItemRef[] {
  const refs: RedundantItemRef[] = [];

  tasks.forEach((t) => {
    if (t.mergedIntoTaskId) return;
    const taskAssigned = isTaskAssignedToEmployee(t, employee);
    if (taskAssigned && (t.title || '').trim().length >= 4) {
      refs.push({
        uid: `task:${t.id}`,
        kind: 'task',
        taskId: t.id,
        title: t.title,
        status: t.status,
        date: t.dueDate || t.date,
        estimatedHours: t.estimatedHours,
        ignoredDuplicateIds: t.ignoredDuplicateIds,
      });
    }

    const collectSubs = (subs: Subtask[] | undefined) => {
      if (!Array.isArray(subs)) return;
      subs.forEach((s) => {
        if (s.mergedIntoTaskId) return;
        const subAssigned = taskAssigned || isTaskAssignedToEmployee(s, employee);
        if (subAssigned && (s.title || '').trim().length >= 4) {
          refs.push({
            uid: `sub:${t.id}:${s.id}`,
            kind: 'subtask',
            taskId: t.id,
            subtaskId: s.id,
            parentTaskTitle: t.title,
            title: s.title,
            status: s.status || (s.completed ? 'completed' : 'todo'),
            date: s.dueDate || t.dueDate || t.date,
            estimatedHours: s.estimatedHours,
            ignoredDuplicateIds: s.ignoredDuplicateIds,
          });
        }
        if (Array.isArray(s.subtasks) && s.subtasks.length > 0) {
          collectSubs(s.subtasks);
        }
      });
    };

    collectSubs(t.subtasks);
  });

  return refs;
}

/**
 * Détecte les grappes de tâches et sous-tâches redondantes pour un collaborateur.
 */
export function detectEmployeeRedundancies(
  tasks: Task[],
  employee: Employee,
  options?: { threshold?: number }
): RedundancyCluster[] {
  const threshold = options?.threshold ?? 0.74;
  const items = collectEmployeeWorkItems(tasks, employee);
  if (items.length < 2) return [];

  const parent = items.map((_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const unite = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };

  const pairScores = new Map<string, number>();

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      if (a.uid === b.uid) continue;
      if (areIgnoredPair(a, b)) continue;

      // Éviter de signaler deux tâches toutes les deux déjà clôturées il y a longtemps
      const bothDone = a.status === 'completed' && b.status === 'completed';
      if (bothDone) continue;

      const sim = computeTitleSimilarity(a.title, b.title);
      if (sim >= threshold) {
        unite(i, j);
        pairScores.set(`${i}-${j}`, sim);
      }
    }
  }

  const groups = new Map<number, number[]>();
  items.forEach((_, idx) => {
    const root = find(idx);
    const arr = groups.get(root) || [];
    arr.push(idx);
    groups.set(root, arr);
  });

  const clusters: RedundancyCluster[] = [];
  groups.forEach((indices, rootIdx) => {
    if (indices.length < 2) return;
    const groupItems = indices.map((idx) => items[idx]);

    let maxSim = threshold;
    for (let a = 0; a < indices.length; a++) {
      for (let b = a + 1; b < indices.length; b++) {
        const key = `${Math.min(indices[a], indices[b])}-${Math.max(indices[a], indices[b])}`;
        const s = pairScores.get(key);
        if (s && s > maxSim) maxSim = s;
      }
    }

    const hasTask = groupItems.some((it) => it.kind === 'task');
    const hasSubtask = groupItems.some((it) => it.kind === 'subtask');
    const scope: RedundancyCluster['scope'] =
      hasTask && hasSubtask ? 'mixed' : hasSubtask ? 'subtask' : 'task';

    const reasonLabel =
      maxSim >= 0.92
        ? 'Doublon quasi exact'
        : scope === 'subtask'
        ? 'Sous-tâches similaires'
        : scope === 'mixed'
        ? 'Tâche et sous-tâche redondantes'
        : 'Tâches similaires actives';

    clusters.push({
      clusterId: `dup-${employee.id}-${rootIdx}-${groupItems[0].taskId}`,
      employeeId: String(employee.id),
      maxSimilarity: Math.round(maxSim * 100),
      scope,
      reasonLabel,
      items: groupItems,
    });
  });

  return clusters.sort((a, b) => b.maxSimilarity - a.maxSimilarity);
}

/**
 * Détection temps réel pendant la saisie dans TaskCreateModal / SubtaskCreateModal.
 */
export function findPotentialDuplicatesForInput(
  inputTitle: string,
  existingTasks: Task[],
  assigneeNames?: string[],
  threshold = 0.7
): PotentialDuplicateMatch[] {
  if (!inputTitle || inputTitle.trim().length < 4) return [];

  const normalizedAssignees = (assigneeNames || [])
    .map((n) => n.trim().toLowerCase())
    .filter((n) => n && n !== 'équipe' && n !== 'equipe');

  const matches: PotentialDuplicateMatch[] = [];

  existingTasks.forEach((t) => {
    if (t.mergedIntoTaskId) return;
    const taskAssignee = (t.assignedTo || '').toLowerCase();
    const matchesAssignee =
      normalizedAssignees.length === 0 ||
      normalizedAssignees.some((name) => taskAssignee.includes(name));

    if (matchesAssignee && t.status !== 'completed') {
      const sim = computeTitleSimilarity(inputTitle, t.title);
      if (sim >= threshold) {
        matches.push({
          uid: `task:${t.id}`,
          kind: 'task',
          taskId: t.id,
          title: t.title,
          status: t.status,
          similarity: Math.round(sim * 100),
        });
      }
    }

    (t.subtasks || []).forEach((s) => {
      if (s.mergedIntoTaskId || s.completed || s.status === 'completed') return;
      const subAssignee = (s.assignedTo || t.assignedTo || '').toLowerCase();
      const subMatchesAssignee =
        normalizedAssignees.length === 0 ||
        normalizedAssignees.some((name) => subAssignee.includes(name));

      if (subMatchesAssignee) {
        const sim = computeTitleSimilarity(inputTitle, s.title);
        if (sim >= threshold) {
          matches.push({
            uid: `sub:${t.id}:${s.id}`,
            kind: 'subtask',
            taskId: t.id,
            subtaskId: s.id,
            parentTaskTitle: t.title,
            title: s.title,
            status: s.status || 'todo',
            similarity: Math.round(sim * 100),
          });
        }
      }
    });
  });

  return matches.sort((a, b) => b.similarity - a.similarity).slice(0, 4);
}
