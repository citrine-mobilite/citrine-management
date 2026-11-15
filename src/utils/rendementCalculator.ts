import { Employee, Task } from '../types';
import {
  EmployeeRendementMetrics,
  RendementPeriodFilter,
  isTaskAssignedToEmployee,
  getTaskDynamicProgress,
} from './rendementTaskHelpers';
import {
  filterTasksForRendementPeriod,
  aggregateAssignedTaskCounters,
} from './rendementPeriodFilter';

export type { EmployeeRendementMetrics, RendementPeriodFilter };
export { isTaskAssignedToEmployee, getTaskDynamicProgress };

export function computeEmployeeRendement(
  employee: Employee,
  allTasks: Task[],
  assiduiteRate: number = 100,
  periodFilter?: RendementPeriodFilter
): EmployeeRendementMetrics {
  const rawAssignedTasks = allTasks.filter((t) => isTaskAssignedToEmployee(t, employee));

  let assignedTasks = rawAssignedTasks;
  let totalWorkUnits = 0;
  let completedWorkUnits = 0;
  let hasActivity = false;

  if (periodFilter && periodFilter.startStr && periodFilter.endStr) {
    const filtered = filterTasksForRendementPeriod(rawAssignedTasks, employee, periodFilter);
    assignedTasks = filtered.relevantTasks;
    totalWorkUnits = filtered.totalWorkUnits;
    completedWorkUnits = filtered.completedWorkUnits;
    hasActivity = filtered.hasActivity;
  } else {
    assignedTasks.forEach((t) => {
      if (t.subtasks && t.subtasks.length > 0) {
        totalWorkUnits += t.subtasks.length;
        t.subtasks.forEach((s) => {
          if (s.completed || s.status === 'completed') completedWorkUnits++;
        });
      } else {
        totalWorkUnits += 1;
        if (t.status === 'completed' || (t as any).completed === true) completedWorkUnits++;
      }
    });
    hasActivity = totalWorkUnits > 0 || assignedTasks.length > 0;
  }

  const counters = aggregateAssignedTaskCounters(assignedTasks);

  const taskRendementRate =
    !hasActivity || totalWorkUnits === 0
      ? 0
      : Math.round((completedWorkUnits / totalWorkUnits) * 100);

  const globalCombinedScore =
    hasActivity && totalWorkUnits > 0
      ? Math.round(0.5 * assiduiteRate + 0.5 * taskRendementRate)
      : Math.round(assiduiteRate * 0.5);

  let capacityStatus: 'overloaded' | 'optimal' | 'available' = 'optimal';
  if (counters.estimatedHoursTotal > 50) {
    capacityStatus = 'overloaded';
  } else if (counters.estimatedHoursTotal < 30) {
    capacityStatus = 'available';
  }

  return {
    employee,
    assignedTasks,
    totalTasks: assignedTasks.length,
    ...counters,
    taskRendementRate,
    assiduiteRate,
    globalCombinedScore,
    capacityStatus,
    hasActivity,
  };
}
