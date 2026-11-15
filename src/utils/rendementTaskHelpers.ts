import { Employee, Task, Subtask } from '../types';

export interface RendementPeriodFilter {
  startStr: string;
  endStr: string;
  period?: string;
}

export interface EmployeeRendementMetrics {
  employee: Employee;
  assignedTasks: Task[];
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  totalSubtasks: number;
  completedSubtasks: number;
  milestonesCount: number;
  completedMilestones: number;
  estimatedHoursTotal: number;
  actualHoursTotal: number;
  taskRendementRate: number;
  assiduiteRate: number;
  globalCombinedScore: number;
  capacityStatus: 'overloaded' | 'optimal' | 'available';
  hasActivity: boolean;
  periodLabel?: string;
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
    if (empName.includes(a) || a.includes(empName)) return true;
    return false;
  });
}

export function getTaskDynamicProgress(task: Task): number {
  if (task.status === 'completed') return 100;

  if (task.status === 'todo' || task.status === 'idea') {
    if (task.subtasks && task.subtasks.length > 0) {
      const completedSub = task.subtasks.filter((s) => s.completed || s.status === 'completed').length;
      return Math.min(25, Math.round((completedSub / task.subtasks.length) * 25));
    }
    return 0;
  }

  if (task.isMilestone && typeof task.milestoneProgress === 'number') {
    return Math.max(0, Math.min(90, task.milestoneProgress));
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
