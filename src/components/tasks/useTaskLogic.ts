import { useState, useEffect, useMemo } from 'react';
import { Task, NotificationLog, Employee, TaskStatus, TaskPriority, TaskProject, AppUser, Subtask } from '../../types';
import { DEFAULT_TASK_PROJECTS } from './taskConstants';
import { taskService } from '../../services/taskService';
import { pushNotificationBridgeService } from '../../services/pushNotificationBridgeService';
import { showSuccessAlert, showErrorAlert } from '../../utils/sweetAlert';

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
  // Project & View Tabs
  const [projects, setProjects] = useState<TaskProject[]>(DEFAULT_TASK_PROJECTS);

  const [activeProjectId, setActiveProjectId] = useState<string>('all');
  const [activeView, setActiveView] = useState<'kanban' | 'table' | 'rendement'>('kanban');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'tasks' | 'milestones'>('all');

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMilestoneModalDefault, setIsMilestoneModalDefault] = useState(false);
  const [createModalDefaultStatus, setCreateModalDefaultStatus] = useState<TaskStatus>('todo');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [taskForSubtaskModal, setTaskForSubtaskModal] = useState<Task | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const handleOpenDeleteModal = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteTaskConfirm = async () => {
    if (!taskToDelete) return;
    const targetId = String(taskToDelete.id);
    const targetDocId = taskToDelete.docId ? String(taskToDelete.docId) : '';

    await taskService.deleteTask(targetId);
    if (targetDocId && targetDocId !== targetId) {
      await taskService.deleteTask(targetDocId);
    }

    const updated = tasks.filter((t) => {
      const tId = String(t.id);
      const tDocId = t.docId ? String(t.docId) : '';
      if (tId === targetId || (targetDocId && tId === targetDocId)) return false;
      if (tDocId && (tDocId === targetId || (targetDocId && tDocId === targetDocId))) return false;
      return true;
    });

    onUpdateTasks(updated);

    if (
      selectedTaskForDetail &&
      (String(selectedTaskForDetail.id) === targetId || (targetDocId && String(selectedTaskForDetail.id) === targetDocId))
    ) {
      setSelectedTaskForDetail(null);
    }
  };

  // Connected employee
  const currentEmployee = useMemo(() => {
    if (!currentUser) return null;
    return employees.find((e) => e.email === currentUser.email || e.name === currentUser.name || e.id === currentUser.id);
  }, [currentUser, employees]);

  // Project restriction: non-admin users only see projects they belong to
  const visibleProjects = useMemo(() => {
    const isEmployeeRole = currentRole === 'employé' || (currentUser && currentUser.role === 'employé');
    if (!isEmployeeRole) return projects;

    return projects.filter((p) => {
      if (p.id === 'all') return true;
      if (!p.memberIds || p.memberIds.length === 0) return true;
      if (currentEmployee && p.memberIds.includes(currentEmployee.id)) return true;
      if (currentUser && p.memberIds.includes(currentUser.id)) return true;
      return false;
    });
  }, [projects, currentRole, currentUser, currentEmployee]);

  // Sync selected task details with tasks updates
  useEffect(() => {
    if (selectedTaskForDetail) {
      const latest = tasks.find((t) => t.id === selectedTaskForDetail.id);
      if (latest) setSelectedTaskForDetail(latest);
    }
  }, [tasks]);

  const saveProjects = (updatedProjects: TaskProject[]) => {
    setProjects(updatedProjects);
  };

  const handleCreateProject = async (newProject: TaskProject) => {
    const updated = [...projects, newProject];
    saveProjects(updated);
    setActiveProjectId(newProject.id);
    if (showToast) showToast(`Projet "${newProject.name}" créé avec succès !`, 'success');
    await showSuccessAlert('Projet créé !', `Le module/projet "${newProject.name}" a été créé avec succès.`);
  };

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'comments' | 'incidents'> & { subtasks?: Subtask[] }) => {
    try {
      const taskItem: Task = {
        id: `task-${Date.now()}`,
        ...taskData,
        subtasks: taskData.subtasks || [],
        comments: [],
        incidents: [],
        lastUpdatedTime: new Date().toISOString(),
      };

      await taskService.saveTask(taskItem);
      const updatedTasks = [taskItem, ...tasks];
      onUpdateTasks(updatedTasks);

      onAddNotification({
        id: `notif-${Date.now()}`,
        recipient: taskItem.assignedTo || 'Équipe',
        type: 'system',
        title: 'Nouvelle Tâche Assignée',
        content: `${taskItem.title} (${taskItem.date})`,
        payload: '{}',
        timestamp: new Date().toISOString(),
      });

      pushNotificationBridgeService.sendPush({
        title: 'Nouvelle Tâche Assignée 📋',
        message: `${taskItem.title} vous a été assignée pour le ${taskItem.date}.`,
        senderName: currentRole || 'Responsable',
        type: 'task_assigned',
        link: 'tasks',
      });

      if (showToast) {
        showToast('Tâche créée et enregistrée en base avec succès.', 'success');
      }
      await showSuccessAlert('Tâche créée !', `La tâche "${taskItem.title}" a été enregistrée avec succès.`);
    } catch (err: any) {
      await showErrorAlert('Erreur de création', err?.message || 'Impossible d\'enregistrer la tâche.');
    }
  };

  const handleOpenCreateSubtask = (task?: Task) => {
    setTaskForSubtaskModal(task || null);
    setIsSubtaskModalOpen(true);
  };

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
      const updatedTasks = tasks.map((t) => (t.id === taskIdToUpdate ? updatedTask : t));
      onUpdateTasks(updatedTasks);

      if (selectedTaskForDetail && selectedTaskForDetail.id === taskIdToUpdate) {
        setSelectedTaskForDetail(updatedTask);
      }

      if (showToast) {
        showToast(`Sous-tâche "${subtask.title}" créée avec succès (Style Asana Pro) !`, 'success');
      }
      await showSuccessAlert('Sous-tâche ajoutée !', `La sous-tâche "${subtask.title}" a été ajoutée.`);
    } catch (err: any) {
      await showErrorAlert('Erreur', err?.message || 'Impossible d\'ajouter la sous-tâche.');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const updatedTask: Task = { ...targetTask, status: newStatus, lastUpdatedTime: new Date().toISOString() };
    await taskService.saveTask(updatedTask);

    const updated = tasks.map((t) => (t.id === taskId ? updatedTask : t));
    onUpdateTasks(updated);

    if (selectedTaskForDetail && selectedTaskForDetail.id === taskId) {
      setSelectedTaskForDetail(updatedTask);
    }

    const statusLabels: Record<string, string> = {
      todo: 'À faire',
      in_progress: 'En cours',
      review: 'En révision',
      completed: 'Terminée',
    };
    const label = statusLabels[newStatus] || newStatus;
    const targetRecipient = targetTask.assignedTo || targetTask.employeeId || 'Collaborateur';

    onAddNotification({
      id: `notif-task-move-${Date.now()}-${taskId}`,
      recipient: targetRecipient,
      type: 'system',
      title: `Mouvement de Tâche : ${targetTask.title}`,
      content: `La tâche est passée au statut « ${label} ».`,
      payload: JSON.stringify({
        source: 'task_movement',
        taskId: targetTask.id,
        employeeId: targetRecipient,
        newStatus,
        previousStatus: targetTask.status,
      }),
      timestamp: new Date().toISOString(),
      read: false,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('citrine:new_unread_alert'));
    }

    pushNotificationBridgeService.sendPush({
      title: 'Mise à jour de Tâche 🔄',
      message: `La tâche "${targetTask.title}" est passée au statut : ${label}.`,
      senderName: currentRole || 'Collaborateur',
      type: 'task_assigned',
      link: 'tasks',
    });

    if (showToast) showToast('Statut mis à jour et enregistré.', 'success');
  };

  const handleSaveTask = async (updatedTask: Task) => {
    try {
      const prevTask = tasks.find((t) => t.id === updatedTask.id);
      const finalizedTask = { ...updatedTask, updatedAt: new Date().toISOString() };

      await taskService.saveTask(finalizedTask);
      const updated = tasks.map((t) => (t.id === finalizedTask.id ? finalizedTask : t));
      onUpdateTasks(updated);
      setSelectedTaskForDetail(finalizedTask);

      if (finalizedTask.assignedTo) {
        const isStatusChanged = prevTask && prevTask.status !== finalizedTask.status;
        const isPriorityChanged = prevTask && prevTask.priority !== finalizedTask.priority;
        if (isStatusChanged || isPriorityChanged || !prevTask) {
          onAddNotification({
            id: `notif-task-update-${Date.now()}-${finalizedTask.id}`,
            recipient: finalizedTask.assignedTo,
            type: 'system',
            title: `Mise à jour de tâche : ${finalizedTask.title}`,
            content: isStatusChanged 
              ? `Statut modifié : passage à « ${finalizedTask.status} »` 
              : `Détails de la tâche mis à jour.`,
            payload: JSON.stringify({
              source: 'task_movement',
              taskId: finalizedTask.id,
              employeeId: finalizedTask.assignedTo,
              newStatus: finalizedTask.status,
            }),
            timestamp: new Date().toISOString(),
            read: false,
          });

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('citrine:new_unread_alert'));
          }
        }
      }
      if (showToast) showToast('Tâche mise à jour avec succès.', 'success');
      await showSuccessAlert('Modifications enregistrées !', `La tâche "${finalizedTask.title}" a été mise à jour.`);
    } catch (err: any) {
      await showErrorAlert('Erreur', err?.message || 'Impossible d\'enregistrer les modifications.');
    }
  };

  const handleDeleteTask = async (id: string) => {
    await taskService.deleteTask(id);
    const updated = tasks.filter((t) => t.id !== id);
    onUpdateTasks(updated);
    setSelectedTaskForDetail(null);
    if (showToast) showToast('Tâche supprimée avec succès.');
  };

  // Filter tasks based on search, project permissions, priority, assignee, and milestone filter
  const filteredTasks = useMemo(() => {
    const isEmployeeRole = currentRole === 'employé' || (currentUser && currentUser.role === 'employé');

    return tasks.filter((t) => {
      if (isEmployeeRole) {
        const empName = currentEmployee?.name || currentUser?.name;
        const empId = currentEmployee?.id || currentUser?.id;
        const userEmail = currentUser?.email;

        const assignedField = t.assignedTo || '';
        const assignedList = assignedField.split(',').map(s => s.trim());

        const assignedToMe = assignedList.some(a => 
          (empName && a === empName) ||
          (empId && a === empId) ||
          (userEmail && a === userEmail) ||
          a === 'Équipe' || a === 'Tous'
        );
        if (!assignedToMe) return false;
      }

      if (isEmployeeRole && t.projectId && t.projectId !== 'general') {
        const p = projects.find((proj) => proj.id === t.projectId);
        if (p && p.memberIds && p.memberIds.length > 0) {
          const isMember = (currentEmployee && p.memberIds.includes(currentEmployee.id)) ||
                           (currentUser && p.memberIds.includes(currentUser.id));
          if (!isMember) return false;
        }
      }

      const matchSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.milestoneTarget && t.milestoneTarget.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchProject =
        activeProjectId === 'all'
          ? true
          : t.projectId === activeProjectId || (!t.projectId && activeProjectId === 'general');

      const matchPriority = filterPriority === 'all' ? true : t.priority === filterPriority;

      const assignedList = (t.assignedTo || 'Équipe').split(',').map(s => s.trim());
      const matchAssignee =
        filterAssignee === 'all'
          ? true
          : assignedList.includes(filterAssignee) || (!t.assignedTo && filterAssignee === 'Équipe');

      const matchType =
        filterType === 'all'
          ? true
          : filterType === 'milestones'
          ? !!t.isMilestone
          : !t.isMilestone;

      return matchSearch && matchProject && matchPriority && matchAssignee && matchType;
    });
  }, [tasks, searchTerm, activeProjectId, filterPriority, filterAssignee, filterType, currentRole, currentUser, currentEmployee, projects]);

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
    handleOpenCreateSubtask,
    handleCreateSubtask,
    filteredTasks,
    handleCreateProject,
    handleCreateTask,
    handleStatusChange,
    handleSaveTask,
    handleDeleteTask,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    taskToDelete,
    setTaskToDelete,
    handleOpenDeleteModal,
    handleDeleteTaskConfirm,
  };
}
