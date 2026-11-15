import { Task } from '../../../../types';
import { DEFAULT_TASK_PROJECTS } from '../../../tasks/taskConstants';

export type StatusFilter = 'all' | 'todo' | 'in_progress' | 'pending_validation' | 'blocked' | 'completed';
export type DurationFilter = 'all' | 'short' | 'medium' | 'long';
export type PeriodFilter = 'all' | 'today' | 'week' | 'month' | 'quarter' | 'custom';
export type PriorityFilter = 'all' | 'urgent' | 'high' | 'medium' | 'low';
export type KindFilter =
  | 'all'
  | 'milestone'
  | 'standard'
  | 'overdue'
  | 'blocked_or_incident'
  | 'with_subtasks';
export type SortByFilter = 'recent' | 'priority' | 'progress_desc' | 'progress_asc' | 'duration_desc' | 'due_date';

export interface RendementProjectOption {
  value: string;
  label: string;
}

export function extractRendementProjectOptions(tasks: Task[]): RendementProjectOption[] {
  const map = new Map<string, string>();
  const knownById = new Map(DEFAULT_TASK_PROJECTS.map((p) => [p.id, p.name]));

  tasks.forEach((t) => {
    const rawKey = t.projectId || t.category;
    if (rawKey && rawKey.trim()) {
      const key = rawKey.trim();
      if (!map.has(key)) {
        map.set(key, knownById.get(key) || key);
      }
    }
  });

  return Array.from(map.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
}

export function computeRendementPeriodRange(
  periodFilter: PeriodFilter,
  todayStr: string,
  now: Date,
  customStartDate?: string,
  customEndDate?: string
) {
  const pad = (n: number) => String(n).padStart(2, '0');
  if (periodFilter === 'all') return undefined;
  if (periodFilter === 'today') return { startStr: todayStr, endStr: todayStr, period: 'today' };
  if (periodFilter === 'week') {
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    return { startStr: `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`, endStr: todayStr, period: 'this_week' };
  }
  if (periodFilter === 'month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startStr: `${firstDay.getFullYear()}-${pad(firstDay.getMonth() + 1)}-${pad(firstDay.getDate())}`, endStr: todayStr, period: 'this_month' };
  }
  if (periodFilter === 'quarter') {
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    return { startStr: `${threeMonthsAgo.getFullYear()}-${pad(threeMonthsAgo.getMonth() + 1)}-${pad(threeMonthsAgo.getDate())}`, endStr: todayStr, period: 'last_3_months' };
  }
  if (periodFilter === 'custom' && (customStartDate || customEndDate)) {
    const startStr = customStartDate || '2000-01-01';
    const endStr = customEndDate || '2099-12-31';
    return { startStr: startStr <= endStr ? startStr : endStr, endStr: startStr <= endStr ? endStr : startStr, period: 'custom' };
  }
  return undefined;
}

const PRIORITY_WEIGHT: Record<string, number> = {
  urgent: 4,
  high: 3,
  haut: 3,
  medium: 2,
  low: 1,
};

export function filterAndSortRendementTasks<T extends Task & { estimatedHours: number; dynamicProgress: number }>(params: {
  tasks: T[];
  statusFilter: StatusFilter;
  priorityFilter: PriorityFilter;
  projectFilter: string;
  kindFilter: KindFilter;
  durationFilter: DurationFilter;
  periodFilter: PeriodFilter;
  customStartDate: string;
  customEndDate: string;
  sortBy: SortByFilter;
  searchQuery: string;
  todayStr: string;
  sevenDaysAgo: string;
  thirtyDaysAgo: string;
  ninetyDaysAgo: string;
}): T[] {
  const {
    tasks, statusFilter, priorityFilter, projectFilter, kindFilter, durationFilter,
    periodFilter, customStartDate, customEndDate, sortBy, searchQuery,
    todayStr, sevenDaysAgo, thirtyDaysAgo, ninetyDaysAgo,
  } = params;

  const filtered = tasks.filter((task) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'todo' && task.status !== 'todo' && task.status !== 'idea') return false;
      if (statusFilter === 'in_progress' && task.status !== 'in_progress' && task.status !== 'en_cours') return false;
      if (statusFilter === 'pending_validation' && task.status !== 'pending_validation' && (task.status as string) !== 'review') return false;
      if (statusFilter === 'blocked' && task.status !== 'blocked') return false;
      if (statusFilter === 'completed' && task.status !== 'completed') return false;
    }

    if (priorityFilter !== 'all') {
      const p = String(task.priority || 'medium').toLowerCase();
      if (priorityFilter === 'high' && p !== 'high' && p !== 'haut') return false;
      if (priorityFilter !== 'high' && p !== priorityFilter) return false;
    }

    if (projectFilter !== 'all') {
      const key = (task.projectId || task.category || '').trim();
      if (projectFilter === 'none' && key !== '') return false;
      if (projectFilter !== 'none' && key !== projectFilter) return false;
    }

    if (kindFilter !== 'all') {
      const hasSubtasks = Boolean(task.subtasks && task.subtasks.length > 0);
      const hasIncident = Boolean(
        task.status === 'blocked' ||
          (task.incidents && task.incidents.some((inc) => !inc.resolved)) ||
          (task.subtasks && task.subtasks.some((s) => s.isBlocked || s.status === 'blocked'))
      );
      const isOverdue = Boolean(
        task.dueDate && task.dueDate < todayStr && task.status !== 'completed'
      );
      if (kindFilter === 'milestone' && !task.isMilestone) return false;
      if (kindFilter === 'standard' && task.isMilestone) return false;
      if (kindFilter === 'overdue' && !isOverdue) return false;
      if (kindFilter === 'blocked_or_incident' && !hasIncident) return false;
      if (kindFilter === 'with_subtasks' && !hasSubtasks) return false;
    }

    if (durationFilter !== 'all') {
      const hours = task.estimatedHours;
      if (durationFilter === 'short' && hours >= 2) return false;
      if (durationFilter === 'medium' && (hours < 2 || hours > 5)) return false;
      if (durationFilter === 'long' && hours <= 5) return false;
    }

    if (periodFilter !== 'all') {
      const tDate = (task.date || task.dueDate || task.createdAt || '').slice(0, 10);
      if (periodFilter === 'custom') {
        if (customStartDate && (!tDate || tDate < customStartDate)) return false;
        if (customEndDate && (!tDate || tDate > customEndDate)) return false;
      } else if (tDate) {
        if (periodFilter === 'today' && !tDate.startsWith(todayStr)) return false;
        if (periodFilter === 'week' && tDate < sevenDaysAgo) return false;
        if (periodFilter === 'month' && tDate < thirtyDaysAgo) return false;
        if (periodFilter === 'quarter' && tDate < ninetyDaysAgo) return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const subMatch = (task.subtasks || []).some(
        (s) => s.title.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q)
      );
      const mainMatch =
        task.title.toLowerCase().includes(q) ||
        (task.description || '').toLowerCase().includes(q) ||
        (task.category || '').toLowerCase().includes(q) ||
        (task.projectId || '').toLowerCase().includes(q) ||
        (task.milestoneTarget || '').toLowerCase().includes(q);
      if (!mainMatch && !subMatch) return false;
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    if (sortBy === 'priority') {
      const diff = (PRIORITY_WEIGHT[b.priority] || 2) - (PRIORITY_WEIGHT[a.priority] || 2);
      if (diff !== 0) return diff;
    } else if (sortBy === 'progress_desc') {
      const diff = b.dynamicProgress - a.dynamicProgress;
      if (diff !== 0) return diff;
    } else if (sortBy === 'progress_asc') {
      const diff = a.dynamicProgress - b.dynamicProgress;
      if (diff !== 0) return diff;
    } else if (sortBy === 'duration_desc') {
      const diff = b.estimatedHours - a.estimatedHours;
      if (diff !== 0) return diff;
    } else if (sortBy === 'due_date') {
      const dA = a.dueDate || a.date || '9999-12-31';
      const dB = b.dueDate || b.date || '9999-12-31';
      if (dA !== dB) return dA.localeCompare(dB);
    }
    const dateA = a.date || a.createdAt || a.dueDate || '';
    const dateB = b.date || b.createdAt || b.dueDate || '';
    return dateB.localeCompare(dateA);
  });
}
