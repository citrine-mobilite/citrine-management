import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Task,
  NotificationLog,
  Employee,
  TaskStatus,
  TaskProject,
  AppUser,
  Subtask,
  PersonalTaskBucket,
  TaskCustomFieldDef,
  TaskSection,
  Reminder,
} from '../../types';
import {
  DEFAULT_PROJECT_RULES,
  DEFAULT_PROJECT_SECTIONS,
  DEFAULT_TASK_PROJECTS,
} from './taskConstants';
import { taskService } from '../../services/taskService';
import { COLLECTIONS, saveDocument, subscribeToCollection } from '../../services/dataService';
import { executeDeleteWithSweetAlert, executeOperationWithLoading } from '../../utils/sweetAlert';
import { isSelfOnlyUser } from '../../utils/roleUtils';
import { computeTaskVisibilityScope, filterTasksByCriteria } from './logic/taskFilterHelpers';
import { executeSendManualTaskSheet } from './logic/taskManualTaskSheetHelper';
import { logSystemAudit } from '../../services/adminAuditService';
import {
  confirmDeleteTaskWithPrompt,
  createNewProjectAction,
  createNewTaskAction,
  deleteTaskWithSweetAlert,
} from './logic/taskCrudHelpers';
import { changeTaskStatusAction, saveUpdatedTaskAction } from './logic/taskStatusHelpers';
import { notifyExceptionalTaskCompletion } from '../../services/exceptionalTaskCompletionService';
import {
  addSubtaskToTaskAtPath,
  computeNextRecurrenceDate,
  deleteSubtaskAtPath,
  findSubtaskByPath,
  getUnfinishedBlockers,
  inferStatusFromSection,
  isAutoCompleteParentEnabled,
  reorderItemsWithDrag,
  resolveProjectSections,
  sortTasksByOrder,
  updateSubtaskAtPath,
} from './logic/asanaTreeEngine';

export type AsanaViewMode =
  | 'list'
  | 'kanban'
  | 'timeline'
  | 'calendar'
  | 'mytasks'
  | 'inbox'
  | 'rendement';

interface UseTaskLogicProps {
  tasks: Task[];
  onUpdateTasks: (updated: Task[]) => void;
  onAddNotification: (log: NotificationLog) => void;
  currentRole: string;
  employees: Employee[];
  reminders?: Reminder[];
  notifications?: NotificationLog[];
  currentUser?: AppUser | null;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export function useTaskLogic({
  tasks,
  onUpdateTasks,
  onAddNotification,
  currentRole,
  employees,
  reminders = [],
  notifications = [],
  currentUser,
  showToast,
}: UseTaskLogicProps) {
  const [projects, setProjects] = useState<TaskProject[]>(DEFAULT_TASK_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string>('all');
  const [activeView, setActiveView] = useState<AsanaViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'tasks' | 'milestones'>('all');
  const [filterDatePeriod, setFilterDatePeriod] = useState<'all' | '3days' | 'today' | 'week' | 'month'>('all');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMilestoneModalDefault, setIsMilestoneModalDefault] = useState(false);
  const [createModalDefaultStatus, setCreateModalDefaultStatus] = useState<TaskStatus>('todo');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const [selectedSubtaskPath, setSelectedSubtaskPath] = useState<string[]>([]);

  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [taskForSubtaskModal, setTaskForSubtaskModal] = useState<Task | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const isRestrictedStaff = isSelfOnlyUser(currentUser, currentRole);

  // Synchronisation en temps réel des projets & sections depuis Supabase (task_projects)
  useEffect(() => {
    const unsub = subscribeToCollection<TaskProject>(COLLECTIONS.TASK_PROJECTS, (dbProjects) => {
      if (!Array.isArray(dbProjects)) return;
      const mergedMap = new Map<string, TaskProject>();
      DEFAULT_TASK_PROJECTS.forEach((def) => mergedMap.set(def.id, def));
      dbProjects.forEach((proj) => {
        if (!proj?.id) return;
        const base = mergedMap.get(proj.id);
        mergedMap.set(proj.id, {
          ...(base || {}),
          ...proj,
          sections:
            proj.sections && proj.sections.length > 0
              ? proj.sections
              : base?.sections || DEFAULT_PROJECT_SECTIONS,
          rules:
            proj.rules && proj.rules.length > 0
              ? proj.rules
              : base?.rules || DEFAULT_PROJECT_RULES,
        });
      });
      setProjects(Array.from(mergedMap.values()));
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const { currentEmployee, visibleEmployees, visibleProjects } = useMemo(
    () => computeTaskVisibilityScope(employees, projects, isRestrictedStaff, currentUser),
    [employees, projects, isRestrictedStaff, currentUser]
  );

  useEffect(() => {
    if (selectedTaskForDetail) {
      const latest = tasks.find((t) => t.id === selectedTaskForDetail.id);
      if (latest) setSelectedTaskForDetail(latest);
    }
  }, [tasks, selectedTaskForDetail?.id]);

  const openTaskDetail = useCallback((task: Task, subtaskPath: string[] = []) => {
    setSelectedTaskForDetail(task);
    setSelectedSubtaskPath(subtaskPath);
  }, []);

  const closeTaskDetail = useCallback(() => {
    setSelectedTaskForDetail(null);
    setSelectedSubtaskPath([]);
  }, []);

  /**
   * Sauvegarde instantanée et silencieuse (Asana live-sync) sans popup bloquant, avec support récurrence.
   */
  const handleSilentSaveTask = useCallback(
    async (updatedTask: Task, previousList?: Task[]) => {
      const sourceList = previousList || tasks;
      const prevTask = sourceList.find((t) => t.id === updatedTask.id);
      const finalized: Task = {
        ...updatedTask,
        updatedAt: new Date().toISOString(),
        lastUpdatedTime: new Date().toISOString(),
      };

      let nextTasks = sourceList.map((t) => (t.id === finalized.id ? finalized : t));

      // Règle Asana : si la tâche devient terminée et possède une récurrence, créer la prochaine occurrence
      if (
        prevTask &&
        prevTask.status !== 'completed' &&
        finalized.status === 'completed' &&
        finalized.recurrence &&
        finalized.recurrence !== 'none'
      ) {
        const nextDue = computeNextRecurrenceDate(finalized.dueDate || finalized.date, finalized.recurrence);
        if (nextDue) {
          const clonedSubtasks = (finalized.subtasks || []).map((s) => ({
            ...s,
            id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            completed: false,
            status: 'todo' as TaskStatus,
            completedAt: undefined,
          }));
          const recurringTask: Task = {
            ...finalized,
            id: `task-${Date.now()}-rec`,
            docId: undefined,
            status: 'todo',
            date: nextDue,
            dueDate: nextDue,
            startDate: nextDue,
            completedAt: undefined,
            subtasks: clonedSubtasks,
            comments: [],
            incidents: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          nextTasks = [recurringTask, ...nextTasks];
          taskService.saveTask(recurringTask).catch(() => {});
          showToast?.(`Prochaine occurrence planifiée pour le ${nextDue}.`, 'success');
        }
      }

      onUpdateTasks(nextTasks);
      if (selectedTaskForDetail && selectedTaskForDetail.id === finalized.id) {
        setSelectedTaskForDetail(finalized);
      }

      try {
        await taskService.saveTask(finalized);
      } catch (err: any) {
        showToast?.(err?.message || 'Erreur de synchronisation Supabase.', 'error');
      }
    },
    [tasks, onUpdateTasks, selectedTaskForDetail, showToast]
  );

  /**
   * Mouvement unifié Asana (drag & drop entre sections, statuts, dates Timeline/Calendrier, ou réorganisation).
   */
  const handleMoveTask = useCallback(
    async (params: {
      taskId: string;
      targetStatus?: TaskStatus;
      targetSectionId?: string;
      targetDate?: string;
      targetStartDate?: string;
      targetPersonalBucket?: PersonalTaskBucket;
      targetTaskIdForReorder?: string;
      placeAfter?: boolean;
    }) => {
      const {
        taskId,
        targetStatus,
        targetSectionId,
        targetDate,
        targetStartDate,
        targetPersonalBucket,
        targetTaskIdForReorder,
        placeAfter,
      } = params;

      const currentTask = tasks.find((t) => t.id === taskId);
      if (!currentTask) return;

      const project = projects.find((p) => p.id === (currentTask.projectId || 'general'));
      const sections = resolveProjectSections(project);

      let nextStatus: TaskStatus = targetStatus ?? currentTask.status;
      if (targetSectionId && !targetStatus) {
        const targetSec = sections.find((s) => s.id === targetSectionId);
        if (targetSec) {
          nextStatus = inferStatusFromSection(targetSec, currentTask.status);
        }
      }

      if (nextStatus === 'completed' && currentTask.status !== 'completed') {
        const blockers = getUnfinishedBlockers(currentTask.dependsOnIds, tasks);
        if (blockers.length > 0) {
          showToast?.(`Bloquée par « ${blockers[0].title} ». Terminez la dépendance d'abord.`, 'error');
          return;
        }
      }

      const updatedSubtasks =
        nextStatus === 'completed' && currentTask.status !== 'completed'
          ? (currentTask.subtasks || []).map((s) => ({
              ...s,
              completed: true,
              status: 'completed' as TaskStatus,
              completedAt: s.completedAt || new Date().toISOString(),
            }))
          : currentTask.subtasks;

      let updatedTask: Task = {
        ...currentTask,
        status: nextStatus,
        sectionId: targetSectionId ?? currentTask.sectionId,
        date: targetDate ?? currentTask.date,
        dueDate: targetDate ?? currentTask.dueDate,
        startDate: targetStartDate ?? currentTask.startDate,
        personalBucket: targetPersonalBucket ?? currentTask.personalBucket,
        subtasks: updatedSubtasks,
        completedAt:
          nextStatus === 'completed'
            ? currentTask.completedAt || new Date().toISOString()
            : targetStatus && targetStatus !== 'completed'
            ? undefined
            : currentTask.completedAt,
        lastUpdatedTime: new Date().toISOString(),
      };

      let nextTasks = tasks.map((t) => (t.id === taskId ? updatedTask : t));

      if (targetTaskIdForReorder && targetTaskIdForReorder !== taskId) {
        const ordered = reorderItemsWithDrag(
          sortTasksByOrder(nextTasks),
          taskId,
          targetTaskIdForReorder,
          Boolean(placeAfter)
        );
        const orderMap = new Map(ordered.map((t) => [t.id, t.orderIndex]));
        nextTasks = nextTasks.map((t) => ({
          ...t,
          orderIndex: orderMap.has(t.id) ? orderMap.get(t.id) : t.orderIndex,
        }));
        updatedTask = nextTasks.find((t) => t.id === taskId) || updatedTask;
        // Persister uniquement les tâches dont l'ordre a changé
        await Promise.all(
          nextTasks
            .filter((t) => {
              const prev = tasks.find((p) => p.id === t.id);
              return t.id === taskId || prev?.orderIndex !== t.orderIndex;
            })
            .map((t) => taskService.saveTask(t).catch(() => {}))
        );
        onUpdateTasks(nextTasks);
      } else {
        await handleSilentSaveTask(updatedTask, tasks);
      }

      if (nextStatus !== currentTask.status) {
        if (nextStatus === 'completed') {
          notifyExceptionalTaskCompletion(updatedTask, updatedTask.assignedTo, onAddNotification as any).catch(() => {});
        } else {
          const operationKey = `task-status:${taskId}:${nextStatus}`;
          onAddNotification({
            id: `notif-task-move-${Date.now()}-${taskId}`,
            recipient: updatedTask.assignedTo || updatedTask.employeeId || 'Collaborateur',
            type: 'system',
            title: `Mouvement de Tâche : ${updatedTask.title}`,
            content: `Passée au statut « ${nextStatus} ».`,
            payload: JSON.stringify({
              source: 'task_movement',
              operationKey,
              taskId: updatedTask.id,
              newStatus: nextStatus,
              previousStatus: currentTask.status,
            }),
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
      }
    },
    [tasks, projects, handleSilentSaveTask, onUpdateTasks, onAddNotification, showToast]
  );

  /**
   * Création instantanée inline (sans modal) depuis une section, colonne Kanban, calendrier ou Mes Tâches.
   */
  const handleQuickCreateTask = useCallback(
    async (input: {
      title: string;
      status?: TaskStatus;
      sectionId?: string;
      date?: string;
      startDate?: string;
      dueDate?: string;
      projectId?: string;
      assignedTo?: string;
      estimatedHours?: number;
      tags?: string[];
      personalBucket?: PersonalTaskBucket;
      isMilestone?: boolean;
    }) => {
      const trimmed = input.title.trim();
      if (!trimmed) return;

      const resolvedProjectId =
        input.projectId && input.projectId !== 'all'
          ? input.projectId
          : activeProjectId !== 'all'
          ? activeProjectId
          : 'general';

      const today = new Date().toISOString().split('T')[0];
      const finalDate = input.date || input.dueDate || today;
      const defaultAssignee =
        input.assignedTo ||
        (isRestrictedStaff ? currentUser?.name || employees[0]?.name || 'Moi' : 'Équipe');
      const matchedEmp = employees.find((e) => e.name === defaultAssignee);

      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        title: trimmed,
        description: '',
        date: finalDate,
        startDate: input.startDate || finalDate,
        dueDate: input.dueDate || finalDate,
        time: '09:00',
        priority: 'medium',
        status: input.status || 'todo',
        assignedTo: defaultAssignee,
        employeeId: matchedEmp?.id,
        projectId: resolvedProjectId,
        sectionId: input.sectionId,
        estimatedHours: input.estimatedHours,
        tags: input.tags,
        personalBucket: input.personalBucket,
        orderIndex: 0,
        isMilestone: Boolean(input.isMilestone),
        subtasks: [],
        comments: [],
        incidents: [],
        createdAt: new Date().toISOString(),
        lastUpdatedTime: new Date().toISOString(),
      };

      const shifted = tasks.map((t, idx) => ({
        ...t,
        orderIndex: typeof t.orderIndex === 'number' ? t.orderIndex + 1 : idx + 1,
      }));
      await executeOperationWithLoading({
        loadingTitle: 'Création de la tâche...',
        loadingText: `Enregistrement de "${trimmed}" en cours, veuillez patienter...`,
        action: async () => {
          await taskService.saveTask(newTask);
          onUpdateTasks([newTask, ...shifted]);
        },
        successTitle: 'Tâche créée !',
        successMessage: `La tâche « ${trimmed} » a été ajoutée avec succès.`,
        errorMessage: 'Erreur lors de la création de la tâche.',
      });
    },
    [activeProjectId, isRestrictedStaff, currentUser, employees, tasks, onUpdateTasks]
  );

  const handleToggleSubtaskAtPath = useCallback(
    async (taskId: string, path: string[]) => {
      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask || path.length === 0) return;
      const targetSub = findSubtaskByPath(targetTask.subtasks || [], path);
      if (!targetSub) return;

      const nextCompleted = !(targetSub.completed || targetSub.status === 'completed');
      if (nextCompleted) {
        const blockers = getUnfinishedBlockers(targetSub.dependsOnIds, tasks);
        if (blockers.length > 0) {
          showToast?.(`Sous-tâche bloquée par « ${blockers[0].title} ».`, 'error');
          return;
        }
      }

      const updatedSubtasks = updateSubtaskAtPath(targetTask.subtasks || [], path, (s) => ({
        ...s,
        completed: nextCompleted,
        status: nextCompleted ? 'completed' : s.status === 'completed' ? 'todo' : s.status || 'todo',
        completedAt: nextCompleted ? new Date().toISOString() : undefined,
      }));

      const proj = projects.find((p) => p.id === (targetTask.projectId || 'general'));
      const autoComplete = isAutoCompleteParentEnabled(proj);
      const allRootDone =
        updatedSubtasks.length > 0 &&
        updatedSubtasks.every((s) => s.completed || s.status === 'completed');

      const nextTaskStatus: TaskStatus =
        autoComplete && allRootDone
          ? 'completed'
          : targetTask.status === 'completed' && !nextCompleted
          ? 'in_progress'
          : targetTask.status;

      const savedParentTask: Task = {
        ...targetTask,
        status: nextTaskStatus,
        completedAt:
          nextTaskStatus === 'completed'
            ? targetTask.completedAt || new Date().toISOString()
            : undefined,
        subtasks: updatedSubtasks,
      };

      await handleSilentSaveTask(savedParentTask);

      if (nextTaskStatus === 'completed' && targetTask.status !== 'completed') {
        notifyExceptionalTaskCompletion(
          savedParentTask,
          currentUser?.name || targetTask.assignedTo,
          onAddNotification as any
        ).catch(() => {});
      }
    },
    [tasks, projects, handleSilentSaveTask, showToast, currentUser?.name, onAddNotification]
  );

  const handleUpdateSubtaskAtPath = useCallback(
    async (taskId: string, path: string[], patch: Partial<Subtask>) => {
      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask || path.length === 0) return;

      const updatedSubtasks = updateSubtaskAtPath(targetTask.subtasks || [], path, (s) => {
        const nextStatus = patch.status ?? s.status;
        const nextCompleted =
          patch.completed !== undefined
            ? patch.completed
            : nextStatus === 'completed'
            ? true
            : nextStatus
            ? false
            : s.completed;
        return {
          ...s,
          ...patch,
          completed: nextCompleted,
          status: nextStatus || (nextCompleted ? 'completed' : 'todo'),
          completedAt: nextCompleted ? s.completedAt || new Date().toISOString() : undefined,
        };
      });

      await handleSilentSaveTask({
        ...targetTask,
        subtasks: updatedSubtasks,
      });
    },
    [tasks, handleSilentSaveTask]
  );

  const handleInlineAddSubtask = useCallback(
    async (taskId: string, parentPath: string[], title: string, extra?: Partial<Subtask>) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask) return;

      const parentSub = parentPath.length > 0 ? findSubtaskByPath(targetTask.subtasks || [], parentPath) : null;
      const defaultDue =
        extra?.dueDate || parentSub?.dueDate || targetTask.dueDate || targetTask.date || new Date().toISOString().split('T')[0];

      const newSub: Subtask = {
        id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: trimmed,
        completed: false,
        status: 'todo',
        priority: extra?.priority || 'medium',
        assignedTo: extra?.assignedTo || parentSub?.assignedTo || targetTask.assignedTo || 'Équipe',
        startDate: extra?.startDate || new Date().toISOString().split('T')[0],
        dueDate: defaultDue,
        endDate: defaultDue,
        subtasks: [],
        createdAt: new Date().toISOString(),
        ...extra,
      };

      const updatedTask = addSubtaskToTaskAtPath(targetTask, parentPath, newSub);
      await executeOperationWithLoading({
        loadingTitle: 'Ajout de la sous-tâche...',
        loadingText: `Enregistrement de "${trimmed}", veuillez patienter...`,
        action: async () => {
          await handleSilentSaveTask(updatedTask);
        },
        successTitle: 'Sous-tâche ajoutée !',
        successMessage: `La sous-tâche « ${trimmed} » a été ajoutée.`,
        errorMessage: "Impossible d'ajouter la sous-tâche.",
      });
    },
    [tasks, handleSilentSaveTask]
  );

  const handleDeleteSubtaskAtPath = useCallback(
    async (taskId: string, path: string[]) => {
      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask || path.length === 0) return;
      const targetSub = findSubtaskByPath(targetTask.subtasks || [], path);

      await executeDeleteWithSweetAlert({
        title: 'Supprimer cette sous-tâche ?',
        text: 'Voulez-vous vraiment supprimer cette sous-tâche ?',
        itemName: targetSub?.title,
        action: async () => {
          const updatedSubtasks = deleteSubtaskAtPath(targetTask.subtasks || [], path);
          await handleSilentSaveTask({
            ...targetTask,
            subtasks: updatedSubtasks,
          });
          if (
            selectedTaskForDetail?.id === taskId &&
            selectedSubtaskPath.join('/') === path.join('/')
          ) {
            setSelectedSubtaskPath(path.slice(0, -1));
          }
        },
        successTitle: 'Sous-tâche supprimée !',
        successMessage: 'La sous-tâche a été supprimée avec succès.',
      });
    },
    [tasks, handleSilentSaveTask, selectedTaskForDetail?.id, selectedSubtaskPath]
  );

  const handleReorderSubtasksAtPath = useCallback(
    async (taskId: string, parentPath: string[], draggedSubId: string, targetSubId: string) => {
      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask) return;

      let updatedTask: Task;
      if (parentPath.length === 0) {
        updatedTask = {
          ...targetTask,
          subtasks: reorderItemsWithDrag(targetTask.subtasks || [], draggedSubId, targetSubId),
        };
      } else {
        updatedTask = {
          ...targetTask,
          subtasks: updateSubtaskAtPath(targetTask.subtasks || [], parentPath, (parent) => ({
            ...parent,
            subtasks: reorderItemsWithDrag(parent.subtasks || [], draggedSubId, targetSubId),
          })),
        };
      }
      await handleSilentSaveTask(updatedTask);
    },
    [tasks, handleSilentSaveTask]
  );

  const handlePromoteSubtaskToTask = useCallback(
    async (taskId: string, path: string[]) => {
      const parentTask = tasks.find((t) => t.id === taskId);
      if (!parentTask || path.length === 0) return;
      const sub = findSubtaskByPath(parentTask.subtasks || [], path);
      if (!sub) return;

      const promotedTask: Task = {
        id: `task-${Date.now()}-prom`,
        title: sub.title,
        description: sub.description || '',
        date: sub.dueDate || sub.endDate || parentTask.date,
        startDate: sub.startDate || parentTask.startDate || parentTask.date,
        dueDate: sub.dueDate || sub.endDate || parentTask.dueDate || parentTask.date,
        time: sub.time || '09:00',
        priority: sub.priority || 'medium',
        status: sub.status || (sub.completed ? 'completed' : 'todo'),
        assignedTo: sub.assignedTo || parentTask.assignedTo || 'Équipe',
        employeeId: sub.employeeId,
        projectId: parentTask.projectId || 'general',
        sectionId: parentTask.sectionId,
        tags: sub.tags,
        dependsOnIds: sub.dependsOnIds,
        likedBy: sub.likedBy,
        followerIds: sub.followerIds,
        recurrence: sub.recurrence,
        acceptanceCriteria: sub.acceptanceCriteria,
        estimatedHours: sub.estimatedHours,
        actualHours: sub.actualHours,
        subtasks: sub.subtasks || [],
        comments: sub.comments || [],
        incidents: sub.incidents || [],
        createdAt: new Date().toISOString(),
        lastUpdatedTime: new Date().toISOString(),
      };

      const cleanedParent: Task = {
        ...parentTask,
        subtasks: deleteSubtaskAtPath(parentTask.subtasks || [], path),
        lastUpdatedTime: new Date().toISOString(),
      };

      const nextList = [
        promotedTask,
        ...tasks.map((t) => (t.id === parentTask.id ? cleanedParent : t)),
      ];
      await executeOperationWithLoading({
        loadingTitle: 'Conversion en tâche principale...',
        loadingText: `Conversion de « ${sub.title} », veuillez patienter...`,
        action: async () => {
          await Promise.all([
            taskService.saveTask(promotedTask),
            taskService.saveTask(cleanedParent),
          ]);
          onUpdateTasks(nextList);
          setSelectedTaskForDetail(promotedTask);
          setSelectedSubtaskPath([]);
        },
        successTitle: 'Sous-tâche convertie !',
        successMessage: `« ${sub.title} » a été convertie en tâche principale.`,
      });
    },
    [tasks, onUpdateTasks]
  );

  // Gestion des sections, champs personnalisés & règles projet (persistés dans Supabase task_projects)
  const persistProjectUpdate = useCallback(
    async (projectId: string, updater: (p: TaskProject) => TaskProject) => {
      if (!projectId || projectId === 'all') return;
      const existing = projects.find((p) => p.id === projectId);
      if (!existing) return;
      const updated = { ...updater(existing), docId: existing.docId || existing.id };
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
      try {
        await saveDocument(COLLECTIONS.TASK_PROJECTS, updated);
      } catch (err: any) {
        showToast?.(err?.message || 'Erreur sauvegarde projet Supabase.', 'error');
      }
    },
    [projects, showToast]
  );

  const handleAddSection = useCallback(
    async (projectId: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const targetProjId = projectId === 'all' ? 'general' : projectId;
      await executeOperationWithLoading({
        loadingTitle: 'Création de la section...',
        loadingText: `Ajout de la section « ${trimmed} », veuillez patienter...`,
        action: async () => {
          await persistProjectUpdate(targetProjId, (p) => {
            const current = resolveProjectSections(p);
            const newSec: TaskSection = {
              id: `sec-${Date.now()}`,
              title: trimmed,
              orderIndex: current.length,
              color: '#2A7B76',
            };
            return { ...p, sections: [...current, newSec] };
          });
        },
        successTitle: 'Section créée !',
        successMessage: `La section « ${trimmed} » a été créée avec succès.`,
      });
    },
    [persistProjectUpdate]
  );

  const handleRenameSection = useCallback(
    async (projectId: string, sectionId: string, newTitle: string) => {
      const trimmed = newTitle.trim();
      if (!trimmed) return;
      const targetProjId = projectId === 'all' ? 'general' : projectId;
      await executeOperationWithLoading({
        loadingTitle: 'Renommage de la section...',
        loadingText: 'Mise à jour du nom de la section, veuillez patienter...',
        action: async () => {
          await persistProjectUpdate(targetProjId, (p) => {
            const current = resolveProjectSections(p);
            return {
              ...p,
              sections: current.map((s) => (s.id === sectionId ? { ...s, title: trimmed } : s)),
            };
          });
        },
        successTitle: 'Section renommée !',
        successMessage: `La section a été renommée en « ${trimmed} ».`,
      });
    },
    [persistProjectUpdate]
  );

  const handleDeleteSection = useCallback(
    async (projectId: string, sectionId: string) => {
      const targetProjId = projectId === 'all' ? 'general' : projectId;
      await executeDeleteWithSweetAlert({
        title: 'Supprimer cette section ?',
        text: 'Voulez-vous vraiment supprimer cette section du projet ?',
        action: async () => {
          await persistProjectUpdate(targetProjId, (p) => {
            const current = resolveProjectSections(p);
            if (current.length <= 1) return p;
            return {
              ...p,
              sections: current
                .filter((s) => s.id !== sectionId)
                .map((s, idx) => ({ ...s, orderIndex: idx })),
            };
          });
        },
        successTitle: 'Section supprimée !',
        successMessage: 'La section a été supprimée avec succès.',
      });
    },
    [persistProjectUpdate]
  );

  const handleToggleProjectRule = useCallback(
    async (projectId: string, ruleId: string) => {
      const targetProjId = projectId === 'all' ? 'general' : projectId;
      await executeOperationWithLoading({
        loadingTitle: 'Mise à jour de la règle...',
        loadingText: 'Enregistrement des paramètres du projet, veuillez patienter...',
        action: async () => {
          await persistProjectUpdate(targetProjId, (p) => {
            const rules = p.rules && p.rules.length > 0 ? p.rules : DEFAULT_PROJECT_RULES;
            return {
              ...p,
              rules: rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)),
            };
          });
        },
        successTitle: 'Règle mise à jour !',
        successMessage: 'La règle d’automatisation du projet a été enregistrée.',
      });
    },
    [persistProjectUpdate]
  );

  const handleAddProjectCustomField = useCallback(
    async (projectId: string, field: TaskCustomFieldDef) => {
      const targetProjId = projectId === 'all' ? 'general' : projectId;
      await executeOperationWithLoading({
        loadingTitle: 'Ajout du champ personnalisé...',
        loadingText: 'Enregistrement du nouveau champ sur le projet, veuillez patienter...',
        action: async () => {
          await persistProjectUpdate(targetProjId, (p) => ({
            ...p,
            customFields: [...(p.customFields || []), field],
          }));
        },
        successTitle: 'Champ ajouté !',
        successMessage: `Le champ "${field.name}" a été ajouté au projet.`,
      });
    },
    [persistProjectUpdate]
  );

  const handleCreateSubtask = async (subtask: Subtask, targetTaskId?: string) => {
    const taskIdToUpdate = targetTaskId || taskForSubtaskModal?.id;
    if (!taskIdToUpdate) return;
    const target = tasks.find((t) => t.id === taskIdToUpdate);
    if (!target) return;

    await executeOperationWithLoading({
      loadingTitle: 'Création de la sous-tâche...',
      loadingText: `Ajout de "${subtask.title}" sur "${target.title}", veuillez patienter...`,
      action: async () => {
        const updatedTask = addSubtaskToTaskAtPath(target, [], subtask);
        await taskService.saveTask(updatedTask);
        onUpdateTasks(tasks.map((t) => (t.id === taskIdToUpdate ? updatedTask : t)));
        if (selectedTaskForDetail && selectedTaskForDetail.id === taskIdToUpdate) {
          setSelectedTaskForDetail(updatedTask);
        }
        logSystemAudit({
          authorName: currentUser?.name || currentRole,
          authorRole: currentUser?.role || currentRole,
          targetName: subtask.assignedTo || target.assignedTo || target.title,
          targetEmployeeId: subtask.employeeId || target.employeeId,
          operationType: 'tache_projet',
          operationLabel: 'Création Sous-Tâche',
          details: `Sous-tâche "${subtask.title}" ajoutée sur "${target.title}".`,
          level: 'success',
          metadata: { assignedTo: subtask.assignedTo || target.assignedTo, taskId: target.id },
        });
      },
      successTitle: 'Sous-tâche créée !',
      successMessage: `La sous-tâche "${subtask.title}" a été ajoutée avec succès.`,
      errorMessage: "Impossible d'ajouter la sous-tâche.",
    });
  };

  const filteredTasks = useMemo(() => {
    const filtered = filterTasksByCriteria({
      tasks,
      projects,
      isRestrictedStaff,
      currentEmployee,
      currentUser,
      searchTerm,
      activeProjectId,
      filterPriority,
      filterAssignee,
      filterType,
      filterDatePeriod,
    });
    return sortTasksByOrder(filtered);
  }, [
    tasks,
    searchTerm,
    activeProjectId,
    filterPriority,
    filterAssignee,
    filterType,
    filterDatePeriod,
    isRestrictedStaff,
    currentUser,
    currentEmployee,
    projects,
  ]);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId]
  );

  return {
    projects,
    visibleProjects,
    activeProject,
    activeProjectId,
    setActiveProjectId,
    activeView,
    setActiveView,
    searchTerm,
    setSearchTerm,
    filterPriority,
    setFilterPriority,
    filterAssignee,
    setFilterAssignee,
    filterType,
    setFilterType,
    filterDatePeriod,
    setFilterDatePeriod,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isMilestoneModalDefault,
    setIsMilestoneModalDefault,
    createModalDefaultStatus,
    setCreateModalDefaultStatus,
    isNewProjectModalOpen,
    setIsNewProjectModalOpen,
    selectedTaskForDetail,
    setSelectedTaskForDetail,
    selectedSubtaskPath,
    setSelectedSubtaskPath,
    openTaskDetail,
    closeTaskDetail,
    isSubtaskModalOpen,
    setIsSubtaskModalOpen,
    taskForSubtaskModal,
    setTaskForSubtaskModal,
    handleOpenCreateSubtask: (task?: Task) => {
      setTaskForSubtaskModal(task || null);
      setIsSubtaskModalOpen(true);
    },
    handleCreateSubtask,
    handleSilentSaveTask,
    handleMoveTask,
    handleQuickCreateTask,
    handleToggleSubtaskAtPath,
    handleUpdateSubtaskAtPath,
    handleInlineAddSubtask,
    handleDeleteSubtaskAtPath,
    handleReorderSubtasksAtPath,
    handlePromoteSubtaskToTask,
    handleAddSection,
    handleRenameSection,
    handleDeleteSection,
    handleToggleProjectRule,
    handleAddProjectCustomField,
    filteredTasks,
    handleCreateProject: (newProject: TaskProject) =>
      createNewProjectAction({ newProject, projects, setProjects, setActiveProjectId }),
    handleCreateTask: (taskData: Omit<Task, 'id' | 'comments' | 'incidents'> & { subtasks?: Subtask[] }) =>
      createNewTaskAction({ taskData, tasks, currentRole, onUpdateTasks, onAddNotification }),
    handleStatusChange: (taskId: string, newStatus: TaskStatus) =>
      changeTaskStatusAction({
        taskId,
        newStatus,
        tasks,
        currentRole,
        selectedTaskForDetail,
        onUpdateTasks,
        setSelectedTaskForDetail,
        onAddNotification,
        showToast,
      }),
    handleSaveTask: (updatedTask: Task) =>
      saveUpdatedTaskAction({
        updatedTask,
        tasks,
        onUpdateTasks,
        setSelectedTaskForDetail,
        onAddNotification,
      }),
    handleDeleteTask: (id: string) =>
      deleteTaskWithSweetAlert({ id, tasks, onUpdateTasks, setSelectedTaskForDetail }),
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    taskToDelete,
    setTaskToDelete,
    handleOpenDeleteModal: (task: Task) =>
      confirmDeleteTaskWithPrompt({
        task,
        tasks,
        selectedTaskForDetail,
        onUpdateTasks,
        setSelectedTaskForDetail,
        showToast,
      }),
    handleDeleteTaskConfirm: async () => {},
    isRestrictedStaff,
    visibleEmployees,
    handleSendManualTaskSheet: () =>
      executeSendManualTaskSheet({
        tasks,
        reminders,
        notifications,
        currentUser,
        currentEmployee,
        onAddNotification,
        showToast,
      }),
  };
}
