import { Task } from '../../../../types';
import { StatusFilter, DurationFilter, PeriodFilter } from './useEmployeeRendementLogic';

export function computeRendementPeriodRange(periodFilter: PeriodFilter, todayStr: string, now: Date) {
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
  return undefined;
}

export function filterRendementTasks<T extends Task & { estimatedHours: number }>(params: {
  tasks: T[];
  statusFilter: StatusFilter;
  durationFilter: DurationFilter;
  periodFilter: PeriodFilter;
  searchQuery: string;
  todayStr: string;
  sevenDaysAgo: string;
  thirtyDaysAgo: string;
  ninetyDaysAgo: string;
}): T[] {
  const { tasks, statusFilter, durationFilter, periodFilter, searchQuery, todayStr, sevenDaysAgo, thirtyDaysAgo, ninetyDaysAgo } = params;
  return tasks.filter((task) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'todo' && task.status !== 'todo' && task.status !== 'idea') return false;
      if (statusFilter === 'in_progress' && task.status !== 'in_progress' && task.status !== 'en_cours') return false;
      if (statusFilter === 'pending_validation' && task.status !== 'pending_validation' && (task.status as any) !== 'review') return false;
      if (statusFilter === 'blocked' && task.status !== 'blocked') return false;
      if (statusFilter === 'completed' && task.status !== 'completed') return false;
    }
    if (durationFilter !== 'all') {
      const hours = task.estimatedHours;
      if (durationFilter === 'short' && hours >= 2) return false;
      if (durationFilter === 'medium' && (hours < 2 || hours > 5)) return false;
      if (durationFilter === 'long' && hours <= 5) return false;
    }
    if (periodFilter !== 'all') {
      const tDate = task.date || task.dueDate || task.createdAt || '';
      if (tDate) {
        if (periodFilter === 'today' && !tDate.startsWith(todayStr)) return false;
        if (periodFilter === 'week' && tDate < sevenDaysAgo) return false;
        if (periodFilter === 'month' && tDate < thirtyDaysAgo) return false;
        if (periodFilter === 'quarter' && tDate < ninetyDaysAgo) return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!task.title.toLowerCase().includes(q) && !(task.description || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });
}
