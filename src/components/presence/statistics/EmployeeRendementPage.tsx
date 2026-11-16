import React from 'react';
import { Employee, Task, Presence, AttendanceIncident, AppUser, NotificationLog, Reminder, StrategicProject } from '../../../types';
import { SubtaskCreateModal } from '../../tasks/SubtaskCreateModal';
import { TaskSheetModal } from '../../tasksheet/TaskSheetModal';
import { TaskTimeSpentHistogram } from './TaskTimeSpentHistogram';
import { TaskTimePyramid } from './TaskTimePyramid';
import { TaskRedundancyPanel } from './TaskRedundancyPanel';
import { useEmployeeRendementLogic } from './rendement/useEmployeeRendementLogic';
import { EmployeeRendementHeader } from './rendement/EmployeeRendementHeader';
import { EmployeeRendementFilters } from './rendement/EmployeeRendementFilters';
import { EmployeeRendementTaskCard } from './rendement/EmployeeRendementTaskCard';

interface EmployeeRendementPageProps {
  employee: Employee;
  tasks: Task[];
  assiduiteRate: number;
  presences?: Presence[];
  incidents?: AttendanceIncident[];
  reminders?: Reminder[];
  strategicProjects?: StrategicProject[];
  notifications?: NotificationLog[];
  onBack: () => void;
  onUpdateTask?: (updatedTask: Task) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
  currentUser?: AppUser | null;
  currentRole?: string;
}

export const EmployeeRendementPage: React.FC<EmployeeRendementPageProps> = ({
  employee,
  tasks,
  assiduiteRate,
  presences = [],
  incidents = [],
  reminders = [],
  strategicProjects = [],
  notifications = [],
  onBack,
  onUpdateTask,
  showToast,
  currentUser,
  currentRole,
}) => {
  const logic = useEmployeeRendementLogic({
    employee,
    tasks,
    assiduiteRate,
    reminders,
    strategicProjects,
    notifications,
    onUpdateTask,
    showToast,
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      <EmployeeRendementHeader
        employee={employee}
        assiduiteRate={assiduiteRate}
        metrics={logic.metrics}
        onBack={onBack}
        onOpenTaskSheet={logic.openTaskSheet}
      />

      <TaskTimeSpentHistogram
        tasks={logic.sortedByRecencyTasks}
        employee={employee}
        title={`Temps Passé par Sous-Tâche — ${employee.name}`}
        maxItems={10}
        showAssigneeInTooltip={false}
        onSelectTask={(entry) => logic.handleSelectFromPyramid(entry.taskId)}
      />

      <div ref={logic.taskDetailSectionRef} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-5">
        <EmployeeRendementFilters
          limitToTen={logic.limitToTen}
          setLimitToTen={logic.setLimitToTen}
          totalFilteredCount={logic.sortedByRecencyTasks.length}
          displayedCount={logic.displayedTasks.length}
          filteredSummary={logic.filteredSummary}
          statusFilter={logic.statusFilter}
          setStatusFilter={logic.setStatusFilter}
          priorityFilter={logic.priorityFilter}
          setPriorityFilter={logic.setPriorityFilter}
          projectFilter={logic.projectFilter}
          setProjectFilter={logic.setProjectFilter}
          projectOptions={logic.projectOptions}
          kindFilter={logic.kindFilter}
          setKindFilter={logic.setKindFilter}
          durationFilter={logic.durationFilter}
          setDurationFilter={logic.setDurationFilter}
          periodFilter={logic.periodFilter}
          setPeriodFilter={logic.setPeriodFilter}
          customStartDate={logic.customStartDate}
          setCustomStartDate={logic.setCustomStartDate}
          customEndDate={logic.customEndDate}
          setCustomEndDate={logic.setCustomEndDate}
          sortBy={logic.sortBy}
          setSortBy={logic.setSortBy}
          searchQuery={logic.searchQuery}
          setSearchQuery={logic.setSearchQuery}
          hasActiveFilters={logic.hasActiveFilters}
          resetFilters={logic.resetFilters}
        />

        <div className="space-y-3">
          {logic.displayedTasks.map((task) => (
            <EmployeeRendementTaskCard
              key={task.id}
              task={task}
              isExpanded={logic.expandedTaskId === task.id}
              todayStr={logic.todayStr}
              newSubtaskTitle={logic.newSubtaskTitles[task.id] || ''}
              newSubtaskDueDate={logic.newSubtaskDueDates[task.id] || ''}
              onToggleExpand={() => logic.setExpandedTaskId(logic.expandedTaskId === task.id ? null : task.id)}
              onStatusChange={logic.handleStatusChange}
              onMilestoneProgressChange={logic.handleMilestoneProgressChange}
              onToggleSubtask={logic.handleToggleSubtask}
              onUpdateSubtaskDueDate={logic.handleUpdateSubtaskDueDate}
              onDeleteSubtask={logic.handleDeleteSubtask}
              onOpenSubtaskModal={logic.setActiveModalTask}
              onQuickTitleChange={(val) => logic.setNewSubtaskTitles({ ...logic.newSubtaskTitles, [task.id]: val })}
              onQuickDueDateChange={(val) => logic.setNewSubtaskDueDates({ ...logic.newSubtaskDueDates, [task.id]: val })}
              onAddSubtask={logic.handleAddSubtask}
            />
          ))}

          {logic.displayedTasks.length === 0 && (
            <div className="text-center py-12 text-stone-400 italic text-xs bg-stone-50 rounded-2xl border border-stone-200/80">
              Aucune tâche ne correspond à vos filtres actuels.
            </div>
          )}
        </div>
      </div>

      <TaskTimePyramid tasks={logic.sortedByRecencyTasks} onSelectTask={logic.handleSelectFromPyramid} />

      <TaskRedundancyPanel
        employee={employee}
        tasks={tasks}
        onUpdateTask={onUpdateTask}
        showToast={showToast}
      />

      {logic.activeModalTask && (
        <SubtaskCreateModal
          isOpen={Boolean(logic.activeModalTask)}
          onClose={() => logic.setActiveModalTask(null)}
          onCreateSubtask={logic.handleCreateSubtaskFromModal}
          employees={[employee]}
          parentTask={logic.activeModalTask}
        />
      )}

      {logic.isTaskSheetOpen && (
        <TaskSheetModal
          isOpen={logic.isTaskSheetOpen}
          onClose={() => logic.setIsTaskSheetOpen(false)}
          employee={employee}
          allTasks={tasks}
          presences={presences}
          incidents={incidents}
          reminders={reminders}
          strategicProjects={strategicProjects}
          notifications={notifications}
          defaultMode={logic.taskSheetMode}
          currentUser={currentUser}
          currentRole={currentRole}
        />
      )}
    </div>
  );
};

export default EmployeeRendementPage;
