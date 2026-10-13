import { useState, useEffect, useMemo } from 'react';
import { Task, NotificationLog, Employee, TaskStatus, TaskPriority, TaskProject, AppUser } from '../../types';
import { DEFAULT_TASK_PROJECTS } from './taskConstants';
import { pushNotificationBridgeService } from '../../services/pushNotificationBridgeService';

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
  const [projects, setProjects] = useState<TaskProject[]>(() => {
    try {
      const stored = localStorage.getItem('citrine_task_projects_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_TASK_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string>('all');
  const [activeView, setActiveView] = useState<'kanban' | 'table'>('kanban');

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
    try {
      localStorage.setItem('citrine_task_projects_v2', JSON.stringify(updatedProjects));
    } catch {}
  };

  const handleCreateProject = (newProject: TaskProject) => {
    const updated = [...projects, newProject];
    saveProjects(updated);
    setActiveProjectId(newProject.id);
    if (showToast) showToast(`Projet "${newProject.name}" créé avec succès !`, 'success');
  };

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'subtasks' | 'comments' | 'incidents'>) => {
    const taskItem: Task = {
      id: `task-${Date.now()}`,
      ...taskData,
      subtasks: [],
      comments: [],
      incidents: [],
    };

    onUpdateTasks([taskItem, ...tasks]);
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
      showToast('Tâche créée avec succès.', 'success');
    }
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t));
    onUpdateTasks(updated);
    if (selectedTaskForDetail && selectedTaskForDetail.id === taskId) {
      setSelectedTaskForDetail({ ...selectedTaskForDetail, status: newStatus });
    }

    if (targetTask) {
      const statusLabels: Record<string, string> = {
        todo: 'À faire',
        in_progress: 'En cours',
        review: 'En révision',
        completed: 'Terminée',
      };
      const label = statusLabels[newStatus] || newStatus;
      const targetRecipient = targetTask.assignedTo || targetTask.employeeId || 'Collaborateur';

      // Notification non lue chez l'employé concerné
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
    }

    if (showToast) showToast('Statut mis à jour.', 'success');
  };

  const handleSaveTask = (updatedTask: Task) => {
    const prevTask = tasks.find((t) => t.id === updatedTask.id);
    onUpdateTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setSelectedTaskForDetail(updatedTask);

    if (updatedTask.assignedTo) {
      const isStatusChanged = prevTask && prevTask.status !== updatedTask.status;
      const isPriorityChanged = prevTask && prevTask.priority !== updatedTask.priority;
      if (isStatusChanged || isPriorityChanged || !prevTask) {
        onAddNotification({
          id: `notif-task-update-${Date.now()}-${updatedTask.id}`,
          recipient: updatedTask.assignedTo,
          type: 'system',
          title: `Mise à jour de tâche : ${updatedTask.title}`,
          content: isStatusChanged 
            ? `Statut modifié : passage à « ${updatedTask.status} »` 
            : `Détails de la tâche mis à jour.`,
          payload: JSON.stringify({
            source: 'task_movement',
            taskId: updatedTask.id,
            employeeId: updatedTask.assignedTo,
            newStatus: updatedTask.status,
          }),
          timestamp: new Date().toISOString(),
          read: false,
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('citrine:new_unread_alert'));
        }
      }
    }
  };

  const handleDeleteTask = (id: string) => {
    onUpdateTasks(tasks.filter((t) => t.id !== id));
    setSelectedTaskForDetail(null);
    if (showToast) showToast('Élément supprimé avec succès.');
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
    filteredTasks,
    handleCreateProject,
    handleCreateTask,
    handleStatusChange,
    handleSaveTask,
    handleDeleteTask,
  };
}
