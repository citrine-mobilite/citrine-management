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
  TaskRendementAnalyticsView,
  SubtaskCreateModal,
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
      case 'urgent':
        return <span className="bg-purple-100 text-purple-900 border border-purple-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Urgente ⚡</span>;
      case 'high':
        return <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Haute 🔴</span>;
      case 'medium':
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Moyenne 🟡</span>;
      case 'low':
      default:
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Basse 🟢</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Header Banner avec création de tâches, jalons et sous-tâches stylées */}
      <TaskHeaderBanner
        onOpenNewProject={() => logic.setIsNewProjectModalOpen(true)}
        onOpenCreateTask={() => {
          logic.setIsMilestoneModalDefault(false);
          logic.setCreateModalDefaultStatus('todo');
          logic.setIsCreateModalOpen(true);
        }}
        onOpenCreateMilestone={() => {
          logic.setIsMilestoneModalDefault(true);
          logic.setCreateModalDefaultStatus('todo');
          logic.setIsCreateModalOpen(true);
        }}
        onOpenCreateSubtask={() => logic.handleOpenCreateSubtask()}
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
        employees={logic.visibleEmployees}
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
          onOpenCreateSubtask={logic.handleOpenCreateSubtask}
          onDeleteTask={logic.handleOpenDeleteModal}
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
          onOpenCreateSubtask={logic.handleOpenCreateSubtask}
          onDeleteTask={logic.handleOpenDeleteModal}
          getPriorityBadge={getPriorityBadge}
        />
      )}

      {/* Mode 3: Vue Rendement & Charge de travail (Mode Asana Pro / Business) */}
      {logic.activeView === 'rendement' && (
        <TaskRendementAnalyticsView
          tasks={logic.filteredTasks}
          employees={logic.visibleEmployees}
          projects={logic.visibleProjects}
          currentUser={currentUser}
          currentRole={currentRole}
        />
      )}

      {/* Modal Création Tâche ou Jalon */}
      <TaskCreateModal
        isOpen={logic.isCreateModalOpen}
        onClose={() => logic.setIsCreateModalOpen(false)}
        onCreateTask={logic.handleCreateTask}
        employees={logic.visibleEmployees}
        projects={logic.visibleProjects}
        defaultProjectId={logic.activeProjectId}
        defaultStatus={logic.createModalDefaultStatus}
        isMilestoneDefault={logic.isMilestoneModalDefault}
        currentRole={currentRole}
        currentUser={currentUser}
      />

      {/* Modal Création Sous-tâche Haute Précision (Style Asana Pro) */}
      <SubtaskCreateModal
        isOpen={logic.isSubtaskModalOpen}
        onClose={() => logic.setIsSubtaskModalOpen(false)}
        onCreateSubtask={logic.handleCreateSubtask}
        employees={logic.visibleEmployees}
        parentTask={logic.taskForSubtaskModal}
        availableTasks={logic.filteredTasks}
        projects={logic.visibleProjects}
        currentUser={currentUser}
        currentRole={currentRole}
      />

      {/* Modal Création Nouveau Module / Projet */}
      <TaskProjectModal
        isOpen={logic.isNewProjectModalOpen}
        onClose={() => logic.setIsNewProjectModalOpen(false)}
        onSaveProject={logic.handleCreateProject}
        employees={logic.visibleEmployees}
      />

      {/* Drawer Fiche Détail */}
      {logic.selectedTaskForDetail && (
        <TaskDetailDrawer
          task={logic.selectedTaskForDetail}
          employees={logic.visibleEmployees}
          projects={logic.visibleProjects}
          onClose={() => logic.setSelectedTaskForDetail(null)}
          onSaveTask={logic.handleSaveTask}
          onDeleteTask={logic.handleOpenDeleteModal}
          showToast={showToast}
          currentRole={currentRole}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
