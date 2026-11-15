import { useState, useEffect, useMemo } from 'react';
import { Task, NotificationLog, Employee, TaskStatus, TaskProject, AppUser, Subtask } from '../../types';
import { DEFAULT_TASK_PROJECTS } from './taskConstants';
import { taskService } from '../../services/taskService';
import { showErrorAlert } from '../../utils/sweetAlert';
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

interface UseTaskLogicProps {
  tasks: Task[];
  onUpdateTasks: (updated: Task[]) => void;
  onAddNotification: (log: NotificationLog) => void;
  currentRole: string;
  employees: Employee[];
  currentUser?: AppUser | null;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export function useTaskLogic({
  tasks,
  onUpdateTasks,
  onAddNotification,
  currentRole,
  employees,
  currentUser,
  showToast,
}: UseTaskLogicProps) {
  const [projects, setProjects] = useState<TaskProject[]>(DEFAULT_TASK_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string>('all');
  const [activeView, setActiveView] = useState<'kanban' | 'table' | 'rendement'>('kanban');
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
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [taskForSubtaskModal, setTaskForSubtaskModal] = useState<Task | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const isRestrictedStaff = isSelfOnlyUser(currentUser, currentRole);

  const { currentEmployee, visibleEmployees, visibleProjects } = useMemo(
    () => computeTaskVisibilityScope(employees, projects, isRestrictedStaff, currentUser),
    [employees, projects, isRestrictedStaff, currentUser]
  );

  useEffect(() => {
    if (selectedTaskForDetail) {
      const latest = tasks.find((t) => t.id === selectedTaskForDetail.id);
      if (latest) setSelectedTaskForDetail(latest);
    }
  }, [tasks]);

  const handleCreateSubtask = async (subtask: Subtask, targetTaskId?: string) => {
    try {
      const taskIdToUpdate = targetTaskId || taskForSubtaskModal?.id;
      if (!taskIdToUpdate) return;
      const target = tasks.find((t) => t.id === taskIdToUpdate);
      if (!target) return;

      const updatedTask: Task = {
        ...target,
        subtasks: [...(target.subtasks || []), subtask],
        lastUpdatedTime: new Date().toISOString(),
      };

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
      if (showToast) showToast(`Sous-tâche "${subtask.title}" créée avec succès !`, 'success');
    } catch (err: any) {
      await showErrorAlert('Erreur', err?.message || "Impossible d'ajouter la sous-tâche.");
    }
  };

  const filteredTasks = useMemo(
    () =>
      filterTasksByCriteria({
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
      }),
    [
      tasks,
      searchTerm,
      activeProjectId,
      filterPriority,
      filterAssignee,
      filterType,
      filterDatePeriod,
      currentRole,
      currentUser,
      currentEmployee,
      projects,
    ]
  );

  return {
    projects,
    visibleProjects,
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
    isSubtaskModalOpen,
    setIsSubtaskModalOpen,
    taskForSubtaskModal,
    setTaskForSubtaskModal,
    handleOpenCreateSubtask: (task?: Task) => {
      setTaskForSubtaskModal(task || null);
      setIsSubtaskModalOpen(true);
    },
    handleCreateSubtask,
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
      executeSendManualTaskSheet({ tasks, currentUser, currentEmployee, onAddNotification, showToast }),
  };
}
