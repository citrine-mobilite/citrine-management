import React, { useState, useEffect, useMemo } from 'react';
import { Subtask, TaskStatus, TaskPriority, Comment, AppUser, Incident } from '../../../types';
import { canManageTaskAssignment, isSelfOnlyUser } from '../../../utils/roleUtils';
import { filterAndSortSubtasks } from '../../../utils/subtaskFilterUtils';
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

  const [draftTitle, setDraftTitle] = useState(subtask.title);
  const [draftDescription, setDraftDescription] = useState(subtask.description || '');
  const [draftStatus, setDraftStatus] = useState<TaskStatus>(
    subtask.status || (subtask.completed ? 'completed' : 'todo')
  );
  const [draftPriority, setDraftPriority] = useState<TaskPriority>(subtask.priority || 'medium');
  const [draftAssignedTo, setDraftAssignedTo] = useState(subtask.assignedTo || 'Équipe');
  const [draftStartDate, setDraftStartDate] = useState(
    subtask.startDate || new Date().toISOString().split('T')[0]
  );
  const [draftDueDate, setDraftDueDate] = useState(
    subtask.dueDate || subtask.endDate || new Date().toISOString().split('T')[0]
  );
  const [draftActualHours, setDraftActualHours] = useState<number>(subtask.actualHours ?? 0);
  const [incidents, setIncidents] = useState<Incident[]>(subtask.incidents || []);
  const [blockerText, setBlockerText] = useState('');
  const [isBlocked, setIsBlocked] = useState(
    subtask.status === 'blocked' ||
      !!subtask.blockerReason ||
      (subtask.incidents && subtask.incidents.length > 0)
  );
  const [subtasks, setSubtasks] = useState<Subtask[]>(subtask.subtasks || []);
  const [subtaskFilterPeriod, setSubtaskFilterPeriod] = useState<'last3days' | 'all'>('last3days');
  const [comments, setComments] = useState<Comment[]>(subtask.comments || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [selectedNestedSubtask, setSelectedNestedSubtask] = useState<Subtask | null>(null);

  const { displayedSubtasks, hiddenCount, totalCount } = useMemo(
    () => filterAndSortSubtasks(subtasks, subtaskFilterPeriod, draftDueDate),
    [subtasks, subtaskFilterPeriod, draftDueDate]
  );

  useEffect(() => {
    setDraftTitle(subtask.title);
    setDraftDescription(subtask.description || '');
    setDraftStatus(subtask.status || (subtask.completed ? 'completed' : 'todo'));
    setDraftPriority(subtask.priority || 'medium');
    setDraftAssignedTo(subtask.assignedTo || 'Équipe');
    setDraftStartDate(subtask.startDate || new Date().toISOString().split('T')[0]);
    setDraftDueDate(subtask.dueDate || subtask.endDate || new Date().toISOString().split('T')[0]);
    setDraftActualHours(subtask.actualHours ?? 0);
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
    draftActualHours,
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
    setSubtasks([...subtasks, createNestedSubtaskItem(newSubtaskTitle, draftDueDate)]);
    setNewSubtaskTitle('');
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
    canReassign, isAssignedToCurrentUser,
    draftTitle, setDraftTitle, draftDescription, setDraftDescription,
    draftStatus, setDraftStatus, draftPriority, setDraftPriority,
    draftAssignedTo, setDraftAssignedTo, draftStartDate, setDraftStartDate,
    draftDueDate, setDraftDueDate, draftActualHours, setDraftActualHours,
    incidents, blockerText, setBlockerText, isBlocked, setIsBlocked,
    subtasks, setSubtasks, subtaskFilterPeriod, setSubtaskFilterPeriod,
    comments, newSubtaskTitle, setNewSubtaskTitle,
    newCommentText, setNewCommentText,
    selectedNestedSubtask, setSelectedNestedSubtask,
    displayedSubtasks, hiddenCount, totalCount,
    handleSignalBlocker, handleRemoveIncident, handleSave,
    handleAddSubtask, handleToggleSubtask, handleAddComment,
  };
}
