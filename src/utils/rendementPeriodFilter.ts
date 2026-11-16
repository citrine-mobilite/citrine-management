import { Employee, Task, Subtask } from '../types';
import {
  RendementPeriodFilter,
  isTaskAssignedToEmployee,
  getItemCompletionDate,
  computeTaskTimeEntry,
  round1,
} from './rendementTaskHelpers';

export function filterTasksForRendementPeriod(
  rawAssignedTasks: Task[],
  employee: Employee,
  periodFilter: RendementPeriodFilter
) {
  const { startStr, endStr } = periodFilter;
  const isSingleDay = startStr === endStr;
  const relevantTasks: Task[] = [];
  let totalWorkUnits = 0;
  let completedWorkUnits = 0;
  let hasActivity = false;

  rawAssignedTasks.forEach((t) => {
    const subs = t.subtasks || [];
    const empSubs = subs.filter(
      (s) => isTaskAssignedToEmployee(s, employee) || isTaskAssignedToEmployee(t, employee)
    );
    const effectiveSubs = empSubs.length > 0 ? empSubs : subs;

    if (effectiveSubs.length > 0) {
      const periodSubs: Subtask[] = [];

      effectiveSubs.forEach((sub) => {
        const compDate = getItemCompletionDate(sub, t.date);
        const isDone = Boolean(sub.completed || sub.status === 'completed' || (sub.status as string) === 'fait');
        const isInProgress = sub.status === 'in_progress' || sub.status === 'en_cours';
        const isBlocked = sub.status === 'blocked' || sub.isBlocked;

        if (isSingleDay) {
          const isCompletedThisDay =
            isDone && (compDate === startStr || (!compDate && (t.date === startStr || (sub as any).date === startStr)));
          const isProgressThisDay = isInProgress && (!compDate || compDate >= startStr);

          if (isCompletedThisDay) {
            hasActivity = true;
            completedWorkUnits++;
            totalWorkUnits++;
            periodSubs.push(sub);
          } else if (isProgressThisDay) {
            hasActivity = true;
            totalWorkUnits++;
            periodSubs.push(sub);
          } else if (isBlocked && ((sub as any).date === startStr || t.date === startStr)) {
            hasActivity = true;
            totalWorkUnits++;
            periodSubs.push(sub);
          }
        } else {
          const isCompletedInRange = isDone && compDate && compDate >= startStr && compDate <= endStr;
          const isProgressInRange = isInProgress;
          const isDueInRange =
            (sub.dueDate && sub.dueDate >= startStr && sub.dueDate <= endStr) ||
            (t.date && t.date >= startStr && t.date <= endStr);

          if (isCompletedInRange) {
            hasActivity = true;
            completedWorkUnits++;
            totalWorkUnits++;
            periodSubs.push(sub);
          } else if (isProgressInRange) {
            hasActivity = true;
            totalWorkUnits++;
            periodSubs.push(sub);
          } else if (isDueInRange) {
            totalWorkUnits++;
            if (isDone) completedWorkUnits++;
            periodSubs.push(sub);
          }
        }
      });

      if (periodSubs.length > 0) {
        relevantTasks.push({ ...t, subtasks: periodSubs });
      }
    } else {
      const compDate = getItemCompletionDate(t);
      const isDone = Boolean(t.status === 'completed' || (t as any).completed === true);
      const isInProgress =
        t.status === 'in_progress' || t.status === 'en_cours' || t.status === 'pending_validation';
      const isBlocked = t.status === 'blocked';

      if (isSingleDay) {
        const isCompletedThisDay = isDone && (compDate === startStr || (!compDate && t.date === startStr));
        const isProgressThisDay = isInProgress;

        if (isCompletedThisDay) {
          hasActivity = true;
          completedWorkUnits++;
          totalWorkUnits++;
          relevantTasks.push(t);
        } else if (isProgressThisDay) {
          hasActivity = true;
          totalWorkUnits++;
          relevantTasks.push(t);
        } else if (isBlocked && t.date === startStr) {
          hasActivity = true;
          totalWorkUnits++;
          relevantTasks.push(t);
        }
      } else {
        const isCompletedInRange = isDone && compDate && compDate >= startStr && compDate <= endStr;
        const isProgressInRange = isInProgress;
        const isDueInRange =
          (t.dueDate && t.dueDate >= startStr && t.dueDate <= endStr) ||
          (t.date && t.date >= startStr && t.date <= endStr);

        if (isCompletedInRange) {
          hasActivity = true;
          completedWorkUnits++;
          totalWorkUnits++;
          relevantTasks.push(t);
        } else if (isProgressInRange || isDueInRange) {
          if (isProgressInRange) hasActivity = true;
          totalWorkUnits++;
          if (isDone) completedWorkUnits++;
          relevantTasks.push(t);
        }
      }
    }
  });

  return { relevantTasks, totalWorkUnits, completedWorkUnits, hasActivity };
}

export function aggregateAssignedTaskCounters(assignedTasks: Task[]) {
  const todayStr = new Date().toISOString().split('T')[0];
  let completedTasks = 0;
  let inProgressTasks = 0;
  let todoTasks = 0;
  let blockedTasks = 0;
  let overdueTasks = 0;
  let totalSubtasks = 0;
  let completedSubtasks = 0;
  let milestonesCount = 0;
  let completedMilestones = 0;
  let estimatedHoursTotal = 0;
  let actualHoursTotal = 0;
  let effectiveHoursSpent = 0;
  let progressSum = 0;
  let topTimeTaskTitle: string | null = null;
  let topTimeTaskHours = 0;

  (assignedTasks || []).forEach((t) => {
    const isCompleted =
      t.status === 'completed' ||
      (t as any).completed === true ||
      Boolean(t.subtasks && t.subtasks.length > 0 && t.subtasks.every((s) => s.completed || s.status === 'completed'));

    if (isCompleted) {
      completedTasks++;
    } else if (t.status === 'in_progress' || t.status === 'en_cours' || t.status === 'pending_validation') {
      inProgressTasks++;
    } else if (t.status === 'blocked') {
      blockedTasks++;
    } else {
      todoTasks++;
    }

    if (!isCompleted && t.dueDate && t.dueDate < todayStr) {
      overdueTasks++;
    }

    if (t.isMilestone) {
      milestonesCount++;
      if (isCompleted || (typeof t.milestoneProgress === 'number' && t.milestoneProgress >= 100)) {
        completedMilestones++;
      }
    }

    if (t.subtasks && t.subtasks.length > 0) {
      totalSubtasks += t.subtasks.length;
      t.subtasks.forEach((s) => {
        if (s.completed || s.status === 'completed') completedSubtasks++;
      });
    }

    const timeEntry = computeTaskTimeEntry(t);
    estimatedHoursTotal += timeEntry.estimatedHours;
    actualHoursTotal += timeEntry.actualHours;
    effectiveHoursSpent += timeEntry.effectiveHours;
    progressSum += timeEntry.progress;

    const rankHours = timeEntry.effectiveHours > 0 ? timeEntry.effectiveHours : timeEntry.estimatedHours;
    if (rankHours > topTimeTaskHours) {
      topTimeTaskHours = rankHours;
      topTimeTaskTitle = timeEntry.title;
    }
  });

  const avgTaskProgress =
    assignedTasks.length > 0 ? Math.round(progressSum / assignedTasks.length) : 0;

  return {
    completedTasks,
    inProgressTasks,
    todoTasks,
    blockedTasks,
    overdueTasks,
    totalSubtasks,
    completedSubtasks,
    milestonesCount,
    completedMilestones,
    estimatedHoursTotal: round1(estimatedHoursTotal),
    actualHoursTotal: round1(actualHoursTotal),
    effectiveHoursSpent: round1(effectiveHoursSpent),
    avgTaskProgress,
    topTimeTaskTitle,
    topTimeTaskHours: round1(topTimeTaskHours),
  };
}
