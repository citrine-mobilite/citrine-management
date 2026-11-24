import { Employee, NotificationLog, Reminder, StrategicProject, Task } from '../types';
import {
  RendementPeriodFilter,
  EmployeeRendementMetrics,
  isTaskAssignedToEmployee,
  getTaskDynamicProgress,
  round1,
} from './rendementTaskHelpers';
import {
  filterTasksForRendementPeriod,
  aggregateAssignedTaskCounters,
} from './rendementPeriodFilter';
import {
  computeEmployeeReminderStatsInRange,
  extractStrategicMilestones,
} from '../services/reminders/reminderActivityUtils';

export type { RendementPeriodFilter, EmployeeRendementMetrics };
export { isTaskAssignedToEmployee, getTaskDynamicProgress };

export interface ComputeEmployeeRendementContext {
  reminders?: Reminder[];
  strategicProjects?: StrategicProject[];
  notifications?: NotificationLog[];
}

export function computeEmployeeRendement(
  employee: Employee,
  allTasks: Task[],
  assiduiteRate: number = 100,
  periodFilter?: RendementPeriodFilter,
  context: ComputeEmployeeRendementContext = {}
): EmployeeRendementMetrics {
  const safeAllTasks = Array.isArray(allTasks) ? allTasks : [];
  const rawAssignedTasks = safeAllTasks.filter((t) => isTaskAssignedToEmployee(t, employee));

  let assignedTasks: Task[] = rawAssignedTasks;
  let totalWorkUnits = rawAssignedTasks.length;
  let completedWorkUnits = 0;
  let hasTaskActivity = false;

  if (periodFilter && periodFilter.startStr && periodFilter.endStr) {
    const filtered = filterTasksForRendementPeriod(rawAssignedTasks, employee, periodFilter);
    assignedTasks = filtered.relevantTasks;
    totalWorkUnits = filtered.totalWorkUnits;
    completedWorkUnits = filtered.completedWorkUnits;
    hasTaskActivity = filtered.hasActivity;
  } else {
    rawAssignedTasks.forEach((t) => {
      const progress = getTaskDynamicProgress(t);
      if (progress > 0) hasTaskActivity = true;
      completedWorkUnits += progress / 100;
    });
  }

  const counters = aggregateAssignedTaskCounters(assignedTasks);

  const reminderStats = computeEmployeeReminderStatsInRange(
    context.reminders || [],
    employee,
    periodFilter?.startStr,
    periodFilter?.endStr
  );

  const strategicMilestones = extractStrategicMilestones(
    context.strategicProjects || [],
    employee,
    periodFilter?.startStr,
    periodFilter?.endStr
  );

  const importantPointsHoursTotal = round1(reminderStats.totalHours);
  const effectiveHoursSpent = round1(counters.effectiveHoursSpent + importantPointsHoursTotal);
  const estimatedHoursTotal = round1(counters.estimatedHoursTotal + importantPointsHoursTotal);

  const strategicDoneCount = strategicMilestones.filter((m) => m.isDone).length;
  const strategicBlockedCount = strategicMilestones.filter((m) => m.isBlocked).length;

  const taskRendementRate =
    totalWorkUnits > 0
      ? Math.min(100, Math.round((completedWorkUnits / totalWorkUnits) * 100))
      : counters.avgTaskProgress;

  const hasActivity =
    hasTaskActivity ||
    reminderStats.totalOccurrences > 0 ||
    strategicDoneCount > 0 ||
    counters.effectiveHoursSpent > 0;

  const safeAssiduite = Number.isFinite(assiduiteRate) ? Math.round(assiduiteRate) : 100;
  const globalCombinedScore =
    assignedTasks.length > 0 || strategicMilestones.length > 0 || reminderStats.totalOccurrences > 0
      ? Math.round(0.5 * safeAssiduite + 0.5 * taskRendementRate)
      : safeAssiduite;

  let capacityStatus: 'overloaded' | 'optimal' | 'available' = 'optimal';
  if (estimatedHoursTotal > 50) {
    capacityStatus = 'overloaded';
  } else if (estimatedHoursTotal < 30) {
    capacityStatus = 'available';
  }

  return {
    employee,
    assignedTasks,
    totalTasks: assignedTasks.length,
    completedTasks: counters.completedTasks,
    inProgressTasks: counters.inProgressTasks,
    todoTasks: counters.todoTasks,
    blockedTasks: counters.blockedTasks,
    overdueTasks: counters.overdueTasks,
    totalSubtasks: counters.totalSubtasks,
    completedSubtasks: counters.completedSubtasks,
    milestonesCount: counters.milestonesCount + strategicMilestones.length,
    completedMilestones: counters.completedMilestones + strategicDoneCount,
    blockedMilestones: counters.blockedMilestones + strategicBlockedCount,
    strategicMilestonesCount: strategicMilestones.length,
    completedStrategicMilestones: strategicDoneCount,
    remindersCount: reminderStats.totalOccurrences,
    remindersResolvedCount: reminderStats.resolvedCount,
    remindersOverdueCount: reminderStats.overdueCount,
    remindersHoursTotal: reminderStats.totalHours,
    importantPointsCount: reminderStats.uniqueRemindersCount,
    importantPointsAlertsCount: reminderStats.activeCount,
    importantPointsMovementsCount: 0,
    importantPointsHoursTotal,
    estimatedHoursTotal,
    actualHoursTotal: counters.actualHoursTotal,
    effectiveHoursSpent,
    avgTaskProgress: counters.avgTaskProgress,
    topTimeTaskTitle: counters.topTimeTaskTitle,
    topTimeTaskHours: counters.topTimeTaskHours,
    taskRendementRate,
    assiduiteRate: safeAssiduite,
    globalCombinedScore,
    capacityStatus,
    hasActivity,
    periodLabel: periodFilter ? `${periodFilter.startStr} → ${periodFilter.endStr}` : undefined,
  };
}
