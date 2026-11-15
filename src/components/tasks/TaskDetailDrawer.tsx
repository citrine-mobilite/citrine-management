import React from 'react';
import { X, Trash2, CheckCircle2 } from 'lucide-react';
import { Task, Employee, TaskProject, AppUser } from '../../types';
import { SubtaskCreateModal } from './SubtaskCreateModal';
import { SubtaskDetailModal } from './SubtaskDetailModal';
import { useTaskDetailLogic } from './detail/useTaskDetailLogic';
import { TaskDetailFormFields } from './detail/TaskDetailFormFields';
import { TaskDetailSubtasksSection } from './detail/TaskDetailSubtasksSection';
import { TaskDetailCommentsAndBlockers } from './detail/TaskDetailCommentsAndBlockers';

interface TaskDetailDrawerProps {
  task: Task | null;
  employees: Employee[];
  projects: TaskProject[];
  onClose: () => void;
  onSaveTask: (updatedTask: Task) => void;
  onDeleteTask: (task: Task) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
  currentRole?: string;
  currentUser?: AppUser | null;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = (props) => {
  if (!props.task) return null;
  return <TaskDetailDrawerContent {...props} task={props.task} />;
};

interface TaskDetailDrawerContentProps extends Omit<TaskDetailDrawerProps, 'task'> {
  task: Task;
}

const TaskDetailDrawerContent: React.FC<TaskDetailDrawerContentProps> = ({
  task,
  employees,
  projects,
  onClose,
  onSaveTask,
  onDeleteTask,
  showToast,
  currentRole,
  currentUser,
}) => {
  const logic = useTaskDetailLogic({ task, employees, projects, onSaveTask, showToast, currentRole, currentUser });

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/35 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-stone-200 flex flex-col p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              📌 Fiche Détail Tâche
            </span>
            {logic.isSavedRecently && (
              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="h-3.5 w-3.5" /> Enregistré !
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={logic.handleSaveAll} className="space-y-4 text-xs flex-1">
          <TaskDetailFormFields
            task={task}
            projects={projects}
            eligibleEmployees={logic.eligibleEmployees}
            canReassign={logic.canReassign}
            draftTitle={logic.draftTitle}
            setDraftTitle={logic.setDraftTitle}
            draftDescription={logic.draftDescription}
            setDraftDescription={logic.setDraftDescription}
            draftStatus={logic.draftStatus}
            setDraftStatus={logic.setDraftStatus}
            draftPriority={logic.draftPriority}
            setDraftPriority={logic.setDraftPriority}
            draftProjectId={logic.draftProjectId}
            setDraftProjectId={logic.setDraftProjectId}
            draftDate={logic.draftDate}
            setDraftDate={logic.setDraftDate}
            draftAssignedList={logic.draftAssignedList}
            setDraftAssignedList={logic.setDraftAssignedList}
          />

          <TaskDetailSubtasksSection
            taskDate={task.date}
            displayedSubtasks={logic.displayedSubtasks}
            hiddenCount={logic.hiddenCount}
            totalCount={logic.totalCount}
            subtaskFilterPeriod={logic.subtaskFilterPeriod}
            setSubtaskFilterPeriod={logic.setSubtaskFilterPeriod}
            newSubtaskTitle={logic.newSubtaskTitle}
            setNewSubtaskTitle={logic.setNewSubtaskTitle}
            quickSubtaskDueDate={logic.quickSubtaskDueDate}
            setQuickSubtaskDueDate={logic.setQuickSubtaskDueDate}
            onToggleSubtask={logic.handleToggleSubtask}
            onSelectSubtaskForDetail={logic.setSelectedSubtaskForDetail}
            onUpdateSubtaskDueDate={logic.handleUpdateSubtaskDueDate}
            onDeleteSubtask={logic.handleDeleteSubtask}
            onOpenSubtaskModal={() => logic.setIsSubtaskModalOpen(true)}
            onAddSubtask={logic.handleAddSubtask}
          />

          <TaskDetailCommentsAndBlockers
            taskAssignedTo={task.assignedTo}
            canReassign={logic.canReassign}
            isAssignedToCurrentUser={logic.isAssignedToCurrentUser}
            comments={logic.comments}
            newCommentText={logic.newCommentText}
            setNewCommentText={logic.setNewCommentText}
            onAddComment={logic.handleAddComment}
            incidents={logic.incidents}
            blockerText={logic.blockerText}
            setBlockerText={logic.setBlockerText}
            onSignalBlocker={logic.handleSignalBlocker}
            onDeleteBlocker={logic.handleDeleteBlocker}
          />
        </form>

        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onDeleteTask(task);
              onClose();
            }}
            className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Supprimer la tâche</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs hover:bg-stone-200 transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>

      <SubtaskCreateModal
        isOpen={logic.isSubtaskModalOpen}
        onClose={() => logic.setIsSubtaskModalOpen(false)}
        onCreateSubtask={logic.handleCreateSubtask}
        employees={employees}
        parentTask={task}
        projects={projects}
        currentUser={currentUser}
        currentRole={currentRole}
      />

      {logic.selectedSubtaskForDetail && (
        <SubtaskDetailModal
          isOpen={true}
          subtask={logic.selectedSubtaskForDetail}
          onClose={() => logic.setSelectedSubtaskForDetail(null)}
          onSaveSubtask={logic.handleSaveSubtaskDetail}
          employees={employees}
          projects={projects}
          showToast={showToast}
          currentUser={currentUser}
          currentRole={currentRole}
        />
      )}
    </div>
  );
};
