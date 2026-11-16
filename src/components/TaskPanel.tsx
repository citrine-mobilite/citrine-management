import React, { useMemo, useState } from 'react';
import { Task, NotificationLog, Employee, TaskPriority, AppUser } from '../types';
import {
  TaskStatsCards,
  TaskKanbanBoard,
  TaskTableView,
  TaskTimelineView,
  TaskCalendarView,
  TaskMyTasksView,
  TaskInboxView,
  TaskProjectRulesModal,
  synthesizeTaskInboxItems,
  TaskDetailDrawer,
  TaskCreateModal,
  TaskProjectModal,
  TaskProjectBar,
  TaskFilterBar,
  TaskHeaderBanner,
  TaskRendementAnalyticsView,
  SubtaskCreateModal,
  useTaskLogic,
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
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  const logic = useTaskLogic({
    tasks,
    onUpdateTasks,
    onAddNotification,
    currentRole,
    employees,
    currentUser,
    showToast,
  });

  const inboxCount = useMemo(() => synthesizeTaskInboxItems(tasks).length, [tasks]);

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'urgent':
        return (
          <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap">
            Urgente
          </span>
        );
      case 'high':
      case 'haut':
        return (
          <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap">
            Haute
          </span>
        );
      case 'medium':
        return (
          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap">
            Moyenne
          </span>
        );
      case 'low':
      default:
        return (
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap">
            Basse
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {logic.activeView !== 'rendement' && (
        <TaskHeaderBanner
          onOpenNewProject={() => logic.setIsNewProjectModalOpen(true)}
          onOpenCreateTask={() => {
            logic.setCreateModalDefaultStatus('todo');
            logic.setIsCreateModalOpen(true);
          }}
          onOpenCreateSubtask={() => logic.handleOpenCreateSubtask()}
          onSendTaskSheet={logic.handleSendManualTaskSheet}
        />
      )}

      <TaskProjectBar
        projects={logic.visibleProjects}
        activeProjectId={logic.activeProjectId}
        onSelectProject={logic.setActiveProjectId}
        activeView={logic.activeView}
        onChangeView={logic.setActiveView}
        tasks={tasks}
        inboxCount={inboxCount}
        onOpenNewProject={() => logic.setIsNewProjectModalOpen(true)}
        onOpenProjectRules={() => setIsRulesModalOpen(true)}
      />

      {logic.activeView !== 'rendement' && (
        <>
          <TaskStatsCards tasks={logic.filteredTasks} />

          <TaskFilterBar
            searchTerm={logic.searchTerm}
            onSearchChange={logic.setSearchTerm}
            filterPriority={logic.filterPriority}
            onPriorityChange={logic.setFilterPriority}
            filterAssignee={logic.filterAssignee}
            onAssigneeChange={logic.setFilterAssignee}
            filterType={logic.filterType}
            onTypeChange={logic.setFilterType}
            filterDatePeriod={logic.filterDatePeriod}
            onDatePeriodChange={logic.setFilterDatePeriod}
            employees={logic.visibleEmployees}
          />
        </>
      )}

      {logic.activeView === 'list' && (
        <TaskTableView
          tasks={logic.filteredTasks}
          projects={logic.visibleProjects}
          activeProject={logic.activeProject}
          employees={logic.visibleEmployees}
          onStatusChange={logic.handleStatusChange}
          onSelectTask={logic.openTaskDetail}
          onSilentSaveTask={logic.handleSilentSaveTask}
          onMoveTask={logic.handleMoveTask}
          onQuickCreateTask={logic.handleQuickCreateTask}
          onToggleSubtaskAtPath={logic.handleToggleSubtaskAtPath}
          onUpdateSubtaskAtPath={logic.handleUpdateSubtaskAtPath}
          onInlineAddSubtask={logic.handleInlineAddSubtask}
          onDeleteSubtaskAtPath={logic.handleDeleteSubtaskAtPath}
          onAddSection={logic.handleAddSection}
          onRenameSection={logic.handleRenameSection}
          onDeleteSection={logic.handleDeleteSection}
          onOpenCreateSubtask={logic.handleOpenCreateSubtask}
          onDeleteTask={logic.handleOpenDeleteModal}
          getPriorityBadge={getPriorityBadge}
        />
      )}

      {logic.activeView === 'kanban' && (
        <TaskKanbanBoard
          tasks={logic.filteredTasks}
          activeProject={logic.activeProject}
          onStatusChange={logic.handleStatusChange}
          onSelectTask={logic.openTaskDetail}
          onMoveTask={logic.handleMoveTask}
          onQuickCreateTask={logic.handleQuickCreateTask}
          onToggleSubtaskAtPath={logic.handleToggleSubtaskAtPath}
          onInlineAddSubtask={logic.handleInlineAddSubtask}
          onAddSection={logic.handleAddSection}
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

      {logic.activeView === 'timeline' && (
        <TaskTimelineView
          tasks={logic.filteredTasks}
          activeProject={logic.activeProject}
          onSelectTask={logic.openTaskDetail}
          onStatusChange={logic.handleStatusChange}
          onToggleSubtaskAtPath={logic.handleToggleSubtaskAtPath}
          onUpdateSubtaskAtPath={logic.handleUpdateSubtaskAtPath}
          onMoveTask={logic.handleMoveTask}
        />
      )}

      {logic.activeView === 'calendar' && (
        <TaskCalendarView
          tasks={logic.filteredTasks}
          onSelectTask={logic.openTaskDetail}
          onStatusChange={logic.handleStatusChange}
          onToggleSubtaskAtPath={logic.handleToggleSubtaskAtPath}
          onUpdateSubtaskAtPath={logic.handleUpdateSubtaskAtPath}
          onMoveTask={logic.handleMoveTask}
          onQuickCreateTask={logic.handleQuickCreateTask}
        />
      )}

      {logic.activeView === 'mytasks' && (
        <TaskMyTasksView
          tasks={logic.filteredTasks}
          projects={logic.visibleProjects}
          employees={logic.visibleEmployees}
          currentUser={currentUser}
          currentRole={currentRole}
          onSelectTask={logic.openTaskDetail}
          onStatusChange={logic.handleStatusChange}
          onToggleSubtaskAtPath={logic.handleToggleSubtaskAtPath}
          onMoveTask={logic.handleMoveTask}
          onQuickCreateTask={logic.handleQuickCreateTask}
        />
      )}

      {logic.activeView === 'inbox' && (
        <TaskInboxView
          tasks={tasks}
          onSelectTask={logic.openTaskDetail}
        />
      )}

      {logic.activeView === 'rendement' && (
        <TaskRendementAnalyticsView
          tasks={logic.filteredTasks}
          employees={logic.visibleEmployees}
          projects={logic.visibleProjects}
          currentUser={currentUser}
          currentRole={currentRole}
        />
      )}

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
        existingTasks={tasks}
      />

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

      <TaskProjectModal
        isOpen={logic.isNewProjectModalOpen}
        onClose={() => logic.setIsNewProjectModalOpen(false)}
        onSaveProject={logic.handleCreateProject}
        employees={logic.visibleEmployees}
      />

      <TaskProjectRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        project={logic.activeProject}
        onToggleRule={logic.handleToggleProjectRule}
        onAddSection={logic.handleAddSection}
        onDeleteSection={logic.handleDeleteSection}
      />

      {logic.selectedTaskForDetail && (
        <TaskDetailDrawer
          task={logic.selectedTaskForDetail}
          subtaskPath={logic.selectedSubtaskPath}
          onNavigatePath={logic.setSelectedSubtaskPath}
          allTasks={tasks}
          employees={logic.visibleEmployees}
          projects={logic.visibleProjects}
          onClose={logic.closeTaskDetail}
          onSaveTask={logic.handleSaveTask}
          onSilentSaveTask={logic.handleSilentSaveTask}
          onToggleSubtaskAtPath={logic.handleToggleSubtaskAtPath}
          onUpdateSubtaskAtPath={logic.handleUpdateSubtaskAtPath}
          onInlineAddSubtask={logic.handleInlineAddSubtask}
          onDeleteSubtaskAtPath={logic.handleDeleteSubtaskAtPath}
          onReorderSubtasksAtPath={logic.handleReorderSubtasksAtPath}
          onPromoteSubtaskToTask={logic.handlePromoteSubtaskToTask}
          onDeleteTask={logic.handleOpenDeleteModal}
          showToast={showToast}
          currentRole={currentRole}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
