import { Task, Employee, NotificationLog, Reminder, StrategicProject } from '../../../types';
import { getTaskDynamicProgress } from '../../../utils/rendementCalculator';
import {
  extractStrategicMilestones,
  StrategicMilestoneEntry,
} from '../../../services/reminders/reminderActivityUtils';
import {
  computeImportantPointsPeriodSummary,
  mergeRemindersWithLocalMovements,
} from '../../../services/taskSheet/importantPointsUtils';

export const STANDARD_WEEKLY_CAPACITY = 60;
export const OVERLOAD_WEEKLY_THRESHOLD = 50;

export interface WorkloadStatRow {
  employee: Employee;
  totalTasks: number;
  completedTasks: number;
  totalSubtasks: number;
  completedSubtasks: number;
  subtasksHours: number;
  mainTasksHours: number;
  remindersHours: number;
  totalHours: number;
  actualHours: number;
  completionRate: number;
  capacityStatus: 'overloaded' | 'optimal' | 'available';
  saturationPercentage: number;
}

export function computeTaskAnalyticsMetrics(
  filteredTasks: Task[],
  effectiveEmployees: Employee[],
  reminders: Reminder[] = [],
  strategicProjects: StrategicProject[] = [],
  notifications: NotificationLog[] = []
) {
  const allSubtasks = filteredTasks.flatMap((t) => t.subtasks || []);

  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter((t) => t.status === 'completed').length;
  const dynamicProgressSum = filteredTasks.reduce((sum, t) => sum + getTaskDynamicProgress(t), 0);
  const globalCompletionRate = totalTasks > 0 ? Math.round(dynamicProgressSum / totalTasks) : 0;

  const totalSubtasks = allSubtasks.length;
  const completedSubtasks = allSubtasks.filter((s) => s.completed).length;
  const subtasksCompletionRate =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const milestones = filteredTasks.filter((t) => t.isMilestone);
  const strategicMilestones: StrategicMilestoneEntry[] = extractStrategicMilestones(strategicProjects);

  const completedTaskMilestones = milestones.filter(
    (m) => m.status === 'completed' || (m.milestoneProgress ?? 0) >= 100
  ).length;
  const completedStrategicMilestones = strategicMilestones.filter((m) => m.isDone).length;

  const totalMilestonesCount = milestones.length + strategicMilestones.length;
  const completedMilestones = completedTaskMilestones + completedStrategicMilestones;

  const taskMilestoneProgressSum = milestones.reduce(
    (sum, m) => sum + (m.milestoneProgress ?? (m.status === 'completed' ? 100 : 0)),
    0
  );
  const strategicMilestoneProgressSum = strategicMilestones.reduce(
    (sum, m) => sum + (m.isDone ? 100 : m.status === 'in_progress' ? 50 : 0),
    0
  );
  const avgMilestoneProgress =
    totalMilestonesCount > 0
      ? Math.round((taskMilestoneProgressSum + strategicMilestoneProgressSum) / totalMilestonesCount)
      : 0;

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const onTimeTasks = filteredTasks.filter((t) => {
    if (t.status === 'completed') return true;
    if (!t.date && !t.dueDate) return true;
    const due = t.dueDate || t.date;
    return due >= today;
  }).length;
  const onTimeRate = totalTasks > 0 ? Math.round((onTimeTasks / totalTasks) * 100) : 100;

  let totalRemindersCount = 0;
  let totalRemindersHours = 0;

  const workloadStats: WorkloadStatRow[] = effectiveEmployees
    .map((emp) => {
      const empTasks = filteredTasks.filter(
        (t) =>
          t.employeeId === emp.id || t.assignedTo === emp.name || t.assignedTo === emp.email
      );
      const empSubtasks = allSubtasks.filter(
        (s) => s.assignedTo === emp.name || s.employeeId === emp.id
      );

      const mergedReminders = mergeRemindersWithLocalMovements(reminders, emp.id);
      const ptsSummary = computeImportantPointsPeriodSummary({
        employee: emp,
        startIso: weekAgo,
        endIso: today,
        reminders: mergedReminders,
        notifications,
        maxRecentItems: 5,
      });
      totalRemindersCount += ptsSummary.totalPoints;
      totalRemindersHours += ptsSummary.totalHours;

      const totalAssignedTasks = empTasks.length;
      const completedTaskCount = empTasks.filter((t) => t.status === 'completed').length;
      const totalAssignedSubtasks = empSubtasks.length;
      const completedSubtaskCount = empSubtasks.filter((s) => s.completed).length;

      const subtasksHours = empSubtasks.reduce(
        (sum, s) => sum + (Number(s.estimatedHours) || 1.5),
        0
      );
      const subtasksActualHours = empSubtasks.reduce(
        (sum, s) => sum + (Number(s.actualHours) || 0),
        0
      );
      const mainTasksWithoutSubtasksCount = empTasks.filter(
        (t) => !t.subtasks || t.subtasks.length === 0
      ).length;

      const totalWorkloadHours = Math.round(
        Math.max(subtasksHours + mainTasksWithoutSubtasksCount + ptsSummary.totalHours, 0) * 10
      ) / 10;
      const empDynamicProgressSum = empTasks.reduce(
        (sum, t) => sum + getTaskDynamicProgress(t),
        0
      );
      const combinedRate =
        totalAssignedTasks > 0 ? Math.round(empDynamicProgressSum / totalAssignedTasks) : 0;

      let capacityStatus: 'overloaded' | 'optimal' | 'available' = 'optimal';
      if (totalWorkloadHours > OVERLOAD_WEEKLY_THRESHOLD) {
        capacityStatus = 'overloaded';
      } else if (totalWorkloadHours < 30) {
        capacityStatus = 'available';
      }

      const resolvedPointsHours =
        ptsSummary.totalPoints > 0
          ? Math.round(((ptsSummary.resolvedCount / ptsSummary.totalPoints) * ptsSummary.totalHours) * 10) / 10
          : 0;

      return {
        employee: emp,
        totalTasks: totalAssignedTasks,
        completedTasks: completedTaskCount,
        totalSubtasks: totalAssignedSubtasks,
        completedSubtasks: completedSubtaskCount,
        subtasksHours,
        mainTasksHours: mainTasksWithoutSubtasksCount,
        remindersHours: ptsSummary.totalHours,
        totalHours: totalWorkloadHours,
        actualHours: Math.round((subtasksActualHours + resolvedPointsHours) * 10) / 10,
        completionRate: combinedRate,
        capacityStatus,
        saturationPercentage: Math.round((totalWorkloadHours / STANDARD_WEEKLY_CAPACITY) * 100),
      };
    })
    .sort((a, b) => b.totalHours - a.totalHours);

  return {
    totalTasks,
    completedTasks,
    globalCompletionRate,
    totalSubtasks,
    completedSubtasks,
    subtasksCompletionRate,
    milestones,
    strategicMilestones,
    totalMilestonesCount,
    completedMilestones,
    avgMilestoneProgress,
    onTimeRate,
    totalRemindersCount,
    totalRemindersHours: Math.round(totalRemindersHours * 10) / 10,
    workloadStats,
  };
}
