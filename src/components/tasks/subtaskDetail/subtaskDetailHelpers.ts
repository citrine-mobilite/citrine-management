import { Comment, Incident, Subtask, TaskPriority, TaskRecurrence, TaskStatus } from '../../../types';

export interface SubtaskDraftParams {
  subtask: Subtask;
  draftTitle: string;
  draftDescription: string;
  draftStatus: TaskStatus;
  draftPriority: TaskPriority;
  canReassign: boolean;
  draftAssignedTo: string;
  draftStartDate: string;
  draftDueDate: string;
  draftTime: string;
  draftEstimatedHours: number;
  draftActualHours: number;
  draftTags: string[];
  draftDependsOnIds: string[];
  draftRecurrence: TaskRecurrence;
  draftFollowerIds: string[];
  draftCriteria: string[];
  incidents: Incident[];
  subtasks: Subtask[];
  comments: Comment[];
}

export function buildUpdatedSubtaskPayload(
  params: SubtaskDraftParams,
  overrides: {
    status: TaskStatus;
    incidents: Incident[];
    isBlocked: boolean;
    blockerReason?: string;
    completedAt?: string;
  }
): Subtask {
  const {
    subtask,
    draftTitle,
    draftDescription,
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
    subtasks,
    comments,
  } = params;

  return {
    ...subtask,
    title: draftTitle.trim() || subtask.title,
    description: draftDescription.trim() || undefined,
    status: overrides.status,
    completed: overrides.status === 'completed',
    completedAt: overrides.completedAt,
    priority: draftPriority,
    assignedTo: canReassign ? draftAssignedTo : subtask.assignedTo || 'Équipe',
    startDate: draftStartDate,
    dueDate: draftDueDate,
    endDate: draftDueDate,
    time: draftTime || '09:00',
    estimatedHours: Number(draftEstimatedHours) || 0,
    actualHours: Number(draftActualHours) || 0,
    tags: draftTags.length > 0 ? draftTags : undefined,
    dependsOnIds: draftDependsOnIds.length > 0 ? draftDependsOnIds : undefined,
    recurrence: draftRecurrence,
    followerIds: draftFollowerIds.length > 0 ? draftFollowerIds : undefined,
    acceptanceCriteria: draftCriteria.length > 0 ? draftCriteria : undefined,
    incidents: overrides.incidents,
    isBlocked: overrides.isBlocked,
    blockerReason: overrides.blockerReason,
    subtasks,
    comments,
  };
}

export function toggleSubtaskInTree(list: Subtask[], subId: string): Subtask[] {
  return list.map((s) => {
    if (s.id === subId) {
      const nextCompleted = !s.completed;
      return {
        ...s,
        completed: nextCompleted,
        status: nextCompleted ? 'completed' : 'todo',
        completedAt: nextCompleted ? new Date().toISOString() : undefined,
      };
    }
    if (s.subtasks && s.subtasks.length > 0) {
      return { ...s, subtasks: toggleSubtaskInTree(s.subtasks, subId) };
    }
    return s;
  });
}

export function createSubtaskIncident(title: string): Incident {
  return {
    id: `inc-${Date.now()}`,
    title: title.trim(),
    description: title.trim(),
    severity: 'high',
    createdAt: new Date().toLocaleDateString('fr-FR'),
    resolved: false,
  };
}

export function createNestedSubtaskItem(title: string, dueDate: string): Subtask {
  const nowIso = new Date().toISOString();
  return {
    id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim(),
    completed: false,
    priority: 'medium',
    status: 'todo',
    startDate: nowIso.split('T')[0],
    dueDate,
    endDate: dueDate,
    time: '09:00',
    createdAt: nowIso,
    subtasks: [],
  };
}

export function createSubtaskComment(author: string | undefined, text: string): Comment {
  return {
    id: `com-${Date.now()}`,
    author: author || 'Collaborateur',
    text: text.trim(),
    timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
}
