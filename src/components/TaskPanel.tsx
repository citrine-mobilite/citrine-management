import React from 'react';
import { Task, NotificationLog, Employee, TaskPriority, AppUser } from '../types';
import { 
  TaskStatsCards, 
  TaskKanbanBoard, 
  TaskTableView, 
  TaskDetailDrawer, 
  TaskCreateModal, 
  TaskProjectModal, 
  TaskProjectBar, 
  TaskFilterBar,
  TaskHeaderBanner,
  useTaskLogic
} from './tasks';

interface TaskPanelProps {
  tasks: Task[];
  onUpdateTasks: (updated: Task[]) => void;
  onAddNotification: (log: NotificationLog) => void;
  currentRole: 'Administrateur' | 'Employé' | 'Responsable' | string;
  employees: Employee[];
  selectedEmployeeId?: string;
  showToast?: (message: string, type?: 'success' | 'error') => void;
  currentUser?: AppUser | null;
}

export default function TaskPanel({
  tasks,
  onUpdateTasks,
  onAddNotification,
  currentRole,
  employees,
  showToast,
  currentUser,
}: TaskPanelProps) {
  const logic = useTaskLogic({
    tasks,
    onUpdateTasks,
    onAddNotification,
    currentRole,
    employees,
    currentUser,
    showToast,
  });

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'high':
        return <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Haute</span>;
      case 'medium':
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Moyenne</span>;
      case 'low':
      default:
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Basse</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <TaskHeaderBanner
        onOpenNewProject={() => logic.setIsNewProjectModalOpen(true)}
        onOpenCreateTask={() => {
          logic.setCreateModalDefaultStatus('todo');
          logic.setIsCreateModalOpen(true);
        }}
      />

      {/* Project / Modules Switcher Bar */}
      <TaskProjectBar
        projects={logic.visibleProjects}
        activeProjectId={logic.activeProjectId}
        onSelectProject={logic.setActiveProjectId}
        activeView={logic.activeView}
        onChangeView={logic.setActiveView}
        tasks={tasks}
        onOpenNewProject={() => logic.setIsNewProjectModalOpen(true)}
      />

      {/* KPI Stats */}
      <TaskStatsCards tasks={logic.filteredTasks} />

      {/* Search and Filters Toolbar */}
      <TaskFilterBar
        searchTerm={logic.searchTerm}
        onSearchChange={logic.setSearchTerm}
        filterPriority={logic.filterPriority}
        onPriorityChange={logic.setFilterPriority}
        filterAssignee={logic.filterAssignee}
        onAssigneeChange={logic.setFilterAssignee}
        filterType={logic.filterType}
        onTypeChange={logic.setFilterType}
        employees={employees}
      />

      {/* Mode 1: Kanban défilant horizontal strict */}
      {logic.activeView === 'kanban' && (
        <TaskKanbanBoard
          tasks={logic.filteredTasks}
          onStatusChange={logic.handleStatusChange}
          onSelectTask={logic.setSelectedTaskForDetail}
          onOpenCreateModal={(status) => {
            logic.setIsMilestoneModalDefault(false);
            logic.setCreateModalDefaultStatus(status);
            logic.setIsCreateModalOpen(true);
          }}
          getPriorityBadge={getPriorityBadge}
        />
      )}

      {/* Mode 2: Vue Tableau / Liste structurée */}
      {logic.activeView === 'table' && (
        <TaskTableView
          tasks={logic.filteredTasks}
          projects={logic.visibleProjects}
          onStatusChange={logic.handleStatusChange}
          onSelectTask={logic.setSelectedTaskForDetail}
          onDeleteTask={logic.handleDeleteTask}
          getPriorityBadge={getPriorityBadge}
        />
      )}

      {/* Modal Création Tâche ou Jalon */}
      <TaskCreateModal
        isOpen={logic.isCreateModalOpen}
        onClose={() => logic.setIsCreateModalOpen(false)}
        onCreateTask={logic.handleCreateTask}
        employees={employees}
        projects={logic.visibleProjects}
        defaultProjectId={logic.activeProjectId}
        defaultStatus={logic.createModalDefaultStatus}
        isMilestoneDefault={logic.isMilestoneModalDefault}
      />

      {/* Modal Création Nouveau Module */}
      <TaskProjectModal
        isOpen={logic.isNewProjectModalOpen}
        onClose={() => logic.setIsNewProjectModalOpen(false)}
        onSaveProject={logic.handleCreateProject}
        employees={employees}
      />

      {/* Drawer Fiche Détail */}
      {logic.selectedTaskForDetail && (
        <TaskDetailDrawer
          task={logic.selectedTaskForDetail}
          employees={employees}
          projects={logic.visibleProjects}
          onClose={() => logic.setSelectedTaskForDetail(null)}
          onSaveTask={logic.handleSaveTask}
          onDeleteTask={logic.handleDeleteTask}
          showToast={showToast}
        />
      )}
    </div>
  );
}
