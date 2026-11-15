import { Task, Employee } from '../../../types';
import { getTaskDynamicProgress } from '../../../utils/rendementCalculator';

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
  totalHours: number;
  actualHours: number;
  completionRate: number;
  capacityStatus: 'overloaded' | 'optimal' | 'available';
  saturationPercentage: number;
}

export function computeTaskAnalyticsMetrics(filteredTasks: Task[], effectiveEmployees: Employee[]) {
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
  const completedMilestones = milestones.filter(
    (m) => m.status === 'completed' || (m.milestoneProgress ?? 0) >= 100
  ).length;
  const avgMilestoneProgress =
    milestones.length > 0
      ? Math.round(
          milestones.reduce(
            (sum, m) => sum + (m.milestoneProgress ?? (m.status === 'completed' ? 100 : 0)),
            0
          ) / milestones.length
        )
      : 0;

  const today = new Date().toISOString().split('T')[0];
  const onTimeTasks = filteredTasks.filter((t) => {
    if (t.status === 'completed') return true;
    if (!t.date && !t.dueDate) return true;
    const due = t.dueDate || t.date;
    return due >= today;
  }).length;
  const onTimeRate = totalTasks > 0 ? Math.round((onTimeTasks / totalTasks) * 100) : 100;

  const workloadStats: WorkloadStatRow[] = effectiveEmployees
    .map((emp) => {
      const empTasks = filteredTasks.filter(
        (t) =>
          t.employeeId === emp.id || t.assignedTo === emp.name || t.assignedTo === emp.email
      );
      const empSubtasks = allSubtasks.filter(
        (s) => s.assignedTo === emp.name || s.employeeId === emp.id
      );

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

      const totalWorkloadHours = Math.max(subtasksHours + mainTasksWithoutSubtasksCount, 0);
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

      return {
        employee: emp,
        totalTasks: totalAssignedTasks,
        completedTasks: completedTaskCount,
        totalSubtasks: totalAssignedSubtasks,
        completedSubtasks: completedSubtaskCount,
        subtasksHours,
        mainTasksHours: mainTasksWithoutSubtasksCount,
        totalHours: totalWorkloadHours,
        actualHours: subtasksActualHours,
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
    completedMilestones,
    avgMilestoneProgress,
    onTimeRate,
    workloadStats,
  };
}
