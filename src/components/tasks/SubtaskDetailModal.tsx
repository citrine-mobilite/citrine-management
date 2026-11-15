import React from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { Subtask, Employee, TaskProject, AppUser } from '../../types';
import { useSubtaskDetailLogic } from './subtaskDetail/useSubtaskDetailLogic';
import { SubtaskDetailCoreFields } from './subtaskDetail/SubtaskDetailCoreFields';
import { SubtaskDetailIncidentsAndComments } from './subtaskDetail/SubtaskDetailIncidentsAndComments';
import { SubtaskDetailNestedList } from './subtaskDetail/SubtaskDetailNestedList';

interface SubtaskDetailModalProps {
  isOpen: boolean;
  subtask: Subtask | null;
  onClose: () => void;
  onSaveSubtask: (updatedSubtask: Subtask) => void;
  employees: Employee[];
  projects?: TaskProject[];
  showToast?: (message: string, type?: 'success' | 'error') => void;
  currentUser?: AppUser | null;
  currentRole?: string;
}

const SubtaskDetailModalContent: React.FC<
  Omit<SubtaskDetailModalProps, 'isOpen' | 'subtask'> & { subtask: Subtask }
> = ({
  subtask,
  onClose,
  onSaveSubtask,
  employees,
  projects = [],
  showToast,
  currentUser,
  currentRole,
}) => {
  const logic = useSubtaskDetailLogic({
    subtask,
    onClose,
    onSaveSubtask,
    showToast,
    currentUser,
    currentRole,
  });

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-stone-200 flex flex-col p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[#2A7B76]/10 text-[#2A7B76] border border-[#2A7B76]/20">
              📋 Détail de la Sous-Tâche
            </span>
            {logic.isBlocked && (
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Bloquée
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={logic.handleSave} className="space-y-4 text-xs flex-1">
          <SubtaskDetailCoreFields
            subtask={subtask}
            canReassign={logic.canReassign}
            employees={employees}
            draftTitle={logic.draftTitle}
            setDraftTitle={logic.setDraftTitle}
            draftDescription={logic.draftDescription}
            setDraftDescription={logic.setDraftDescription}
            draftStatus={logic.draftStatus}
            setDraftStatus={logic.setDraftStatus}
            setIsBlocked={logic.setIsBlocked}
            draftPriority={logic.draftPriority}
            setDraftPriority={logic.setDraftPriority}
            draftStartDate={logic.draftStartDate}
            setDraftStartDate={logic.setDraftStartDate}
            draftDueDate={logic.draftDueDate}
            setDraftDueDate={logic.setDraftDueDate}
            draftActualHours={logic.draftActualHours}
            setDraftActualHours={logic.setDraftActualHours}
            draftAssignedTo={logic.draftAssignedTo}
            setDraftAssignedTo={logic.setDraftAssignedTo}
          />

          <SubtaskDetailIncidentsAndComments
            subtask={subtask}
            canReassign={logic.canReassign}
            isAssignedToCurrentUser={logic.isAssignedToCurrentUser}
            incidents={logic.incidents}
            blockerText={logic.blockerText}
            setBlockerText={logic.setBlockerText}
            onSignalBlocker={logic.handleSignalBlocker}
            onRemoveIncident={logic.handleRemoveIncident}
            comments={logic.comments}
            newCommentText={logic.newCommentText}
            setNewCommentText={logic.setNewCommentText}
            onAddComment={logic.handleAddComment}
          />

          <SubtaskDetailNestedList
            displayedSubtasks={logic.displayedSubtasks}
            hiddenCount={logic.hiddenCount}
            totalCount={logic.totalCount}
            subtaskFilterPeriod={logic.subtaskFilterPeriod}
            setSubtaskFilterPeriod={logic.setSubtaskFilterPeriod}
            draftDueDate={logic.draftDueDate}
            newSubtaskTitle={logic.newSubtaskTitle}
            setNewSubtaskTitle={logic.setNewSubtaskTitle}
            onAddSubtask={logic.handleAddSubtask}
            onToggleSubtask={logic.handleToggleSubtask}
            onSelectNestedSubtask={logic.setSelectedNestedSubtask}
            onDeleteSubtask={(subId) =>
              logic.setSubtasks(logic.subtasks.filter((s) => s.id !== subId))
            }
          />

          <div className="pt-3">
            <button
              type="submit"
              className="w-full bg-[#2A7B76] hover:bg-[#236864] text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Enregistrer les modifications</span>
            </button>
          </div>
        </form>

        {logic.selectedNestedSubtask && (
          <SubtaskDetailModal
            isOpen={true}
            subtask={logic.selectedNestedSubtask}
            onClose={() => logic.setSelectedNestedSubtask(null)}
            onSaveSubtask={(updatedNested) => {
              const updateInTree = (list: Subtask[]): Subtask[] =>
                list.map((s) => {
                  if (s.id === updatedNested.id) return updatedNested;
                  if (s.subtasks && s.subtasks.length > 0) {
                    return { ...s, subtasks: updateInTree(s.subtasks) };
                  }
                  return s;
                });
              const updatedSubtasks = updateInTree(logic.subtasks);
              logic.setSubtasks(updatedSubtasks);
              logic.setSelectedNestedSubtask(updatedNested);
              onSaveSubtask({
                ...subtask,
                subtasks: updatedSubtasks,
              });
            }}
            employees={employees}
            projects={projects}
            showToast={showToast}
            currentUser={currentUser}
            currentRole={currentRole}
          />
        )}
      </div>
    </div>
  );
};

export const SubtaskDetailModal: React.FC<SubtaskDetailModalProps> = ({
  isOpen,
  subtask,
  ...rest
}) => {
  if (!isOpen || !subtask) return null;
  return <SubtaskDetailModalContent subtask={subtask} {...rest} />;
};

export default SubtaskDetailModal;
