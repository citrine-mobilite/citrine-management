import { useState, useMemo, useRef } from 'react';
import { Employee, Task, Subtask, TaskStatus } from '../../../../types';
import { haptic } from '../../../../services/hapticService';
import { computeEmployeeRendement, getTaskDynamicProgress } from '../../../../utils/rendementCalculator';
import { notifyExceptionalTaskCompletion } from '../../../../services/exceptionalTaskCompletionService';
import { computeRendementPeriodRange, filterRendementTasks } from './employeeRendementHelpers';

export type StatusFilter = 'all' | 'todo' | 'in_progress' | 'pending_validation' | 'blocked' | 'completed';
export type DurationFilter = 'all' | 'short' | 'medium' | 'long';
export type PeriodFilter = 'all' | 'today' | 'week' | 'month' | 'quarter';

interface UseEmployeeRendementLogicParams {
  employee: Employee;
  tasks: Task[];
  assiduiteRate: number;
  onUpdateTask?: (updatedTask: Task) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export function useEmployeeRendementLogic({
  employee,
  tasks,
  assiduiteRate,
  onUpdateTask,
  showToast,
}: UseEmployeeRendementLogicParams) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [limitToTen, setLimitToTen] = useState(true);

  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newSubtaskTitles, setNewSubtaskTitles] = useState<{ [taskId: string]: string }>({});
  const [newSubtaskDueDates, setNewSubtaskDueDates] = useState<{ [taskId: string]: string }>({});
  const [activeModalTask, setActiveModalTask] = useState<Task | null>(null);

  const [isTimesheetOpen, setIsTimesheetOpen] = useState(false);
  const [timesheetMode, setTimesheetMode] = useState<'day' | 'month' | 'year'>('month');

  const taskDetailSectionRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const periodRange = useMemo(
    () => computeRendementPeriodRange(periodFilter, todayStr, now),
    [periodFilter, todayStr]
  );

  const metrics = useMemo(() => {
    return computeEmployeeRendement(employee, tasks, assiduiteRate, periodRange);
  }, [employee, tasks, assiduiteRate, periodRange]);

  const tasksWithDynamicData = useMemo(() => {
    return metrics.assignedTasks.map((t) => {
      let estimatedHours = 4;
      if (t.priority === 'urgent') estimatedHours = 10;
      else if (t.priority === 'high' || t.priority === 'haut') estimatedHours = 7;
      else if (t.priority === 'low') estimatedHours = 2;

      if (t.subtasks && t.subtasks.length > 0) {
        const subHours = t.subtasks.reduce((sum, s) => sum + (s.estimatedHours || 2), 0);
        estimatedHours = Math.max(estimatedHours, subHours);
      }

      return { ...t, estimatedHours, dynamicProgress: getTaskDynamicProgress(t) };
    });
  }, [metrics.assignedTasks]);

  const filteredTasks = useMemo(
    () =>
      filterRendementTasks({
        tasks: tasksWithDynamicData,
        statusFilter,
        durationFilter,
        periodFilter,
        searchQuery,
        todayStr,
        sevenDaysAgo,
        thirtyDaysAgo,
        ninetyDaysAgo,
      }),
    [tasksWithDynamicData, statusFilter, durationFilter, periodFilter, searchQuery, todayStr, sevenDaysAgo, thirtyDaysAgo, ninetyDaysAgo]
  );

  const sortedByRecencyTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      const dateA = a.date || a.createdAt || a.dueDate || '';
      const dateB = b.date || b.createdAt || b.dueDate || '';
      return dateB.localeCompare(dateA);
    });
  }, [filteredTasks]);

  const displayedTasks = useMemo(() => {
    return limitToTen ? sortedByRecencyTasks.slice(0, 10) : sortedByRecencyTasks;
  }, [sortedByRecencyTasks, limitToTen]);

  const hasActiveFilters = statusFilter !== 'all' || durationFilter !== 'all' || periodFilter !== 'all' || searchQuery.trim() !== '';

  const resetFilters = () => {
    haptic.light();
    setStatusFilter('all');
    setDurationFilter('all');
    setPeriodFilter('all');
    setSearchQuery('');
  };

  const openTimesheet = (mode: 'day' | 'month' | 'year') => {
    haptic.light();
    setTimesheetMode(mode);
    setIsTimesheetOpen(true);
  };

  const handleSelectFromPyramid = (taskId: string) => {
    setExpandedTaskId(taskId);
    taskDetailSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCreateSubtaskFromModal = (newSub: Subtask) => {
    if (!activeModalTask) return;
    const updatedSubtasks = [...(activeModalTask.subtasks || []), newSub];
    const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.completed || s.status === 'completed');
    const newStatus = allCompleted && activeModalTask.status !== 'completed' ? 'completed' : activeModalTask.status;
    onUpdateTask?.({ ...activeModalTask, status: newStatus, subtasks: updatedSubtasks, lastUpdatedTime: new Date().toISOString() });
    showToast?.(`Sous-tâche "${newSub.title}" créée avec succès !`, 'success');
    setActiveModalTask(null);
  };

  const handleToggleSubtask = (task: Task, subtaskId: string) => {
    haptic.light();
    const updatedSubtasks = (task.subtasks || []).map((sub) =>
      sub.id === subtaskId ? { ...sub, completed: !sub.completed, status: !sub.completed ? ('completed' as TaskStatus) : ('todo' as TaskStatus) } : sub
    );
    const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.completed || s.status === 'completed');
    let newStatus = task.status;
    let becameCompleted = false;
    if (allCompleted && task.status !== 'completed') {
      newStatus = 'completed';
      becameCompleted = true;
    } else if (!allCompleted && task.status === 'completed') {
      newStatus = 'in_progress';
    }
    const updatedTask: Task = { ...task, status: newStatus, subtasks: updatedSubtasks, lastUpdatedTime: new Date().toISOString() };
    onUpdateTask?.(updatedTask);
    if (becameCompleted) {
      notifyExceptionalTaskCompletion(updatedTask, employee.name);
      showToast?.(`🏆 ACCOMPLISSEMENT EXCEPTIONNEL ! ${employee.name} a terminé la tâche complète "${task.title}". Les responsables et l'IT sont notifiés par push.`, 'success');
    } else {
      showToast?.('Rendement recalculé et sous-tâche mise à jour.', 'success');
    }
  };

  const handleAddSubtask = (task: Task) => {
    const title = (newSubtaskTitles[task.id] || '').trim();
    if (!title) return;
    haptic.medium();
    const taskSubDueDate = newSubtaskDueDates[task.id] || todayStr;
    const newSub: Subtask = { id: `sub-${Date.now()}`, title, completed: false, status: 'todo', dueDate: taskSubDueDate, endDate: taskSubDueDate, estimatedHours: 2 };
    const updatedSubtasks = [...(task.subtasks || []), newSub];
    const newStatus = task.status === 'completed' ? 'in_progress' : task.status;
    onUpdateTask?.({ ...task, status: newStatus, subtasks: updatedSubtasks, lastUpdatedTime: new Date().toISOString() });
    setNewSubtaskTitles({ ...newSubtaskTitles, [task.id]: '' });
    showToast?.('Sous-tâche ajoutée et rendement recalculé.', 'success');
  };

  const handleUpdateSubtaskDueDate = (task: Task, subtaskId: string, newDueDate: string) => {
    haptic.light();
    const updatedSubtasks = (task.subtasks || []).map((sub) => (sub.id === subtaskId ? { ...sub, dueDate: newDueDate, endDate: newDueDate } : sub));
    onUpdateTask?.({ ...task, subtasks: updatedSubtasks, lastUpdatedTime: new Date().toISOString() });
    showToast?.("Date d'échéance de la sous-tâche mise à jour.", 'success');
  };

  const handleDeleteSubtask = (task: Task, subtaskId: string) => {
    haptic.light();
    onUpdateTask?.({ ...task, subtasks: (task.subtasks || []).filter((sub) => sub.id !== subtaskId), lastUpdatedTime: new Date().toISOString() });
    showToast?.('Sous-tâche supprimée.', 'success');
  };

  const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
    haptic.medium();
    const wasCompleted = task.status === 'completed';
    const isNowCompleted = newStatus === 'completed';
    let updatedSubtasks = task.subtasks;
    if (isNowCompleted && updatedSubtasks && updatedSubtasks.length > 0) {
      updatedSubtasks = updatedSubtasks.map((s) => ({ ...s, completed: true, status: 'completed' as TaskStatus }));
    }
    const updatedTask: Task = { ...task, status: newStatus, subtasks: updatedSubtasks, lastUpdatedTime: new Date().toISOString() };
    onUpdateTask?.(updatedTask);
    if (isNowCompleted && !wasCompleted) {
      notifyExceptionalTaskCompletion(updatedTask, employee.name);
      showToast?.(`🏆 ACCOMPLISSEMENT EXCEPTIONNEL ! ${employee.name} a validé la tâche complète "${task.title}". Les responsables et l'IT sont notifiés par push.`, 'success');
    } else {
      showToast?.(`Statut mis à jour : ${newStatus} (Rendement actualisé).`, 'success');
    }
  };

  const handleMilestoneProgressChange = (task: Task, progress: number) => {
    const clamped = Math.max(0, Math.min(100, progress));
    const isNowDone = clamped === 100;
    onUpdateTask?.({
      ...task,
      milestoneProgress: clamped,
      status: isNowDone ? 'completed' : task.status === 'completed' ? 'in_progress' : task.status,
      lastUpdatedTime: new Date().toISOString(),
    });
  };

  return {
    statusFilter, setStatusFilter, durationFilter, setDurationFilter, periodFilter, setPeriodFilter,
    searchQuery, setSearchQuery, limitToTen, setLimitToTen, expandedTaskId, setExpandedTaskId,
    newSubtaskTitles, setNewSubtaskTitles, newSubtaskDueDates, setNewSubtaskDueDates,
    activeModalTask, setActiveModalTask, isTimesheetOpen, setIsTimesheetOpen, timesheetMode,
    taskDetailSectionRef, todayStr, metrics, tasksWithDynamicData, sortedByRecencyTasks, displayedTasks,
    hasActiveFilters, resetFilters, openTimesheet, handleSelectFromPyramid, handleCreateSubtaskFromModal,
    handleToggleSubtask, handleAddSubtask, handleUpdateSubtaskDueDate, handleDeleteSubtask,
    handleStatusChange, handleMilestoneProgressChange,
  };
}
