import React from 'react';
import { Employee, Presence, Task, AttendanceIncident, AppUser } from '../types';
import { StatisticsKPIRibbon } from './presence/statistics/StatisticsKPIRibbon';
import { StatisticsChartsSection } from './presence/statistics/StatisticsChartsSection';
import { StatisticsEmployeeRankTable } from './presence/statistics/StatisticsEmployeeRankTable';
import EmployeeRendementPage from './presence/statistics/EmployeeRendementPage';
import { TimesheetModal } from './timesheet/TimesheetModal';
import { usePresenceStatisticsLogic } from './presence/statistics/overview/usePresenceStatisticsLogic';
import { PresenceStatisticsHeader } from './presence/statistics/overview/PresenceStatisticsHeader';
import { PresenceStatisticsRendementTab } from './presence/statistics/overview/PresenceStatisticsRendementTab';

interface PresenceStatisticsViewProps {
  employees: Employee[];
  presences: Presence[];
  tasks?: Task[];
  incidents?: AttendanceIncident[];
  onSelectEmployee?: (id: string) => void;
  onUpdateTask?: (task: Task) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
  currentUser?: AppUser | null;
  currentRole?: string;
}

export function PresenceStatisticsView({
  employees,
  presences,
  tasks = [],
  incidents = [],
  onSelectEmployee,
  onUpdateTask,
  showToast,
  currentUser,
  currentRole,
}: PresenceStatisticsViewProps) {
  const logic = usePresenceStatisticsLogic({
    employees,
    presences,
    tasks,
    currentUser,
    currentRole,
  });

  if (logic.selectedRendementEmployee) {
    const statRow = logic.statsByEmployeeList.find(
      (s) => s.employee.id === logic.selectedRendementEmployee!.id
    );
    const empAssiduite = statRow ? statRow.assiduiteRate : 100;

    return (
      <EmployeeRendementPage
        employee={logic.selectedRendementEmployee}
        tasks={tasks}
        assiduiteRate={empAssiduite}
        presences={presences}
        incidents={incidents}
        onBack={() => logic.setSelectedRendementEmployee(null)}
        onUpdateTask={onUpdateTask}
        showToast={showToast}
        currentUser={currentUser}
        currentRole={currentRole}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      <PresenceStatisticsHeader
        activeSubTab={logic.activeSubTab}
        setActiveSubTab={logic.setActiveSubTab}
        period={logic.period}
        setPeriod={logic.setPeriod}
        customStart={logic.customStart}
        setCustomStart={logic.setCustomStart}
        customEnd={logic.customEnd}
        setCustomEnd={logic.setCustomEnd}
        searchQuery={logic.searchQuery}
        setSearchQuery={logic.setSearchQuery}
        dynamicTeamRate={logic.dynamicTeamRate}
      />

      {logic.activeSubTab === 'assiduite' ? (
        <>
          <StatisticsKPIRibbon
            overallPresent={logic.stats.overallPresent}
            overallLate={logic.stats.overallLate}
            avgAssiduite={logic.stats.avgAssiduite}
            avgPonctualite={logic.stats.avgPonctualite}
          />
          <StatisticsChartsSection statsByEmployee={logic.stats.statsByEmployee} />
          <StatisticsEmployeeRankTable
            stats={logic.filteredStatsByEmployee}
            onSelectEmployee={onSelectEmployee}
          />
        </>
      ) : (
        <PresenceStatisticsRendementTab
          filteredMetricsList={logic.filteredMetricsList}
          dynamicTeamRate={logic.dynamicTeamRate}
          totalSubtasksCount={logic.totalSubtasksCount}
          completedSubtasksCount={logic.completedSubtasksCount}
          totalAssignedTasksPeriod={logic.totalAssignedTasksPeriod}
          totalCompletedTasksPeriod={logic.totalCompletedTasksPeriod}
          totalInProgressTasksPeriod={logic.totalInProgressTasksPeriod}
          totalMilestonesPeriod={logic.totalMilestonesPeriod}
          onSelectRendementEmployee={(emp) => logic.setSelectedRendementEmployee(emp)}
          onOpenTimesheetModal={logic.handleOpenTimesheetModal}
          onSelectEmployee={onSelectEmployee}
        />
      )}

      {logic.timesheetEmployee && (
        <TimesheetModal
          isOpen={Boolean(logic.timesheetEmployee)}
          onClose={() => logic.setTimesheetEmployee(null)}
          employee={logic.timesheetEmployee}
          allTasks={tasks}
          presences={presences}
          incidents={incidents}
          defaultMode={logic.timesheetMode}
          currentUser={currentUser}
          currentRole={currentRole}
        />
      )}
    </div>
  );
}

export default PresenceStatisticsView;
