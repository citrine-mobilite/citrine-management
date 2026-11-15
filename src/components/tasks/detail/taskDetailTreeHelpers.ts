import { Subtask } from '../../../types';

export function updateSubtaskDueDateInTree(list: Subtask[], subId: string, newDueDate: string): Subtask[] {
  return list.map((s) => {
    if (s.id === subId) return { ...s, dueDate: newDueDate, endDate: newDueDate };
    if (s.subtasks && s.subtasks.length > 0) {
      return { ...s, subtasks: updateSubtaskDueDateInTree(s.subtasks, subId, newDueDate) };
    }
    return s;
  });
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

export function updateSubtaskDetailInTree(list: Subtask[], updatedSub: Subtask): Subtask[] {
  return list.map((s) => {
    if (s.id === updatedSub.id) return updatedSub;
    if (s.subtasks && s.subtasks.length > 0) {
      return { ...s, subtasks: updateSubtaskDetailInTree(s.subtasks, updatedSub) };
    }
    return s;
  });
}
