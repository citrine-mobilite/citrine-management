import { useState, useMemo, useRef } from 'react';
import { Employee, NotificationLog, Task, Subtask, TaskStatus, Reminder, StrategicProject } from '../../../../types';
import { haptic } from '../../../../services/hapticService';
import { computeEmployeeRendement, getTaskDynamicProgress } from '../../../../utils/rendementCalculator';
import { computeTaskTimeEntry, round1, safeNum } from '../../../../utils/rendementTaskHelpers';
import { notifyExceptionalTaskCompletion } from '../../../../services/exceptionalTaskCompletionService';
import {
  StatusFilter,
  DurationFilter,
  PeriodFilter,
  PriorityFilter,
  KindFilter,
  SortByFilter,
  computeRendementPeriodRange,
  extractRendementProjectOptions,
  filterAndSortRendementTasks,
} from './employeeRendementHelpers';

export type { StatusFilter, DurationFilter, PeriodFilter, PriorityFilter, KindFilter, SortByFilter };

interface UseEmployeeRendementLogicParams {
  employee: Employee;
  tasks: Task[];
  assiduiteRate: number;
  reminders?: Reminder[];
  strategicProjects?: StrategicProject[];
  notifications?: NotificationLog[];
  onUpdateTask?: (updatedTask: Task) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export function useEmployeeRendementLogic({
  employee,
  tasks,
  assiduiteRate,
  reminders = [],
  strategicProjects = [],
  notifications = [],
  onUpdateTask,
  showToast,
}: UseEmployeeRendementLogicParams) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState<SortByFilter>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [limitToTen, setLimitToTen] = useState(true);

  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newSubtaskTitles, setNewSubtaskTitles] = useState<{ [taskId: string]: string }>({});
  const [newSubtaskDueDates, setNewSubtaskDueDates] = useState<{ [taskId: string]: string }>({});
  const [activeModalTask, setActiveModalTask] = useState<Task | null>(null);

  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const [taskSheetMode, setTaskSheetMode] = useState<'day' | 'month' | 'year'>('month');

  const taskDetailSectionRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const periodRange = useMemo(
    () => computeRendementPeriodRange(periodFilter, todayStr, now, customStartDate, customEndDate),
    [periodFilter, todayStr, customStartDate, customEndDate]
  );

  const metrics = useMemo(() => {
    return computeEmployeeRendement(employee, tasks, safeNum(assiduiteRate, 100), periodRange, {
      reminders,
      strategicProjects,
      notifications,
    });
  }, [employee, tasks, assiduiteRate, periodRange, reminders, strategicProjects, notifications]);

  const tasksWithDynamicData = useMemo(() => {
    return metrics.assignedTasks.map((t) => {
      const timeEntry = computeTaskTimeEntry(t);
      return {
        ...t,
        estimatedHours: timeEntry.estimatedHours,
        actualHours: timeEntry.actualHours,
        effectiveHours: timeEntry.effectiveHours,
        dynamicProgress: getTaskDynamicProgress(t),
      };
    });
  }, [metrics.assignedTasks]);

  const projectOptions = useMemo(() => extractRendementProjectOptions(tasksWithDynamicData), [tasksWithDynamicData]);

  const sortedByRecencyTasks = useMemo(
    () =>
      filterAndSortRendementTasks({
        tasks: tasksWithDynamicData,
        statusFilter,
        priorityFilter,
        projectFilter,
        kindFilter,
        durationFilter,
        periodFilter,
        customStartDate,
        customEndDate,
        sortBy,
        searchQuery,
        todayStr,
        sevenDaysAgo,
        thirtyDaysAgo,
        ninetyDaysAgo,
      }),
    [
      tasksWithDynamicData, statusFilter, priorityFilter, projectFilter, kindFilter, durationFilter,
      periodFilter, customStartDate, customEndDate, sortBy, searchQuery,
      todayStr, sevenDaysAgo, thirtyDaysAgo, ninetyDaysAgo,
    ]
  );

  const filteredSummary = useMemo(() => {
    const count = sortedByRecencyTasks.length;
    const totalHours = round1(sortedByRecencyTasks.reduce((acc, t) => acc + safeNum(t.estimatedHours), 0));
    const completedCount = sortedByRecencyTasks.filter((t) => t.status === 'completed').length;
    const avgProgress =
      count > 0
        ? Math.round(sortedByRecencyTasks.reduce((acc, t) => acc + safeNum(t.dynamicProgress), 0) / count)
        : 0;
    return { count, totalHours, completedCount, avgProgress };
  }, [sortedByRecencyTasks]);

  const displayedTasks = useMemo(() => {
    return limitToTen ? sortedByRecencyTasks.slice(0, 10) : sortedByRecencyTasks;
  }, [sortedByRecencyTasks, limitToTen]);

  const hasActiveFilters =
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    projectFilter !== 'all' ||
    kindFilter !== 'all' ||
    durationFilter !== 'all' ||
    periodFilter !== 'all' ||
    sortBy !== 'recent' ||
    searchQuery.trim() !== '';

  const resetFilters = () => {
    haptic.light();
    setStatusFilter('all');
    setPriorityFilter('all');
    setProjectFilter('all');
    setKindFilter('all');
    setDurationFilter('all');
    setPeriodFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortBy('recent');
    setSearchQuery('');
  };

  const openTaskSheet = (mode: 'day' | 'month' | 'year') => {
    haptic.light();
    setTaskSheetMode(mode);
    setIsTaskSheetOpen(true);
  };

  const handleSelectFromPyramid = (taskId: string) => {
    setExpandedTaskId(taskId);
    taskDetailSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCreateSubtaskFromModal = (newSub: Subtask) => {
    if (!activeModalTask) return;
    const updatedSubtasks = [newSub, ...(activeModalTask.subtasks || [])];
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
      showToast?.(`ACCOMPLISSEMENT : ${employee.name} a terminé "${task.title}".`, 'success');
    } else {
      showToast?.('Rendement recalculé et sous-tâche mise à jour.', 'success');
    }
  };

  const handleAddSubtask = (task: Task) => {
    const title = (newSubtaskTitles[task.id] || '').trim();
    if (!title) return;
    haptic.medium();
    const nowIso = new Date().toISOString();
    const taskSubDueDate = newSubtaskDueDates[task.id] || todayStr;
    const newSub: Subtask = {
      id: `sub-${Date.now()}`,
      title,
      completed: false,
      status: 'todo',
      startDate: todayStr,
      dueDate: taskSubDueDate,
      endDate: taskSubDueDate,
      estimatedHours: 2,
      createdAt: nowIso,
      subtasks: [],
    };
    const updatedSubtasks = [newSub, ...(task.subtasks || [])];
    const newStatus = task.status === 'completed' ? 'in_progress' : task.status;
    onUpdateTask?.({ ...task, status: newStatus, subtasks: updatedSubtasks, lastUpdatedTime: nowIso });
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
      showToast?.(`ACCOMPLISSEMENT : ${employee.name} a validé "${task.title}".`, 'success');
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
    statusFilter, setStatusFilter, priorityFilter, setPriorityFilter,
    projectFilter, setProjectFilter, kindFilter, setKindFilter,
    durationFilter, setDurationFilter, periodFilter, setPeriodFilter,
    customStartDate, setCustomStartDate, customEndDate, setCustomEndDate,
    sortBy, setSortBy, searchQuery, setSearchQuery,
    limitToTen, setLimitToTen, expandedTaskId, setExpandedTaskId,
    newSubtaskTitles, setNewSubtaskTitles, newSubtaskDueDates, setNewSubtaskDueDates,
    activeModalTask, setActiveModalTask, isTaskSheetOpen, setIsTaskSheetOpen, taskSheetMode,
    taskDetailSectionRef, todayStr, metrics, tasksWithDynamicData, projectOptions,
    sortedByRecencyTasks, filteredSummary, displayedTasks,
    hasActiveFilters, resetFilters, openTaskSheet, handleSelectFromPyramid,
    handleCreateSubtaskFromModal, handleToggleSubtask, handleAddSubtask,
    handleUpdateSubtaskDueDate, handleDeleteSubtask, handleStatusChange, handleMilestoneProgressChange,
  };
}
