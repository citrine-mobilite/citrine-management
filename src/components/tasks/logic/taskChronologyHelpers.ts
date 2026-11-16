import { Subtask, Task, TaskPriority, TaskStatus } from '../../../types';

export interface ChronologicalTimelineEntry {
  rowKey: string;
  id: string;
  kind: 'task' | 'subtask';
  task: Task;
  subtask?: Subtask;
  subtaskPath: string[];
  depth: number;
  parentTrail: string;
  title: string;
  assignee: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string;
  endDate: string;
  time: string;
  completed: boolean;
  isBlocked: boolean;
  isMilestone: boolean;
  dependsOnIds: string[];
}

export function normalizeIsoDate(raw?: string, fallback?: string): string {
  if (raw && typeof raw === 'string') {
    const trimmed = raw.trim();
    const isoPrefix = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoPrefix) return isoPrefix[1];

    const frMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (frMatch) return `${frMatch[3]}-${frMatch[2]}-${frMatch[1]}`;

    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }
  return fallback || new Date().toISOString().split('T')[0];
}

export function normalizeTimeString(raw?: string, fallback: string = '09:00'): string {
  if (raw && typeof raw === 'string') {
    const match = raw.trim().match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      return `${match[1].padStart(2, '0')}:${match[2]}`;
    }
  }
  return fallback;
}

export function compareChronologicalEntries(
  a: Pick<ChronologicalTimelineEntry, 'startDate' | 'endDate' | 'time' | 'depth' | 'title'>,
  b: Pick<ChronologicalTimelineEntry, 'startDate' | 'endDate' | 'time' | 'depth' | 'title'>
): number {
  const dateCmp = a.startDate.localeCompare(b.startDate);
  if (dateCmp !== 0) return dateCmp;

  const timeCmp = a.time.localeCompare(b.time);
  if (timeCmp !== 0) return timeCmp;

  const endCmp = a.endDate.localeCompare(b.endDate);
  if (endCmp !== 0) return endCmp;

  if (a.depth !== b.depth) return a.depth - b.depth;
  return a.title.localeCompare(b.title, 'fr');
}

export function flattenSubtasksChronologically(
  parentTask: Task,
  subtasks: Subtask[] | undefined,
  parentPath: string[],
  parentTrail: string,
  depth: number,
  todayIso: string
): ChronologicalTimelineEntry[] {
  if (!subtasks || subtasks.length === 0) return [];

  const entries: ChronologicalTimelineEntry[] = [];
  const parentStart = normalizeIsoDate(parentTask.startDate || parentTask.date || parentTask.createdAt, todayIso);
  const parentEnd = normalizeIsoDate(parentTask.dueDate || parentTask.date || parentStart, parentStart);
  const parentTime = normalizeTimeString(parentTask.time, '09:00');

  for (const sub of subtasks) {
    const path = [...parentPath, sub.id];
    const rawStart = sub.startDate || sub.createdAt || parentStart;
    const rawEnd = sub.dueDate || sub.endDate || parentEnd;
    const startDate = normalizeIsoDate(rawStart, parentStart);
    const endDateRaw = normalizeIsoDate(rawEnd, startDate);
    const endDate = endDateRaw < startDate ? startDate : endDateRaw;
    const time = normalizeTimeString(sub.time, parentTime);

    entries.push({
      rowKey: `sub:${parentTask.id}:${path.join('/')}`,
      id: sub.id,
      kind: 'subtask',
      task: parentTask,
      subtask: sub,
      subtaskPath: path,
      depth,
      parentTrail,
      title: sub.title,
      assignee: sub.assignedTo || parentTask.assignedTo || 'Équipe',
      priority: sub.priority || parentTask.priority || 'medium',
      status: sub.status || (sub.completed ? 'completed' : 'todo'),
      startDate,
      endDate,
      time,
      completed: Boolean(sub.completed || sub.status === 'completed'),
      isBlocked: Boolean(sub.isBlocked || sub.status === 'blocked'),
      isMilestone: false,
      dependsOnIds: sub.dependsOnIds || [],
    });

    if (sub.subtasks && sub.subtasks.length > 0) {
      entries.push(
        ...flattenSubtasksChronologically(
          parentTask,
          sub.subtasks,
          path,
          `${parentTrail} › ${sub.title}`,
          depth + 1,
          todayIso
        )
      );
    }
  }

  return entries;
}

export function flattenAllTasksAndSubtasksChronologically(
  tasks: Task[],
  todayIso: string,
  includeSubtasks: boolean = true
): ChronologicalTimelineEntry[] {
  const all: ChronologicalTimelineEntry[] = [];

  for (const task of tasks) {
    const startDate = normalizeIsoDate(task.startDate || task.date || task.createdAt, todayIso);
    const endDateRaw = normalizeIsoDate(task.dueDate || task.date || startDate, startDate);
    const endDate = endDateRaw < startDate ? startDate : endDateRaw;
    const time = normalizeTimeString(task.time, '09:00');

    all.push({
      rowKey: `task:${task.id}`,
      id: task.id,
      kind: 'task',
      task,
      subtaskPath: [],
      depth: 0,
      parentTrail: '',
      title: task.title,
      assignee: task.assignedTo || 'Équipe',
      priority: task.priority || 'medium',
      status: task.status || 'todo',
      startDate,
      endDate,
      time,
      completed: task.status === 'completed',
      isBlocked: task.status === 'blocked' || Boolean(task.isBlocked),
      isMilestone: Boolean(task.isMilestone),
      dependsOnIds: task.dependsOnIds || [],
    });

    if (includeSubtasks && task.subtasks && task.subtasks.length > 0) {
      all.push(
        ...flattenSubtasksChronologically(task, task.subtasks, [], task.title, 1, todayIso)
      );
    }
  }

  return all.sort(compareChronologicalEntries);
}
