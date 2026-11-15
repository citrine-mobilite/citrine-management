import { useState, useMemo } from 'react';
import { Employee, Presence, Task, AppUser } from '../../../../types';
import { computePresenceStatistics, StatisticsPeriod } from '../statisticsCalculations';
import { computeEmployeeRendement } from '../../../../utils/rendementCalculator';
import { isSelfOnlyUser, findMatchingEmployee, isManagerOrAdminEmployee } from '../../../../utils/roleUtils';

interface UsePresenceStatisticsLogicProps {
  employees: Employee[];
  presences: Presence[];
  tasks: Task[];
  currentUser?: AppUser | null;
  currentRole?: string;
}

export function usePresenceStatisticsLogic({
  employees,
  presences,
  tasks,
  currentUser,
  currentRole,
}: UsePresenceStatisticsLogicProps) {
  const isRestricted = isSelfOnlyUser(currentUser, currentRole);
  const matchedEmp = useMemo(() => findMatchingEmployee(employees, currentUser), [employees, currentUser]);

  const [activeSubTab, setActiveSubTab] = useState<'assiduite' | 'rendement'>('assiduite');
  const [period, setPeriod] = useState<StatisticsPeriod>('this_month');

  const todayStr = new Date().toISOString().split('T')[0];
  const [customStart, setCustomStart] = useState<string>(todayStr);
  const [customEnd, setCustomEnd] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRendementEmployee, setSelectedRendementEmployee] = useState<Employee | null>(null);
  const [timesheetEmployee, setTimesheetEmployee] = useState<Employee | null>(null);
  const [timesheetMode, setTimesheetMode] = useState<'day' | 'month' | 'year'>('month');

  const trackedEmployees = useMemo(() => {
    const base = employees.filter((e) => {
      const st = e.employmentStatus || (typeof e.status === 'string' ? e.status : (e.status ? 'en_poste' : 'parti'));
      const isEnPoste = st === 'en_poste' || st === ('true' as any);
      if (!isEnPoste) return false;
      if (e.roleType === 'sponsor') return false;
      if (!isManagerOrAdminEmployee(e)) return true;

      return presences.some((p) => {
        if (String(p.employeeId) !== String(e.id)) return false;
        if (p.status === 'absent') return false;
        const arr = (p.arrivalTime || '').trim();
        const dep = (p.departureTime || '').trim();
        const hasTime = (arr !== '' && arr !== '—' && arr !== '--:--') || (dep !== '' && dep !== '—' && dep !== '--:--');
        return Boolean(hasTime && (p.status === 'present' || p.status === 'late'));
      });
    });
    if (!isRestricted) return base;
    if (matchedEmp) return [matchedEmp];
    return base.slice(0, 1);
  }, [employees, presences, isRestricted, matchedEmp]);

  const stats = useMemo(
    () => computePresenceStatistics(trackedEmployees, presences, period, customStart, customEnd),
    [trackedEmployees, presences, period, customStart, customEnd]
  );

  const statsByEmployeeList = stats?.statsByEmployee || [];

  const filteredStatsByEmployee = useMemo(() => {
    if (!searchQuery.trim()) return statsByEmployeeList;
    const q = searchQuery.toLowerCase();
    return statsByEmployeeList.filter(
      (s) =>
        s.employee.name.toLowerCase().includes(q) ||
        (s.employee.department && s.employee.department.toLowerCase().includes(q))
    );
  }, [statsByEmployeeList, searchQuery]);

  const employeeRendementMetricsList = useMemo(() => {
    return trackedEmployees.map((emp) => {
      const statRow = statsByEmployeeList.find((s) => s.employee.id === emp.id);
      const empAssiduite = statRow ? statRow.assiduiteRate : 100;
      return computeEmployeeRendement(emp, tasks, empAssiduite, {
        startStr: stats.startStr,
        endStr: stats.endStr,
        period,
      });
    });
  }, [trackedEmployees, tasks, statsByEmployeeList, stats.startStr, stats.endStr, period]);

  const filteredMetricsList = useMemo(() => {
    if (!searchQuery.trim()) return employeeRendementMetricsList;
    const q = searchQuery.toLowerCase();
    return employeeRendementMetricsList.filter(
      (m) =>
        m.employee.name.toLowerCase().includes(q) ||
        (m.employee.department && m.employee.department.toLowerCase().includes(q))
    );
  }, [employeeRendementMetricsList, searchQuery]);

  const dynamicTeamRate = useMemo(() => {
    if (employeeRendementMetricsList.length === 0) return 0;
    const sum = employeeRendementMetricsList.reduce((acc, m) => acc + m.taskRendementRate, 0);
    return Math.round(sum / employeeRendementMetricsList.length);
  }, [employeeRendementMetricsList]);

  const totalSubtasksCount = useMemo(
    () => employeeRendementMetricsList.reduce((sum, m) => sum + m.totalSubtasks, 0),
    [employeeRendementMetricsList]
  );
  const completedSubtasksCount = useMemo(
    () => employeeRendementMetricsList.reduce((sum, m) => sum + m.completedSubtasks, 0),
    [employeeRendementMetricsList]
  );
  const totalAssignedTasksPeriod = useMemo(
    () => employeeRendementMetricsList.reduce((sum, m) => sum + m.totalTasks, 0),
    [employeeRendementMetricsList]
  );
  const totalCompletedTasksPeriod = useMemo(
    () => employeeRendementMetricsList.reduce((sum, m) => sum + m.completedTasks, 0),
    [employeeRendementMetricsList]
  );
  const totalInProgressTasksPeriod = useMemo(
    () => employeeRendementMetricsList.reduce((sum, m) => sum + m.inProgressTasks, 0),
    [employeeRendementMetricsList]
  );
  const totalMilestonesPeriod = useMemo(
    () => employeeRendementMetricsList.reduce((sum, m) => sum + m.milestonesCount, 0),
    [employeeRendementMetricsList]
  );

  const handleOpenTimesheetModal = (employee: Employee, mode: 'day' | 'month' | 'year' = 'month') => {
    setTimesheetEmployee(employee);
    setTimesheetMode(mode);
  };

  return {
    activeSubTab,
    setActiveSubTab,
    period,
    setPeriod,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    searchQuery,
    setSearchQuery,
    selectedRendementEmployee,
    setSelectedRendementEmployee,
    timesheetEmployee,
    setTimesheetEmployee,
    timesheetMode,
    stats,
    statsByEmployeeList,
    filteredStatsByEmployee,
    filteredMetricsList,
    dynamicTeamRate,
    totalSubtasksCount,
    completedSubtasksCount,
    totalAssignedTasksPeriod,
    totalCompletedTasksPeriod,
    totalInProgressTasksPeriod,
    totalMilestonesPeriod,
    handleOpenTimesheetModal,
  };
}
