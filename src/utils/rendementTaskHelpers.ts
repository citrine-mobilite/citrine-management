import { Employee, Task, Subtask } from '../types';

export interface RendementPeriodFilter {
  startStr: string;
  endStr: string;
  period?: string;
}

export interface TaskTimeHistogramEntry {
  taskId: string;
  title: string;
  shortTitle: string;
  assignee: string;
  status: string;
  priority: string;
  estimatedHours: number;
  actualHours: number;
  effectiveHours: number;
  progress: number;
  isMilestone: boolean;
  subtasksCount: number;
  completedSubtasksCount: number;
  dueDate: string;
  task: Task;
}

export interface SubtaskTimeHistogramEntry {
  entryId: string;
  taskId: string;
  subtaskId?: string;
  isSubtask: boolean;
  title: string;
  shortTitle: string;
  parentTaskTitle?: string;
  assignee: string;
  status: string;
  priority: string;
  estimatedHours: number;
  actualHours: number;
  effectiveHours: number;
  progress: number;
  dateLabel: string;
  task: Task;
  subtask?: Subtask;
}

export interface EmployeeRendementMetrics {
  employee: Employee;
  assignedTasks: Task[];
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  totalSubtasks: number;
  completedSubtasks: number;
  milestonesCount: number;
  completedMilestones: number;
  estimatedHoursTotal: number;
  actualHoursTotal: number;
  effectiveHoursSpent: number;
  avgTaskProgress: number;
  topTimeTaskTitle: string | null;
  topTimeTaskHours: number;
  taskRendementRate: number;
  assiduiteRate: number;
  globalCombinedScore: number;
  capacityStatus: 'overloaded' | 'optimal' | 'available';
  hasActivity: boolean;
  periodLabel?: string;
}

export function safeNum(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === 'string') {
    const cleaned = value.trim().replace(/h$/i, '').replace(',', '.');
    if (!cleaned) return fallback;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function round1(val: number): number {
  const n = safeNum(val, 0);
  return Math.round(n * 10) / 10;
}

export function getDefaultPriorityHours(priority?: string): number {
  const p = String(priority || '').toLowerCase();
  if (p === 'urgent' || p === 'critique') return 8;
  if (p === 'high' || p === 'haut' || p === 'haute') return 6;
  if (p === 'low' || p === 'bas' || p === 'basse') return 1.5;
  return 3;
}

export function isTaskAssignedToEmployee(task: Task | Subtask, employee: Employee): boolean {
  if (task.employeeId && (task.employeeId === employee.id || String(task.employeeId) === String(employee.id))) {
    return true;
  }

  const assignedTo = (task.assignedTo || '').trim();
  if (!assignedTo) return false;

  const empName = (employee.name || '').trim().toLowerCase();
  const empEmail = (employee.email || '').trim().toLowerCase();
  const assignees = assignedTo.split(',').map((s) => s.trim().toLowerCase());

  if (assignees.some((a) => a === 'équipe' || a === "toute l'équipe" || a === 'tous')) {
    return true;
  }

  return assignees.some((a) => {
    if (!a) return false;
    if (a === empName || (empEmail && a === empEmail)) return true;
    if (empName && (empName.includes(a) || a.includes(empName))) return true;
    return false;
  });
}

export function getTaskDynamicProgress(task: Task): number {
  if (task.status === 'completed' || (task as any).completed === true) return 100;

  if (task.status === 'todo' || task.status === 'idea') {
    if (task.subtasks && task.subtasks.length > 0) {
      const completedSub = task.subtasks.filter((s) => s.completed || s.status === 'completed').length;
      return Math.min(25, Math.round((completedSub / task.subtasks.length) * 25));
    }
    return 0;
  }

  if (task.isMilestone && typeof task.milestoneProgress === 'number' && Number.isFinite(task.milestoneProgress)) {
    return Math.max(0, Math.min(90, Math.round(task.milestoneProgress)));
  }

  if (task.subtasks && task.subtasks.length > 0) {
    const completedSub = task.subtasks.filter((s) => s.completed || s.status === 'completed').length;
    const ratio = completedSub / task.subtasks.length;
    return Math.round(ratio * 85);
  }

  switch (task.status) {
    case 'pending_validation':
      return 80;
    case 'in_progress':
    case 'en_cours':
      return 50;
    case 'blocked':
      return 15;
    default:
      return 0;
  }
}

export function computeTaskTimeEntry(task: Task): TaskTimeHistogramEntry {
  const subs = Array.isArray(task.subtasks) ? task.subtasks : [];
  const taskEstimatedRaw = safeNum(task.estimatedHours, 0);
  const taskActualRaw = safeNum(task.actualHours, 0);

  let estimatedHours = taskEstimatedRaw > 0 ? taskEstimatedRaw : getDefaultPriorityHours(task.priority);
  let actualHours = taskActualRaw;

  if (subs.length > 0) {
    const subsEst = subs.reduce((sum, s) => sum + safeNum(s.estimatedHours, 1.5), 0);
    const subsAct = subs.reduce((sum, s) => sum + safeNum(s.actualHours, 0), 0);
    estimatedHours = round1(Math.max(taskEstimatedRaw, subsEst));
    actualHours = round1(subsAct > 0 ? subsAct : taskActualRaw);
  } else {
    estimatedHours = round1(estimatedHours);
    actualHours = round1(actualHours);
  }

  const progress = getTaskDynamicProgress(task);
  const effectiveHours =
    actualHours > 0
      ? actualHours
      : progress > 0
      ? round1((estimatedHours * progress) / 100)
      : 0;

  const title = (task.title || 'Tâche sans titre').trim();
  const shortTitle = title.length > 24 ? `${title.slice(0, 22)}…` : title;
  const completedSubtasksCount = subs.filter((s) => s.completed || s.status === 'completed').length;

  return {
    taskId: task.id,
    title,
    shortTitle,
    assignee: (task.assignedTo || 'Non assignée').trim(),
    status: String(task.status || 'todo'),
    priority: String(task.priority || 'medium'),
    estimatedHours,
    actualHours,
    effectiveHours,
    progress,
    isMilestone: Boolean(task.isMilestone),
    subtasksCount: subs.length,
    completedSubtasksCount,
    dueDate: task.dueDate || task.date || '',
    task,
  };
}

export function buildTaskTimeHistogramData(tasks: Task[]): TaskTimeHistogramEntry[] {
  const uniqueMap = new Map<string, Task>();
  (tasks || []).forEach((t) => {
    if (t && t.id && !uniqueMap.has(t.id)) {
      uniqueMap.set(t.id, t);
    }
  });

  return Array.from(uniqueMap.values())
    .map(computeTaskTimeEntry)
    .sort((a, b) => {
      if (b.effectiveHours !== a.effectiveHours) return b.effectiveHours - a.effectiveHours;
      if (b.actualHours !== a.actualHours) return b.actualHours - a.actualHours;
      return b.estimatedHours - a.estimatedHours;
    });
}

function getSubtaskProgress(sub: Subtask): number {
  const st = String(sub.status || '').toLowerCase();
  if (sub.completed || st === 'completed' || st === 'fait') return 100;
  if (st === 'in_progress' || st === 'en_cours') return 50;
  if (st === 'blocked' || sub.isBlocked) return 15;
  return 0;
}

export function buildSubtaskTimeHistogramData(
  tasks: Task[],
  employee?: Employee
): SubtaskTimeHistogramEntry[] {
  const uniqueMap = new Map<string, Task>();
  (tasks || []).forEach((t) => {
    if (t && t.id && !uniqueMap.has(t.id)) {
      uniqueMap.set(t.id, t);
    }
  });

  const entries: SubtaskTimeHistogramEntry[] = [];
  const seenSubIds = new Set<string>();

  Array.from(uniqueMap.values()).forEach((task) => {
    const rawSubs = Array.isArray(task.subtasks) ? task.subtasks : [];
    const parentTitle = (task.title || 'Mission sans titre').trim();

    if (rawSubs.length > 0) {
      let targetSubs = rawSubs;
      if (employee) {
        const parentAssigned = isTaskAssignedToEmployee(task, employee);
        const filtered = rawSubs.filter((s) => {
          const hasExplicitAssignee = Boolean(s.employeeId || (s.assignedTo && s.assignedTo.trim()));
          if (hasExplicitAssignee) return isTaskAssignedToEmployee(s, employee);
          return parentAssigned;
        });
        targetSubs = filtered.length > 0 ? filtered : parentAssigned ? rawSubs : [];
      }

      const taskEstRaw = safeNum(task.estimatedHours, 0);
      const taskActRaw = safeNum(task.actualHours, 0);
      const anySubHasAct = rawSubs.some((s) => safeNum(s.actualHours, 0) > 0);
      const activeSubsCount = rawSubs.filter((s) => getSubtaskProgress(s) > 0).length;
      const fallbackEstPerSub =
        taskEstRaw > 0
          ? round1(Math.max(0.5, taskEstRaw / rawSubs.length))
          : 1.5;

      targetSubs.forEach((sub, idx) => {
        const dedupKey = `${task.id}::${sub.id || idx}`;
        if (seenSubIds.has(dedupKey)) return;
        seenSubIds.add(dedupKey);

        const progress = getSubtaskProgress(sub);
        const subEstRaw = safeNum(sub.estimatedHours, 0);
        const estimatedHours = round1(subEstRaw > 0 ? subEstRaw : fallbackEstPerSub);

        const subActRaw = safeNum(sub.actualHours, 0);
        const actualHours = round1(
          subActRaw > 0
            ? subActRaw
            : !anySubHasAct && taskActRaw > 0 && progress > 0 && activeSubsCount > 0
            ? taskActRaw / activeSubsCount
            : 0
        );

        const effectiveHours =
          actualHours > 0
            ? actualHours
            : progress > 0
            ? round1((estimatedHours * progress) / 100)
            : 0;

        const title = (sub.title || 'Sous-tâche sans titre').trim();
        const shortTitle = title.length > 24 ? `${title.slice(0, 22)}…` : title;
        const rawDate =
          sub.completedAt || sub.dueDate || sub.startDate || sub.createdAt || task.dueDate || task.date || '';
        const dateLabel = typeof rawDate === 'string' ? rawDate.split('T')[0] : '';

        entries.push({
          entryId: dedupKey,
          taskId: task.id,
          subtaskId: sub.id,
          isSubtask: true,
          title,
          shortTitle,
          parentTaskTitle: parentTitle,
          assignee: (sub.assignedTo || task.assignedTo || 'Non assignée').trim(),
          status: sub.completed ? 'completed' : String(sub.status || 'todo'),
          priority: String(sub.priority || task.priority || 'medium'),
          estimatedHours,
          actualHours,
          effectiveHours,
          progress,
          dateLabel,
          task,
          subtask: sub,
        });
      });
    } else {
      const tEntry = computeTaskTimeEntry(task);
      const rawDate = task.completedAt || task.dueDate || task.date || '';
      const dateLabel = typeof rawDate === 'string' ? rawDate.split('T')[0] : '';

      entries.push({
        entryId: task.id,
        taskId: task.id,
        isSubtask: false,
        title: tEntry.title,
        shortTitle: tEntry.shortTitle,
        assignee: tEntry.assignee,
        status: tEntry.status,
        priority: tEntry.priority,
        estimatedHours: tEntry.estimatedHours,
        actualHours: tEntry.actualHours,
        effectiveHours: tEntry.effectiveHours,
        progress: tEntry.progress,
        dateLabel,
        task,
      });
    }
  });

  return entries.sort((a, b) => {
    if (b.effectiveHours !== a.effectiveHours) return b.effectiveHours - a.effectiveHours;
    if (b.actualHours !== a.actualHours) return b.actualHours - a.actualHours;
    return b.estimatedHours - a.estimatedHours;
  });
}

export function getItemCompletionDate(item: Task | Subtask, fallbackParentDate?: string): string | null {
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
