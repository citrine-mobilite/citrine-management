import React, { useState, useEffect, useMemo } from 'react';
import { Task, Employee, TaskStatus, TaskPriority, TaskProject, Subtask, Comment, AppUser, Incident } from '../../../types';
import { pushNotificationBridgeService } from '../../../services/pushNotificationBridgeService';
import { canManageTaskAssignment, isSelfOnlyUser } from '../../../utils/roleUtils';
import {
  filterAndSortSubtasks,
  getCurrentWeekBounds,
  SubtaskFilterPeriod,
} from '../../../utils/subtaskFilterUtils';
import {
  updateSubtaskDueDateInTree,
  toggleSubtaskInTree,
  updateSubtaskDetailInTree,
} from './taskDetailTreeHelpers';
import { notifyExceptionalTaskCompletion } from '../../../services/exceptionalTaskCompletionService';

interface UseTaskDetailLogicParams {
  task: Task;
  employees: Employee[];
  projects: TaskProject[];
  onSaveTask: (updatedTask: Task) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
  currentRole?: string;
  currentUser?: AppUser | null;
}

export function useTaskDetailLogic({
  task,
  employees,
  projects,
  onSaveTask,
  showToast,
  currentRole,
  currentUser,
}: UseTaskDetailLogicParams) {
  const canReassign = canManageTaskAssignment(currentUser, currentRole);
  const isEmpOrIntern = isSelfOnlyUser(currentUser, currentRole);
  const isAssignedToCurrentUser =
    !currentUser || !task.assignedTo || task.assignedTo.includes(currentUser.name) || task.assignedTo === 'Équipe' || isEmpOrIntern;

  const [draftTitle, setDraftTitle] = useState(task.title);
  const [draftDescription, setDraftDescription] = useState(task.description || '');
  const [draftStatus, setDraftStatus] = useState<TaskStatus>(task.status);
  const [draftPriority, setDraftPriority] = useState<TaskPriority>(task.priority);
  const [draftAssignedList, setDraftAssignedList] = useState<string[]>(
    task.assignedTo ? task.assignedTo.split(',').map((s) => s.trim()) : ['Équipe']
  );
  const [draftDate, setDraftDate] = useState(task.date);
  const [draftProjectId, setDraftProjectId] = useState(task.projectId || 'general');
  const [draftIsMilestone, setDraftIsMilestone] = useState(!!task.isMilestone);
  const [draftMilestoneTarget, setDraftMilestoneTarget] = useState(task.milestoneTarget || '');
  const [draftMilestoneProgress, setDraftMilestoneProgress] = useState(task.milestoneProgress ?? 0);

  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [comments, setComments] = useState<Comment[]>(task.comments || []);
  const [incidents, setIncidents] = useState<Incident[]>(task.incidents || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [quickSubtaskDueDate, setQuickSubtaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCommentText, setNewCommentText] = useState('');
  const [blockerText, setBlockerText] = useState('');
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [selectedSubtaskForDetail, setSelectedSubtaskForDetail] = useState<Subtask | null>(null);
  const currentWeekBounds = useMemo(() => getCurrentWeekBounds(), []);
  const [subtaskFilterPeriod, setSubtaskFilterPeriod] = useState<SubtaskFilterPeriod>('current_week');
  const [subtaskFilterDate, setSubtaskFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [subtaskRangeStart, setSubtaskRangeStart] = useState<string>(currentWeekBounds.startIso);
  const [subtaskRangeEnd, setSubtaskRangeEnd] = useState<string>(currentWeekBounds.endIso);

  const { displayedSubtasks, hiddenCount, totalCount, activeRangeLabel } = useMemo(() => {
    return filterAndSortSubtasks(
      subtasks,
      {
        period: subtaskFilterPeriod,
        specificDate: subtaskFilterDate,
        startDate: subtaskRangeStart,
        endDate: subtaskRangeEnd,
      },
      task.date
    );
  }, [subtasks, subtaskFilterPeriod, subtaskFilterDate, subtaskRangeStart, subtaskRangeEnd, task.date]);

  useEffect(() => {
    setDraftTitle(task.title);
    setDraftDescription(task.description || '');
    setDraftStatus(task.status);
    setDraftPriority(task.priority);
    setDraftAssignedList(task.assignedTo ? task.assignedTo.split(',').map((s) => s.trim()) : ['Équipe']);
    setDraftDate(task.date);
    setDraftProjectId(task.projectId || 'general');
    setDraftIsMilestone(!!task.isMilestone);
    setDraftMilestoneTarget(task.milestoneTarget || '');
    setDraftMilestoneProgress(task.milestoneProgress ?? 0);
    setSubtasks(task.subtasks || []);
    setComments(task.comments || []);
    setIncidents(task.incidents || []);
  }, [task]);

  const activeProj = projects.find((p) => p.id === draftProjectId);
  const eligibleEmployees =
    activeProj && activeProj.memberIds && activeProj.memberIds.length > 0
      ? employees.filter((e) => activeProj.memberIds!.includes(e.id))
      : employees;

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!draftTitle.trim()) {
      showToast?.('Le titre de la tâche ne peut pas être vide.', 'error');
      return;
    }

    const finalAssigned = canReassign
      ? draftAssignedList.length > 0 ? draftAssignedList.join(', ') : 'Équipe'
      : task.assignedTo || 'Équipe';

    onSaveTask({
      ...task,
      title: draftTitle.trim(),
      description: draftDescription.trim(),
      status: draftStatus,
      priority: draftPriority,
      assignedTo: finalAssigned,
      date: draftDate,
      projectId: draftProjectId,
      isMilestone: draftIsMilestone,
      milestoneTarget: draftMilestoneTarget.trim() || undefined,
      milestoneProgress: draftMilestoneProgress,
      subtasks,
      comments,
      lastUpdatedTime: new Date().toISOString(),
    });
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
    showToast?.('Modifications enregistrées avec succès !', 'success');
  };

  const handleCreateSubtask = (newSub: Subtask) => {
    const updated = [newSub, ...subtasks];
    setSubtasks(updated);
    onSaveTask({ ...task, subtasks: updated });
    showToast?.('Sous-tâche détaillée créée avec succès !', 'success');
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const nowIso = new Date().toISOString();
    const effectiveDueDate = quickSubtaskDueDate || nowIso.split('T')[0];
    const newSub: Subtask = {
      id: `sub-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
      createdAt: nowIso,
      dueDate: effectiveDueDate,
      endDate: effectiveDueDate,
      subtasks: [],
    };
    const updated = [newSub, ...subtasks];
    setSubtasks(updated);
    setNewSubtaskTitle('');
    onSaveTask({ ...task, subtasks: updated });
    showToast?.('Sous-tâche ajoutée avec succès !', 'success');
  };

  const handleUpdateSubtaskDueDate = (subId: string, newDueDate: string) => {
    const updated = updateSubtaskDueDateInTree(subtasks, subId, newDueDate);
    setSubtasks(updated);
    onSaveTask({ ...task, subtasks: updated });
    showToast?.('Date de fin de la sous-tâche mise à jour.', 'success');
  };

  const handleToggleSubtask = (subId: string) => {
    const updated = toggleSubtaskInTree(subtasks, subId);
    setSubtasks(updated);

    const allSubsCompleted = updated.length > 0 && updated.every((s) => s.completed || s.status === 'completed');
    const newStatus: TaskStatus = allSubsCompleted ? 'completed' : task.status === 'completed' ? 'in_progress' : task.status;

    setDraftStatus(newStatus);
    const updatedTaskObj: Task = {
      ...task,
      status: newStatus,
      subtasks: updated,
      completedAt: newStatus === 'completed' ? task.completedAt || new Date().toISOString() : undefined,
    };
    onSaveTask(updatedTaskObj);

    if (newStatus === 'completed' && task.status !== 'completed') {
      notifyExceptionalTaskCompletion(updatedTaskObj, currentUser?.name || task.assignedTo).catch(() => {});
    }
  };

  const handleDeleteSubtask = (subId: string) => {
    const updated = subtasks.filter((s) => s.id !== subId);
    setSubtasks(updated);
    onSaveTask({ ...task, subtasks: updated });
  };

  const handleSaveSubtaskDetail = (updatedSub: Subtask) => {
    const updatedList = updateSubtaskDetailInTree(subtasks, updatedSub);
    setSubtasks(updatedList);
    onSaveTask({ ...task, subtasks: updatedList });
    setSelectedSubtaskForDetail(updatedSub);
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    const newCom: Comment = {
      id: `com-${Date.now()}`,
      author: currentUser?.name || 'Utilisateur',
      text: newCommentText.trim(),
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = [...comments, newCom];
    setComments(updated);
    setNewCommentText('');
    onSaveTask({ ...task, comments: updated });

    const opKey = `task-comment:${task.id}:${newCom.id}`;
    pushNotificationBridgeService.sendPush({
      operationKey: opKey,
      actionKey: opKey,
      title: `Nouveau Commentaire`,
      message: `${newCom.author} a commenté sur la tâche "${task.title}": "${newCom.text}"`,
      type: 'task_comment',
      link: 'tasks',
      suppressLocalNative: true,
      remoteBeams: {
        targetRoles: ['administrateur', 'responsable'],
        targetEmployeeIds: task.employeeId ? [String(task.employeeId)] : undefined,
      },
    });
  };

  const handleSignalBlocker = () => {
    if (!blockerText.trim()) return;
    const newInc: Incident = {
      id: `inc-${Date.now()}`,
      title: blockerText.trim(),
      description: blockerText.trim(),
      severity: 'high',
      createdAt: new Date().toLocaleDateString('fr-FR'),
      resolved: false,
    };
    const updatedInc = [...incidents, newInc];
    setIncidents(updatedInc);
    setDraftStatus('blocked');
    onSaveTask({ ...task, status: 'blocked', incidents: updatedInc });
    setBlockerText('');
    showToast?.('Blocage signalé. Tâche passée en "Bloquée".', 'error');
  };

  const handleDeleteBlocker = (incId: string) => {
    const updatedInc = incidents.filter((i) => i.id !== incId);
    setIncidents(updatedInc);
    onSaveTask({ ...task, incidents: updatedInc, status: updatedInc.length === 0 ? 'in_progress' : 'blocked' });
  };

  return {
    canReassign, isAssignedToCurrentUser, eligibleEmployees,
    draftTitle, setDraftTitle, draftDescription, setDraftDescription,
    draftStatus, setDraftStatus, draftPriority, setDraftPriority,
    draftAssignedList, setDraftAssignedList, draftDate, setDraftDate,
    draftProjectId, setDraftProjectId,
    subtasks, comments, incidents,
    newSubtaskTitle, setNewSubtaskTitle, quickSubtaskDueDate, setQuickSubtaskDueDate,
    newCommentText, setNewCommentText, blockerText, setBlockerText,
    isSavedRecently, isSubtaskModalOpen, setIsSubtaskModalOpen,
    selectedSubtaskForDetail, setSelectedSubtaskForDetail,
    subtaskFilterPeriod, setSubtaskFilterPeriod,
    subtaskFilterDate, setSubtaskFilterDate,
    subtaskRangeStart, setSubtaskRangeStart,
    subtaskRangeEnd, setSubtaskRangeEnd,
    displayedSubtasks, hiddenCount, totalCount, activeRangeLabel,
    handleSaveAll, handleCreateSubtask, handleAddSubtask, handleUpdateSubtaskDueDate,
    handleToggleSubtask, handleDeleteSubtask, handleSaveSubtaskDetail,
    handleAddComment, handleSignalBlocker, handleDeleteBlocker,
  };
}
