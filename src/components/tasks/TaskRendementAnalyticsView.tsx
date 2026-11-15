import React, { useState, useMemo } from 'react';
import { Task, Employee, TaskProject, AppUser } from '../../types';
import { isSelfOnlyUser, findMatchingEmployee } from '../../utils/roleUtils';
import { computeTaskAnalyticsMetrics } from './analytics/rendementAnalyticsUtils';
import { AnalyticsBannerAndKpis } from './analytics/AnalyticsBannerAndKpis';
import { AnalyticsWorkloadTab } from './analytics/AnalyticsWorkloadTab';
import {
  AnalyticsMilestonesTab,
  AnalyticsVelocityTab,
} from './analytics/AnalyticsMilestonesAndVelocityTabs';

interface TaskRendementAnalyticsViewProps {
  tasks: Task[];
  employees: Employee[];
  projects?: TaskProject[];
  currentUser?: AppUser | null;
  currentRole?: string;
}

export const TaskRendementAnalyticsView: React.FC<TaskRendementAnalyticsViewProps> = ({
  tasks,
  employees,
  projects = [],
  currentUser,
  currentRole,
}) => {
  const isRestricted = isSelfOnlyUser(currentUser, currentRole);
  const matchedEmp = useMemo(
    () => findMatchingEmployee(employees, currentUser),
    [employees, currentUser]
  );
  const effectiveEmployees = useMemo(() => {
    if (!isRestricted) return employees;
    if (matchedEmp) return [matchedEmp];
    return employees.slice(0, 1);
  }, [isRestricted, matchedEmp, employees]);

  const [activeTab, setActiveTab] = useState<'workload' | 'milestones' | 'velocity'>('workload');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [capacityFilter, setCapacityFilter] = useState<'all' | 'overloaded' | 'available' | 'optimal'>('all');

  const filteredTasks = useMemo(() => {
    if (selectedProjectId === 'all') return tasks;
    return tasks.filter((t) => t.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  const metrics = useMemo(
    () => computeTaskAnalyticsMetrics(filteredTasks, effectiveEmployees),
    [filteredTasks, effectiveEmployees]
  );

  const displayedWorkload = useMemo(() => {
    if (capacityFilter === 'all') return metrics.workloadStats;
    return metrics.workloadStats.filter((w) => w.capacityStatus === capacityFilter);
  }, [metrics.workloadStats, capacityFilter]);

  const overloadedCount = metrics.workloadStats.filter((w) => w.capacityStatus === 'overloaded').length;
  const availableCount = metrics.workloadStats.filter((w) => w.capacityStatus === 'available').length;
  const optimalCount = metrics.workloadStats.filter((w) => w.capacityStatus === 'optimal').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <AnalyticsBannerAndKpis
        isRestricted={isRestricted}
        globalCompletionRate={metrics.globalCompletionRate}
        overloadedCount={overloadedCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        milestonesCount={metrics.milestones.length}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        projects={projects}
        totalTasks={metrics.totalTasks}
        completedTasks={metrics.completedTasks}
        totalSubtasks={metrics.totalSubtasks}
        completedSubtasks={metrics.completedSubtasks}
        onTimeRate={metrics.onTimeRate}
        subtasksCompletionRate={metrics.subtasksCompletionRate}
        avgMilestoneProgress={metrics.avgMilestoneProgress}
        completedMilestones={metrics.completedMilestones}
      />

      {activeTab === 'workload' && (
        <AnalyticsWorkloadTab
          workloadStats={metrics.workloadStats}
          displayedWorkload={displayedWorkload}
          capacityFilter={capacityFilter}
          setCapacityFilter={setCapacityFilter}
          overloadedCount={overloadedCount}
          optimalCount={optimalCount}
          availableCount={availableCount}
        />
      )}

      {activeTab === 'milestones' && (
        <AnalyticsMilestonesTab
          milestones={metrics.milestones}
          completedMilestones={metrics.completedMilestones}
        />
      )}

      {activeTab === 'velocity' && (
        <AnalyticsVelocityTab
          filteredTasks={filteredTasks}
          totalTasks={metrics.totalTasks}
          totalSubtasks={metrics.totalSubtasks}
          completedSubtasks={metrics.completedSubtasks}
          subtasksCompletionRate={metrics.subtasksCompletionRate}
          workloadStats={metrics.workloadStats}
          onTimeRate={metrics.onTimeRate}
        />
      )}
    </div>
  );
};

export default TaskRendementAnalyticsView;
