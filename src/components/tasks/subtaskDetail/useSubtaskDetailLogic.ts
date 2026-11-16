import React, { useState, useEffect, useMemo } from 'react';
import {
  Subtask,
  TaskStatus,
  TaskPriority,
  TaskRecurrence,
  Comment,
  AppUser,
  Incident,
} from '../../../types';
import { canManageTaskAssignment, isSelfOnlyUser } from '../../../utils/roleUtils';
import {
  filterAndSortSubtasks,
  getCurrentWeekBounds,
  SubtaskFilterPeriod,
} from '../../../utils/subtaskFilterUtils';
import {
  buildUpdatedSubtaskPayload,
  createNestedSubtaskItem,
  createSubtaskComment,
  createSubtaskIncident,
  toggleSubtaskInTree,
} from './subtaskDetailHelpers';

interface UseSubtaskDetailLogicProps {
  subtask: Subtask;
  onClose: () => void;
  onSaveSubtask: (updatedSubtask: Subtask) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
  currentUser?: AppUser | null;
  currentRole?: string;
}

export function useSubtaskDetailLogic({
  subtask,
  onClose,
  onSaveSubtask,
  showToast,
  currentUser,
  currentRole,
}: UseSubtaskDetailLogicProps) {
  const canReassign = canManageTaskAssignment(currentUser, currentRole);
  const isEmpOrIntern = isSelfOnlyUser(currentUser, currentRole);
  const isAssignedToCurrentUser =
    !currentUser ||
    !subtask.assignedTo ||
    subtask.assignedTo.includes(currentUser.name) ||
    subtask.assignedTo === 'Équipe' ||
    isEmpOrIntern;

  const todayIso = new Date().toISOString().split('T')[0];
  const currentWeekBounds = useMemo(() => getCurrentWeekBounds(), []);

  const [draftTitle, setDraftTitle] = useState(subtask.title);
  const [draftDescription, setDraftDescription] = useState(subtask.description || '');
  const [draftStatus, setDraftStatus] = useState<TaskStatus>(
    subtask.status || (subtask.completed ? 'completed' : 'todo')
  );
  const [draftPriority, setDraftPriority] = useState<TaskPriority>(subtask.priority || 'medium');
  const [draftAssignedTo, setDraftAssignedTo] = useState(subtask.assignedTo || 'Équipe');
  const [draftStartDate, setDraftStartDate] = useState(subtask.startDate || todayIso);
  const [draftDueDate, setDraftDueDate] = useState(subtask.dueDate || subtask.endDate || todayIso);
  const [draftTime, setDraftTime] = useState(subtask.time || '09:00');
  const [draftEstimatedHours, setDraftEstimatedHours] = useState<number>(subtask.estimatedHours ?? 2);
  const [draftActualHours, setDraftActualHours] = useState<number>(subtask.actualHours ?? 0);
  const [draftTags, setDraftTags] = useState<string[]>(subtask.tags || []);
  const [draftDependsOnIds, setDraftDependsOnIds] = useState<string[]>(subtask.dependsOnIds || []);
  const [draftRecurrence, setDraftRecurrence] = useState<TaskRecurrence>(subtask.recurrence || 'none');
  const [draftFollowerIds, setDraftFollowerIds] = useState<string[]>(subtask.followerIds || []);
  const [draftCriteria, setDraftCriteria] = useState<string[]>(subtask.acceptanceCriteria || []);

  const [incidents, setIncidents] = useState<Incident[]>(subtask.incidents || []);
  const [blockerText, setBlockerText] = useState('');
  const [isBlocked, setIsBlocked] = useState(
    subtask.status === 'blocked' ||
      !!subtask.blockerReason ||
      (subtask.incidents && subtask.incidents.length > 0)
  );
  const [subtasks, setSubtasks] = useState<Subtask[]>(subtask.subtasks || []);
  const [subtaskFilterPeriod, setSubtaskFilterPeriod] = useState<SubtaskFilterPeriod>('current_week');
  const [subtaskFilterDate, setSubtaskFilterDate] = useState<string>(todayIso);
  const [subtaskRangeStart, setSubtaskRangeStart] = useState<string>(currentWeekBounds.startIso);
  const [subtaskRangeEnd, setSubtaskRangeEnd] = useState<string>(currentWeekBounds.endIso);

  const [comments, setComments] = useState<Comment[]>(subtask.comments || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [selectedNestedSubtask, setSelectedNestedSubtask] = useState<Subtask | null>(null);

  const { displayedSubtasks, hiddenCount, totalCount, activeRangeLabel } = useMemo(
    () =>
      filterAndSortSubtasks(
        subtasks,
        {
          period: subtaskFilterPeriod,
          specificDate: subtaskFilterDate,
          startDate: subtaskRangeStart,
          endDate: subtaskRangeEnd,
        },
        draftDueDate
      ),
    [subtasks, subtaskFilterPeriod, subtaskFilterDate, subtaskRangeStart, subtaskRangeEnd, draftDueDate]
  );

  useEffect(() => {
    const fallbackToday = new Date().toISOString().split('T')[0];
    setDraftTitle(subtask.title);
    setDraftDescription(subtask.description || '');
    setDraftStatus(subtask.status || (subtask.completed ? 'completed' : 'todo'));
    setDraftPriority(subtask.priority || 'medium');
    setDraftAssignedTo(subtask.assignedTo || 'Équipe');
    setDraftStartDate(subtask.startDate || fallbackToday);
    setDraftDueDate(subtask.dueDate || subtask.endDate || fallbackToday);
    setDraftTime(subtask.time || '09:00');
    setDraftEstimatedHours(subtask.estimatedHours ?? 2);
    setDraftActualHours(subtask.actualHours ?? 0);
    setDraftTags(subtask.tags || []);
    setDraftDependsOnIds(subtask.dependsOnIds || []);
    setDraftRecurrence(subtask.recurrence || 'none');
    setDraftFollowerIds(subtask.followerIds || []);
    setDraftCriteria(subtask.acceptanceCriteria || []);
    setIncidents(subtask.incidents || []);
    setIsBlocked(
      subtask.status === 'blocked' ||
        !!subtask.blockerReason ||
        (subtask.incidents && subtask.incidents.length > 0)
    );
    setSubtasks(subtask.subtasks || []);
    setComments(subtask.comments || []);
  }, [subtask]);

  const draftBase = {
    subtask,
    draftTitle,
    draftDescription,
    draftStatus,
    draftPriority,
    canReassign,
    draftAssignedTo,
    draftStartDate,
    draftDueDate,
    draftTime,
    draftEstimatedHours,
    draftActualHours,
    draftTags,
    draftDependsOnIds,
    draftRecurrence,
    draftFollowerIds,
    draftCriteria,
    incidents,
    subtasks,
    comments,
  };

  const handleSignalBlocker = () => {
    if (!blockerText.trim()) return;
    const newInc = createSubtaskIncident(blockerText);
    const updatedInc = [...incidents, newInc];
    setIncidents(updatedInc);
    setIsBlocked(true);
    setDraftStatus('blocked');
    setBlockerText('');

    onSaveSubtask(
      buildUpdatedSubtaskPayload(draftBase, {
        status: 'blocked',
        incidents: updatedInc,
        isBlocked: true,
        blockerReason: newInc.title,
      })
    );
    if (showToast) showToast('Difficulté signalée : la sous-tâche est passée en "Bloquée".', 'error');
  };

  const handleRemoveIncident = (incId: string) => {
    const updatedInc = incidents.filter((i) => i.id !== incId);
    setIncidents(updatedInc);
    const stillBlocked = updatedInc.length > 0;
    setIsBlocked(stillBlocked);
    const newStatus: TaskStatus = stillBlocked
      ? 'blocked'
      : draftStatus === 'blocked'
      ? 'in_progress'
      : draftStatus;
    setDraftStatus(newStatus);

    onSaveSubtask(
      buildUpdatedSubtaskPayload(draftBase, {
        status: newStatus,
        incidents: updatedInc,
        isBlocked: stillBlocked,
        blockerReason: stillBlocked ? updatedInc[updatedInc.length - 1].title : undefined,
      })
    );
    if (showToast) showToast('Blocage retiré.', 'success');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle.trim()) {
      if (showToast) showToast('Le titre ne peut pas être vide.', 'error');
      return;
    }
    const finalStatus = incidents.length > 0 ? 'blocked' : draftStatus;
    onSaveSubtask(
      buildUpdatedSubtaskPayload(draftBase, {
        status: finalStatus,
        incidents,
        isBlocked: incidents.length > 0,
        blockerReason: incidents.length > 0 ? incidents[incidents.length - 1].title : undefined,
        completedAt:
          finalStatus === 'completed' ? subtask.completedAt || new Date().toISOString() : undefined,
      })
    );
    if (showToast) showToast('Sous-tâche mise à jour avec succès !', 'success');
    onClose();
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([createNestedSubtaskItem(newSubtaskTitle, draftDueDate), ...subtasks]);
    setNewSubtaskTitle('');
  };

  const handleAddRichNestedSubtask = (richSub: Subtask) => {
    const updated = [richSub, ...subtasks];
    setSubtasks(updated);
    onSaveSubtask({ ...subtask, subtasks: updated });
  };

  const handleToggleSubtask = (subId: string) => {
    const updated = toggleSubtaskInTree(subtasks, subId);
    setSubtasks(updated);
    onSaveSubtask({ ...subtask, subtasks: updated });
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    setComments([...comments, createSubtaskComment(currentUser?.name, newCommentText)]);
    setNewCommentText('');
  };

  return {
    canReassign,
    isAssignedToCurrentUser,
    draftTitle,
    setDraftTitle,
    draftDescription,
    setDraftDescription,
    draftStatus,
    setDraftStatus,
    draftPriority,
    setDraftPriority,
    draftAssignedTo,
    setDraftAssignedTo,
    draftStartDate,
    setDraftStartDate,
    draftDueDate,
    setDraftDueDate,
    draftTime,
    setDraftTime,
    draftEstimatedHours,
    setDraftEstimatedHours,
    draftActualHours,
    setDraftActualHours,
    draftTags,
    setDraftTags,
    draftDependsOnIds,
    setDraftDependsOnIds,
    draftRecurrence,
    setDraftRecurrence,
    draftFollowerIds,
    setDraftFollowerIds,
    draftCriteria,
    setDraftCriteria,
    incidents,
    blockerText,
    setBlockerText,
    isBlocked,
    setIsBlocked,
    subtasks,
    setSubtasks,
    subtaskFilterPeriod,
    setSubtaskFilterPeriod,
    subtaskFilterDate,
    setSubtaskFilterDate,
    subtaskRangeStart,
    setSubtaskRangeStart,
    subtaskRangeEnd,
    setSubtaskRangeEnd,
    comments,
    newSubtaskTitle,
    setNewSubtaskTitle,
    newCommentText,
    setNewCommentText,
    selectedNestedSubtask,
    setSelectedNestedSubtask,
    displayedSubtasks,
    hiddenCount,
    totalCount,
    activeRangeLabel,
    handleSignalBlocker,
    handleRemoveIncident,
    handleSave,
    handleAddSubtask,
    handleAddRichNestedSubtask,
    handleToggleSubtask,
    handleAddComment,
  };
}
