import { useState, useEffect, useMemo } from 'react';
import { Task, NotificationLog, Employee, TaskStatus, TaskPriority, TaskProject, AppUser } from '../../types';
import { DEFAULT_TASK_PROJECTS } from './taskConstants';

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

    if (showToast) {
      showToast('Tâche créée avec succès.', 'success');
    }
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t));
    onUpdateTasks(updated);
    if (selectedTaskForDetail && selectedTaskForDetail.id === taskId) {
      setSelectedTaskForDetail({ ...selectedTaskForDetail, status: newStatus });
    }
    if (showToast) showToast('Statut mis à jour.', 'success');
  };

  const handleSaveTask = (updatedTask: Task) => {
    onUpdateTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setSelectedTaskForDetail(updatedTask);
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

      const matchAssignee =
        filterAssignee === 'all'
          ? true
          : t.assignedTo === filterAssignee || (!t.assignedTo && filterAssignee === 'Équipe');

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
