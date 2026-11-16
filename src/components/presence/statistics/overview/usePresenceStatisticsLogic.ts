import { useState, useMemo } from 'react';
import { Employee, NotificationLog, Presence, Task, AppUser, Reminder, StrategicProject } from '../../../../types';
import { computePresenceStatistics, EmployeeStatRow, StatisticsPeriod } from '../statisticsCalculations';
import { computeEmployeeRendement } from '../../../../utils/rendementCalculator';
import { isSelfOnlyUser, findMatchingEmployee, isManagerOrAdminEmployee } from '../../../../utils/roleUtils';
import { round1, safeNum } from '../../../../utils/rendementTaskHelpers';

interface UsePresenceStatisticsLogicProps {
  employees: Employee[];
  presences: Presence[];
  tasks: Task[];
  reminders?: Reminder[];
  strategicProjects?: StrategicProject[];
  notifications?: NotificationLog[];
  currentUser?: AppUser | null;
  currentRole?: string;
}

export function usePresenceStatisticsLogic({
  employees,
  presences,
  tasks,
  reminders = [],
  strategicProjects = [],
  notifications = [],
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
  const [taskSheetEmployee, setTaskSheetEmployee] = useState<Employee | null>(null);
  const [taskSheetMode, setTaskSheetMode] = useState<'day' | 'month' | 'year'>('month');

  const trackedEmployees = useMemo(() => {
    const base = (employees || []).filter((e) => {
      const st = e.employmentStatus || (typeof e.status === 'string' ? e.status : (e.status ? 'en_poste' : 'parti'));
      const isEnPoste = st === 'en_poste' || st === ('true' as any);
      if (!isEnPoste) return false;
      if (e.roleType === 'sponsor') return false;
      if (!isManagerOrAdminEmployee(e)) return true;

      return (presences || []).some((p) => {
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

  const statRowByEmployeeId = useMemo(() => {
    const map = new Map<string, EmployeeStatRow>();
    statsByEmployeeList.forEach((s) => {
      map.set(String(s.employee.id), s);
    });
    return map;
  }, [statsByEmployeeList]);

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
    const periodFilter =
      period === 'all'
        ? undefined
        : {
            startStr: stats.startStr,
            endStr: stats.endStr,
            period,
          };

    return trackedEmployees.map((emp) => {
      const statRow = statRowByEmployeeId.get(String(emp.id));
      const empAssiduite = statRow ? safeNum(statRow.assiduiteRate, 100) : 100;
      return computeEmployeeRendement(emp, tasks, empAssiduite, periodFilter, {
        reminders,
        strategicProjects,
        notifications,
      });
    });
  }, [trackedEmployees, tasks, reminders, strategicProjects, notifications, statRowByEmployeeId, stats.startStr, stats.endStr, period]);

  const filteredMetricsList = useMemo(() => {
    if (!searchQuery.trim()) return employeeRendementMetricsList;
    const q = searchQuery.toLowerCase();
    return employeeRendementMetricsList.filter(
      (m) =>
        m.employee.name.toLowerCase().includes(q) ||
        (m.employee.department && m.employee.department.toLowerCase().includes(q))
    );
  }, [employeeRendementMetricsList, searchQuery]);

  const periodTasksForHistogram = useMemo(() => {
    const taskMap = new Map<string, Task>();
    filteredMetricsList.forEach((m) => {
      m.assignedTasks.forEach((t) => {
        if (!t || !t.id) return;
        const existing = taskMap.get(t.id);
        if (!existing) {
          taskMap.set(t.id, t);
        } else if (Array.isArray(t.subtasks) && t.subtasks.length > 0) {
          const existingSubs = Array.isArray(existing.subtasks) ? existing.subtasks : [];
          const subIds = new Set(existingSubs.map((s) => s.id));
          const mergedSubs = [...existingSubs];
          t.subtasks.forEach((s) => {
            if (!subIds.has(s.id)) {
              subIds.add(s.id);
              mergedSubs.push(s);
            }
          });
          taskMap.set(t.id, { ...existing, subtasks: mergedSubs });
        }
      });
    });
    if (taskMap.size === 0 && !searchQuery.trim() && filteredMetricsList.length === 0) {
      (tasks || []).forEach((t) => {
        if (t && t.id) taskMap.set(t.id, t);
      });
    }
    return Array.from(taskMap.values());
  }, [filteredMetricsList, searchQuery, tasks]);

  const dynamicTeamRate = useMemo(() => {
    if (employeeRendementMetricsList.length === 0) return 0;
    const sum = employeeRendementMetricsList.reduce((acc, m) => acc + safeNum(m.taskRendementRate), 0);
    return Math.round(sum / employeeRendementMetricsList.length);
  }, [employeeRendementMetricsList]);

  const avgCombinedScorePeriod = useMemo(() => {
    if (filteredMetricsList.length === 0) return 0;
    const sum = filteredMetricsList.reduce((acc, m) => acc + safeNum(m.globalCombinedScore), 0);
    return Math.round(sum / filteredMetricsList.length);
  }, [filteredMetricsList]);

  const totalSubtasksCount = useMemo(
    () => filteredMetricsList.reduce((sum, m) => sum + safeNum(m.totalSubtasks), 0),
    [filteredMetricsList]
  );
  const completedSubtasksCount = useMemo(
    () => filteredMetricsList.reduce((sum, m) => sum + safeNum(m.completedSubtasks), 0),
    [filteredMetricsList]
  );
  const totalAssignedTasksPeriod = useMemo(
    () => filteredMetricsList.reduce((sum, m) => sum + safeNum(m.totalTasks), 0),
    [filteredMetricsList]
  );
  const totalCompletedTasksPeriod = useMemo(
    () => filteredMetricsList.reduce((sum, m) => sum + safeNum(m.completedTasks), 0),
    [filteredMetricsList]
  );
  const totalInProgressTasksPeriod = useMemo(
    () => filteredMetricsList.reduce((sum, m) => sum + safeNum(m.inProgressTasks), 0),
    [filteredMetricsList]
  );
  const totalBlockedTasksPeriod = useMemo(
    () => filteredMetricsList.reduce((sum, m) => sum + safeNum(m.blockedTasks), 0),
    [filteredMetricsList]
  );
  const totalOverdueTasksPeriod = useMemo(
    () => filteredMetricsList.reduce((sum, m) => sum + safeNum(m.overdueTasks), 0),
    [filteredMetricsList]
  );
  const totalMilestonesPeriod = useMemo(
    () => filteredMetricsList.reduce((sum, m) => sum + safeNum(m.milestonesCount), 0),
    [filteredMetricsList]
  );
  const totalEffectiveHoursPeriod = useMemo(
    () => round1(filteredMetricsList.reduce((sum, m) => sum + safeNum(m.effectiveHoursSpent), 0)),
    [filteredMetricsList]
  );
  const totalEstimatedHoursPeriod = useMemo(
    () => round1(filteredMetricsList.reduce((sum, m) => sum + safeNum(m.estimatedHoursTotal), 0)),
    [filteredMetricsList]
  );
  const totalRemindersPeriod = useMemo(
    () => filteredMetricsList.reduce((sum, m) => sum + safeNum(m.remindersCount), 0),
    [filteredMetricsList]
  );
  const totalRemindersResolvedPeriod = useMemo(
    () => filteredMetricsList.reduce((sum, m) => sum + safeNum(m.remindersResolvedCount), 0),
    [filteredMetricsList]
  );
  const totalRemindersHoursPeriod = useMemo(
    () => round1(filteredMetricsList.reduce((sum, m) => sum + safeNum(m.remindersHoursTotal), 0)),
    [filteredMetricsList]
  );
  const totalImportantPointsPeriod = useMemo(
    () => filteredMetricsList.reduce((sum, m) => sum + safeNum(m.importantPointsCount), 0),
    [filteredMetricsList]
  );
  const totalImportantPointsHoursPeriod = useMemo(
    () => round1(filteredMetricsList.reduce((sum, m) => sum + safeNum(m.importantPointsHoursTotal), 0)),
    [filteredMetricsList]
  );

  const handleOpenTaskSheetModal = (employee: Employee, mode: 'day' | 'month' | 'year' = 'month') => {
    setTaskSheetEmployee(employee);
    setTaskSheetMode(mode);
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
    taskSheetEmployee,
    setTaskSheetEmployee,
    taskSheetMode,
    stats,
    statsByEmployeeList,
    statRowByEmployeeId,
    filteredStatsByEmployee,
    filteredMetricsList,
    periodTasksForHistogram,
    dynamicTeamRate,
    avgCombinedScorePeriod,
    totalSubtasksCount,
    completedSubtasksCount,
    totalAssignedTasksPeriod,
    totalCompletedTasksPeriod,
    totalInProgressTasksPeriod,
    totalBlockedTasksPeriod,
    totalOverdueTasksPeriod,
    totalMilestonesPeriod,
    totalEffectiveHoursPeriod,
    totalEstimatedHoursPeriod,
    totalRemindersPeriod,
    totalRemindersResolvedPeriod,
    totalRemindersHoursPeriod,
    totalImportantPointsPeriod,
    totalImportantPointsHoursPeriod,
    handleOpenTaskSheetModal,
  };
}
