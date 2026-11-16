import { Employee, NotificationLog, Reminder, StrategicProject, Task } from '../types';
import {
  EmployeeRendementMetrics,
  RendementPeriodFilter,
  isTaskAssignedToEmployee,
  getTaskDynamicProgress,
  round1,
  safeNum,
} from './rendementTaskHelpers';
import {
  filterTasksForRendementPeriod,
  aggregateAssignedTaskCounters,
} from './rendementPeriodFilter';
import {
  computeEmployeeReminderStatsInRange,
  extractStrategicMilestones,
} from '../services/reminders/reminderActivityUtils';
import {
  computeImportantPointsPeriodSummary,
  mergeRemindersWithLocalMovements,
} from '../services/taskSheet/importantPointsUtils';

export type { EmployeeRendementMetrics, RendementPeriodFilter };
export { isTaskAssignedToEmployee, getTaskDynamicProgress };

export interface ComputeEmployeeRendementOptions {
  reminders?: Reminder[];
  strategicProjects?: StrategicProject[];
  notifications?: NotificationLog[];
}

export function computeEmployeeRendement(
  employee: Employee,
  allTasks: Task[],
  assiduiteRate: number = 100,
  periodFilter?: RendementPeriodFilter,
  options?: ComputeEmployeeRendementOptions
): EmployeeRendementMetrics {
  const safeAssiduite = Math.max(0, Math.min(100, Math.round(safeNum(assiduiteRate, 100))));
  const rawAssignedTasks = (allTasks || []).filter((t) => isTaskAssignedToEmployee(t, employee));

  let assignedTasks = rawAssignedTasks;
  let totalWorkUnits = 0;
  let completedWorkUnits = 0;
  let hasActivity = false;

  if (periodFilter && periodFilter.startStr && periodFilter.endStr) {
    const filtered = filterTasksForRendementPeriod(rawAssignedTasks, employee, periodFilter);
    assignedTasks = filtered.relevantTasks;
    totalWorkUnits = safeNum(filtered.totalWorkUnits, 0);
    completedWorkUnits = safeNum(filtered.completedWorkUnits, 0);
    hasActivity = Boolean(filtered.hasActivity);
  } else {
    assignedTasks.forEach((t) => {
      if (t.subtasks && t.subtasks.length > 0) {
        totalWorkUnits += t.subtasks.length;
        t.subtasks.forEach((s) => {
          if (s.completed || s.status === 'completed') completedWorkUnits++;
        });
      } else {
        totalWorkUnits += 1;
        if (t.status === 'completed' || (t as any).completed === true) {
          completedWorkUnits++;
        } else if (t.isMilestone && typeof t.milestoneProgress === 'number' && Number.isFinite(t.milestoneProgress)) {
          completedWorkUnits += Math.max(0, Math.min(0.95, t.milestoneProgress / 100));
        }
      }
    });
    hasActivity = totalWorkUnits > 0 || assignedTasks.length > 0;
  }

  const counters = aggregateAssignedTaskCounters(assignedTasks);

  // Intégration des jalons de projets stratégiques assignés au collaborateur
  const strategicMilestones = extractStrategicMilestones(
    options?.strategicProjects || [],
    employee,
    periodFilter?.startStr,
    periodFilter?.endStr
  );
  const strategicMilestonesCount = strategicMilestones.length;
  const completedStrategicMilestones = strategicMilestones.filter((m) => m.isDone).length;
  const blockedStrategicMilestones = strategicMilestones.filter((m) => m.isBlocked).length;
  const overdueStrategicMilestones = strategicMilestones.filter((m) => m.isOverdue).length;

  strategicMilestones.forEach((m) => {
    totalWorkUnits += 1;
    if (m.isDone) {
      completedWorkUnits += 1;
      hasActivity = true;
    } else if (m.status === 'in_progress') {
      completedWorkUnits += 0.5;
      hasActivity = true;
    } else if (m.isBlocked) {
      hasActivity = true;
    }
  });

  // Alertes, rappels & petits mouvements : comptés en Points Importants (hors tâches)
  const mergedReminders = mergeRemindersWithLocalMovements(options?.reminders || [], employee.id);
  const reminderStats = computeEmployeeReminderStatsInRange(
    mergedReminders,
    employee,
    periodFilter?.startStr,
    periodFilter?.endStr
  );
  const todayIso = new Date().toISOString().split('T')[0];
  const ptsStart = periodFilter?.startStr || `${todayIso.slice(0, 7)}-01`;
  const ptsEnd = periodFilter?.endStr || todayIso;
  const pointsSummary = computeImportantPointsPeriodSummary({
    employee,
    startIso: ptsStart,
    endIso: ptsEnd,
    reminders: mergedReminders,
    notifications: options?.notifications || [],
  });

  if (reminderStats.totalOccurrences > 0 || pointsSummary.totalPoints > 0) {
    hasActivity = true;
  }

  const pointsHours = Math.max(reminderStats.totalHours, pointsSummary.totalHours);
  const combinedEffectiveHours = round1(counters.effectiveHoursSpent + pointsHours);
  const combinedEstimatedHours = round1(counters.estimatedHoursTotal + pointsHours);
  const totalMilestonesCount = counters.milestonesCount + strategicMilestonesCount;
  const totalCompletedMilestones = counters.completedMilestones + completedStrategicMilestones;
  const totalBlockedMilestones = counters.blockedMilestones + blockedStrategicMilestones;

  // Les alertes, rappels & petits mouvements ne comptent JAMAIS comme des tâches dans le rendement tâche
  const taskRendementRate =
    !hasActivity || totalWorkUnits <= 0
      ? 0
      : Math.max(0, Math.min(100, Math.round((completedWorkUnits / totalWorkUnits) * 100)));

  const globalCombinedScore =
    totalWorkUnits > 0
      ? Math.max(0, Math.min(100, Math.round(0.5 * safeAssiduite + 0.5 * taskRendementRate)))
      : Math.max(0, Math.min(100, Math.round(safeAssiduite * 0.5)));

  let capacityStatus: 'overloaded' | 'optimal' | 'available' = 'optimal';
  if (combinedEstimatedHours > 50) {
    capacityStatus = 'overloaded';
  } else if (combinedEstimatedHours < 30) {
    capacityStatus = 'available';
  }

  return {
    employee,
    assignedTasks,
    totalTasks: assignedTasks.length,
    ...counters,
    milestonesCount: totalMilestonesCount,
    completedMilestones: totalCompletedMilestones,
    blockedMilestones: totalBlockedMilestones,
    strategicMilestonesCount,
    completedStrategicMilestones,
    overdueTasks: counters.overdueTasks + overdueStrategicMilestones,
    remindersCount: reminderStats.totalOccurrences,
    remindersResolvedCount: reminderStats.resolvedCount,
    remindersOverdueCount: reminderStats.overdueCount,
    remindersHoursTotal: reminderStats.totalHours,
    importantPointsCount: pointsSummary.totalPoints,
    importantPointsAlertsCount: pointsSummary.alertsCount,
    importantPointsMovementsCount: pointsSummary.movementsCount,
    importantPointsHoursTotal: pointsHours,
    estimatedHoursTotal: combinedEstimatedHours,
    effectiveHoursSpent: combinedEffectiveHours,
    taskRendementRate,
    assiduiteRate: safeAssiduite,
    globalCombinedScore,
    capacityStatus,
    hasActivity,
  };
}
