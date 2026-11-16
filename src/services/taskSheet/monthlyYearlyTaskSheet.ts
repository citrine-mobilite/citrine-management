import { Employee, NotificationLog, Presence, Reminder, StrategicProject, Task } from '../../types';
import { isTaskAssignedToEmployee } from '../../utils/rendementCalculator';
import { MonthlyTaskSheetData, YearlyTaskSheetData } from './taskSheetTypes';
import {
  computeEmployeeReminderStatsInRange,
  extractStrategicMilestones,
  getEmployeeRemindersForDate,
} from '../reminders/reminderActivityUtils';
import {
  buildDailyImportantPoints,
  computeImportantPointsPeriodSummary,
  mergeRemindersWithLocalMovements,
} from './importantPointsUtils';

function computePresenceDayHours(p: Presence | undefined): number {
  if (!p) return 0;
  if (p.arrivalTime && p.departureTime) {
    const [ah, am] = p.arrivalTime.split(':').map(Number);
    const [dh, dm] = p.departureTime.split(':').map(Number);
    if (Number.isFinite(ah) && Number.isFinite(am) && Number.isFinite(dh) && Number.isFinite(dm)) {
      const span = (dh + dm / 60) - (ah + am / 60);
      if (span > 0) {
        return Math.max(0, span > 5 ? span - 1 : span);
      }
    }
  }
  if (p.status === 'present' || p.status === 'late' || p.status === 'mission' || Boolean(p.arrivalTime)) {
    return 8;
  }
  return 0;
}

export function generateMonthlyTaskSheet(
  employee: Employee,
  monthStr: string,
  allTasks: Task[],
  presences: Presence[],
  reminders: Reminder[] = [],
  strategicProjects: StrategicProject[] = [],
  notifications: NotificationLog[] = []
): MonthlyTaskSheetData {
  const mergedReminders = mergeRemindersWithLocalMovements(reminders, employee.id);
  const [yStr, mStr] = monthStr.split('-');
  const y = parseInt(yStr, 10) || new Date().getFullYear();
  const m = parseInt(mStr, 10) || new Date().getMonth() + 1;

  const d = new Date(y, m - 1, 1);
  const monthName = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(y, m, 0).getDate();

  let totalDaysWorked = 0;
  let workingDaysInMonth = 0;
  let weekdayDaysWorked = 0;
  let weekendDaysWorked = 0;
  let totalHoursWorked = 0;
  let presentDays = 0;
  let lateDays = 0;
  let absentDays = 0;

  const dailyBreakdown = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayDate = new Date(y, m - 1, day);
    const dayOfWeek = dayDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (!isWeekend) {
      workingDaysInMonth++;
    }
    const dayNameFr = dayDate.toLocaleDateString('fr-FR', { weekday: 'short' });

    const p = presences.find((pres) => String(pres.employeeId) === String(employee.id) && pres.date === dayDateStr);

    const hoursWorked = p?.status === 'absent' && isWeekend ? 0 : computePresenceDayHours(p);
    const isWorkedDay = Boolean(
      p &&
        p.status !== 'absent' &&
        (p.status === 'present' || p.status === 'late' || p.status === 'mission' || p.arrivalTime)
    );
    if (isWorkedDay) {
      totalDaysWorked++;
      if (isWeekend) weekendDaysWorked++;
      else weekdayDaysWorked++;
      totalHoursWorked += hoursWorked;
    }

    if (p?.status === 'present' || p?.status === 'mission' || (isWeekend && isWorkedDay)) presentDays++;
    else if (p?.status === 'late' && !isWeekend) lateDays++;
    else if (p?.status === 'absent' && !isWeekend) absentDays++;

    const dayTasks = allTasks.filter((t) => {
      if (!isTaskAssignedToEmployee(t, employee)) return false;
      if (t.date === dayDateStr || (t.dueDate && t.dueDate === dayDateStr)) return true;
      if (
        t.subtasks &&
        t.subtasks.some(
          (s) =>
            s.dueDate === dayDateStr ||
            s.startDate === dayDateStr ||
            (s.createdAt && s.createdAt.startsWith(dayDateStr))
        )
      ) {
        return true;
      }
      return false;
    });

    let tasksDone = 0;
    dayTasks.forEach((t) => {
      if (t.subtasks && t.subtasks.length > 0) {
        const subsForDay = t.subtasks.filter(
          (s) =>
            s.dueDate === dayDateStr ||
            s.startDate === dayDateStr ||
            (s.createdAt && s.createdAt.startsWith(dayDateStr)) ||
            t.date === dayDateStr
        );
        const doneSubs = (subsForDay.length > 0 ? subsForDay : t.subtasks).filter(
          (s) => s.completed || s.status === 'completed'
        );
        if (doneSubs.length > 0) {
          tasksDone += doneSubs.length;
        } else if (t.status === 'completed' || (t as any).completed) {
          tasksDone += 1;
        }
      } else if (t.status === 'completed' || (t as any).completed) {
        tasksDone += 1;
      }
    });

    const mappedStatus =
      isWeekend && p?.status === 'absent'
        ? '-'
        : isWeekend && isWorkedDay
        ? p?.status === 'mission'
          ? 'Mission'
          : 'Présent'
        : p?.status === 'present'
        ? 'Présent'
        : p?.status === 'late'
        ? 'En retard'
        : p?.status === 'mission'
        ? 'Mission'
        : p?.status === 'absent'
        ? 'Absent'
        : '-';

    const dayRemindersCount = getEmployeeRemindersForDate(mergedReminders, employee, dayDateStr).length;
    const dayPointsCount = buildDailyImportantPoints({
      employee,
      dateIso: dayDateStr,
      reminders: mergedReminders,
      notifications,
    }).length;

    dailyBreakdown.push({
      date: dayDateStr,
      dayName: dayNameFr,
      isWeekend,
      arrivalTime: p?.arrivalTime || '-',
      departureTime: p?.departureTime || '-',
      hoursWorked: Math.round(hoursWorked * 10) / 10,
      status: mappedStatus,
      tasksDoneCount: tasksDone,
      remindersCount: dayRemindersCount,
      importantPointsCount: dayPointsCount,
    });
  }

  const empMonthTasks = allTasks.filter((t) => {
    if (!isTaskAssignedToEmployee(t, employee)) return false;
    const taskMonth = (t.date || t.dueDate || '').slice(0, 7);
    if (taskMonth === monthStr) return true;
    if (
      t.subtasks &&
      t.subtasks.some(
        (s) =>
          (s.dueDate && s.dueDate.startsWith(monthStr)) ||
          (s.startDate && s.startDate.startsWith(monthStr)) ||
          (s.createdAt && s.createdAt.startsWith(monthStr))
      )
    ) {
      return true;
    }
    if (t.lastUpdatedTime && t.lastUpdatedTime.startsWith(monthStr)) return true;
    if (t.status === 'in_progress' || t.status === 'completed' || t.status === 'pending_validation') return true;
    return false;
  });

  let totalTasksAssigned = 0;
  let totalTasksCompleted = 0;
  let totalSubtasksCount = 0;
  let completedSubtasksCount = 0;

  const tasksList = empMonthTasks.map((t) => {
    const rawSubs = t.subtasks || [];
    const subs = rawSubs.filter((s) => isTaskAssignedToEmployee(s, employee) || isTaskAssignedToEmployee(t, employee));
    const effectiveSubs = subs.length > 0 ? subs : rawSubs;

    const completedSubsCount = effectiveSubs.filter((s) => s.completed || s.status === 'completed').length;
    const isCompleted =
      t.status === 'completed' ||
      (t as any).completed ||
      (effectiveSubs.length > 0 && completedSubsCount === effectiveSubs.length);

    if (effectiveSubs.length > 0) {
      totalSubtasksCount += effectiveSubs.length;
      completedSubtasksCount += completedSubsCount;
      totalTasksAssigned += effectiveSubs.length;
      totalTasksCompleted += completedSubsCount;
    } else {
      totalTasksAssigned += 1;
      if (isCompleted) {
        totalTasksCompleted += 1;
      }
    }

    const completionPercentage =
      effectiveSubs.length > 0
        ? Math.round((completedSubsCount / effectiveSubs.length) * 100)
        : isCompleted
        ? 100
        : 0;

    return {
      id: t.id,
      title: t.title,
      status: isCompleted ? 'completed' : t.status,
      isMilestone: t.isMilestone,
      priority: t.priority,
      date: t.date || t.dueDate,
      totalSubtasks: effectiveSubs.length,
      completedSubtasks: completedSubsCount,
      subtasks: effectiveSubs.map((s) => ({
        id: s.id,
        title: s.title,
        completed: Boolean(s.completed || s.status === 'completed'),
        status: s.status || (s.completed ? 'completed' : 'todo'),
        estimatedHours: s.estimatedHours,
      })),
      completionPercentage,
    };
  });

  const completionRate = totalTasksAssigned > 0 ? Math.round((totalTasksCompleted / totalTasksAssigned) * 100) : 0;

  const monthStartIso = `${y}-${String(m).padStart(2, '0')}-01`;
  const monthEndIso = `${y}-${String(m).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
  const monthReminderStats = computeEmployeeReminderStatsInRange(
    mergedReminders,
    employee,
    monthStartIso,
    monthEndIso
  );
  const importantPointsSummary = computeImportantPointsPeriodSummary({
    employee,
    startIso: monthStartIso,
    endIso: monthEndIso,
    reminders: mergedReminders,
    notifications,
    maxRecentItems: 20,
  });
  const monthStrategicMilestones = extractStrategicMilestones(
    strategicProjects,
    employee,
    monthStartIso,
    monthEndIso
  );
  const taskMilestones = tasksList.filter((t) => t.isMilestone);
  const milestoneItems = [
    ...monthStrategicMilestones.map((m) => ({
      id: m.milestoneId,
      title: m.title,
      projectName: m.projectName,
      status: m.isDone ? 'completed' : m.isBlocked ? 'blocked' : m.status,
      targetDate: m.targetDate,
      progress: m.isDone ? 100 : m.status === 'in_progress' ? 50 : 0,
    })),
    ...taskMilestones.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      targetDate: t.date,
      progress: t.completionPercentage,
    })),
  ];

  return {
    employee,
    month: monthStr,
    monthName,
    totalDaysWorked,
    workingDaysInMonth,
    weekdayDaysWorked,
    weekendDaysWorked,
    totalHoursWorked: Math.round(totalHoursWorked * 10) / 10,
    presentDays,
    lateDays,
    absentDays,
    totalTasksAssigned,
    totalTasksCompleted,
    totalSubtasksCount,
    completedSubtasksCount,
    completionRate,
    milestonesSummary: {
      total: milestoneItems.length,
      completed: milestoneItems.filter((m) => m.status === 'completed' || m.progress >= 100).length,
      blocked: milestoneItems.filter((m) => m.status === 'blocked').length,
      items: milestoneItems,
    },
    remindersSummary: {
      totalOccurrences: monthReminderStats.totalOccurrences,
      resolvedCount: monthReminderStats.resolvedCount,
      overdueCount: monthReminderStats.overdueCount,
      totalHours: monthReminderStats.totalHours,
    },
    importantPointsSummary,
    tasksList,
    dailyBreakdown,
  };
}

function countWorkingDaysInMonth(year: number, month1Based: number): number {
  const days = new Date(year, month1Based, 0).getDate();
  let working = 0;
  for (let d = 1; d <= days; d++) {
    const dow = new Date(year, month1Based - 1, d).getDay();
    if (dow >= 1 && dow <= 5) working++;
  }
  return working;
}

export function generateYearlyTaskSheet(
  employee: Employee,
  year: number,
  allTasks: Task[],
  presences: Presence[],
  reminders: Reminder[] = [],
  strategicProjects: StrategicProject[] = [],
  notifications: NotificationLog[] = []
): YearlyTaskSheetData {
  const mergedReminders = mergeRemindersWithLocalMovements(reminders, employee.id);
  let totalHoursWorked = 0;
  let totalDaysPresent = 0;
  let totalWorkingDays = 0;
  let totalWeekendDaysWorked = 0;
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];

  let yearSubtasksTotal = 0;
  let yearSubtasksDone = 0;

  const monthlyBreakdown = monthNames.map((monthName, idx) => {
    const mNum = String(idx + 1).padStart(2, '0');
    const monthStr = `${year}-${mNum}`;
    const workingDays = countWorkingDaysInMonth(year, idx + 1);

    const monthPresences = presences.filter(
      (p) => String(p.employeeId) === String(employee.id) && p.date.startsWith(monthStr)
    );
    const workedPresences = monthPresences.filter(
      (p) =>
        p.status !== 'absent' &&
        (p.status === 'present' || p.status === 'late' || p.status === 'mission' || Boolean(p.arrivalTime))
    );
    const daysWorked = workedPresences.length;
    const weekendDaysWorked = workedPresences.filter((p) => {
      const dow = new Date(p.date + 'T12:00:00').getDay();
      return dow === 0 || dow === 6;
    }).length;
    const hoursWorked = Math.round(workedPresences.reduce((sum, p) => sum + computePresenceDayHours(p), 0) * 10) / 10;

    const monthTasks = allTasks.filter((t) => {
      if (!isTaskAssignedToEmployee(t, employee)) return false;
      if ((t.date && t.date.startsWith(monthStr)) || (t.dueDate && t.dueDate.startsWith(monthStr))) return true;
      if (
        t.subtasks &&
        t.subtasks.some(
          (s) =>
            (s.dueDate && s.dueDate.startsWith(monthStr)) ||
            (s.startDate && s.startDate.startsWith(monthStr)) ||
            (s.createdAt && s.createdAt.startsWith(monthStr))
        )
      ) {
        return true;
      }
      if (t.lastUpdatedTime && t.lastUpdatedTime.startsWith(monthStr)) return true;
      return false;
    });

    let tasksCompleted = 0;
    let totalSubCount = 0;
    monthTasks.forEach((t) => {
      if (t.subtasks && t.subtasks.length > 0) {
        const subs = t.subtasks.filter((s) => isTaskAssignedToEmployee(s, employee) || isTaskAssignedToEmployee(t, employee));
        const effectiveSubs = subs.length > 0 ? subs : t.subtasks;
        totalSubCount += effectiveSubs.length;
        tasksCompleted += effectiveSubs.filter((s) => s.completed || s.status === 'completed').length;
      } else {
        totalSubCount += 1;
        if (t.status === 'completed' || (t as any).completed) {
          tasksCompleted += 1;
        }
      }
    });
    const rendementRate = totalSubCount > 0 ? Math.round((tasksCompleted / totalSubCount) * 100) : 0;

    const mDays = new Date(year, idx + 1, 0).getDate();
    const mStartIso = `${monthStr}-01`;
    const mEndIso = `${monthStr}-${String(mDays).padStart(2, '0')}`;
    const mRemStats = computeEmployeeReminderStatsInRange(mergedReminders, employee, mStartIso, mEndIso);
    const mPointsStats = computeImportantPointsPeriodSummary({
      employee,
      startIso: mStartIso,
      endIso: mEndIso,
      reminders: mergedReminders,
      notifications,
      maxRecentItems: 5,
    });

    totalDaysPresent += daysWorked;
    totalWorkingDays += workingDays;
    totalWeekendDaysWorked += weekendDaysWorked;
    totalHoursWorked += hoursWorked;
    yearSubtasksTotal += totalSubCount;
    yearSubtasksDone += tasksCompleted;

    return {
      monthName,
      daysWorked,
      workingDays,
      weekendDaysWorked,
      hoursWorked,
      tasksCompleted,
      subtasksTotal: totalSubCount,
      remindersCount: mRemStats.totalOccurrences,
      importantPointsCount: mPointsStats.totalPoints,
      rendementRate,
    };
  });

  const yearTasks = allTasks.filter((t) => {
    if (!isTaskAssignedToEmployee(t, employee)) return false;
    const yr = String(year);
    if ((t.date && t.date.startsWith(yr)) || (t.dueDate && t.dueDate.startsWith(yr))) return true;
    if (t.subtasks?.some((s) => s.dueDate?.startsWith(yr) || s.startDate?.startsWith(yr) || s.createdAt?.startsWith(yr))) {
      return true;
    }
    return false;
  });
  const totalTasksCompleted = yearTasks.filter((t) => t.status === 'completed' || (t as any).completed).length;
  const avgCompletionRate =
    yearSubtasksTotal > 0
      ? Math.round((yearSubtasksDone / yearSubtasksTotal) * 100)
      : yearTasks.length > 0
      ? Math.round((totalTasksCompleted / yearTasks.length) * 100)
      : 0;

  const topTimeTasks = yearTasks
    .map((t) => {
      const subs = t.subtasks || [];
      const subHours = subs.reduce((s, sub) => s + (Number(sub.actualHours) || Number(sub.estimatedHours) || 0), 0);
      const rawHours = Number(t.actualHours) || Number(t.estimatedHours) || subHours || 0;
      const doneSubs = subs.filter((s) => s.completed || s.status === 'completed').length;
      return {
        id: t.id,
        title: t.title,
        hours: Math.round(rawHours * 10) / 10,
        status: t.status,
        subtasksCount: subs.length,
        completedSubtasksCount: doneSubs,
      };
    })
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 8);

  const yearStartIso = `${year}-01-01`;
  const yearEndIso = `${year}-12-31`;
  const yearReminderStats = computeEmployeeReminderStatsInRange(
    mergedReminders,
    employee,
    yearStartIso,
    yearEndIso
  );
  const importantPointsSummary = computeImportantPointsPeriodSummary({
    employee,
    startIso: yearStartIso,
    endIso: yearEndIso,
    reminders: mergedReminders,
    notifications,
    maxRecentItems: 25,
  });
  const yearStrategicMilestones = extractStrategicMilestones(
    strategicProjects,
    employee,
    yearStartIso,
    yearEndIso
  );
  const yearTaskMilestones = yearTasks.filter((t) => t.isMilestone);
  const totalMilestonesCount = yearStrategicMilestones.length + yearTaskMilestones.length;
  const completedMilestonesCount =
    yearStrategicMilestones.filter((m) => m.isDone).length +
    yearTaskMilestones.filter((t) => t.status === 'completed' || (t.milestoneProgress ?? 0) >= 100).length;
  const blockedMilestonesCount =
    yearStrategicMilestones.filter((m) => m.isBlocked).length +
    yearTaskMilestones.filter((t) => t.status === 'blocked').length;

  return {
    employee,
    year,
    totalHoursWorked: Math.round(totalHoursWorked * 10) / 10,
    totalDaysPresent,
    totalWorkingDays,
    totalWeekendDaysWorked,
    totalTasksCompleted,
    avgCompletionRate,
    totalSubtasksAssigned: yearSubtasksTotal,
    totalSubtasksCompleted: yearSubtasksDone,
    subtaskCompletionRate: yearSubtasksTotal > 0 ? Math.round((yearSubtasksDone / yearSubtasksTotal) * 100) : avgCompletionRate,
    milestonesSummary: {
      total: totalMilestonesCount,
      completed: completedMilestonesCount,
      blocked: blockedMilestonesCount,
    },
    remindersSummary: {
      totalOccurrences: yearReminderStats.totalOccurrences,
      resolvedCount: yearReminderStats.resolvedCount,
      overdueCount: yearReminderStats.overdueCount,
      totalHours: yearReminderStats.totalHours,
    },
    importantPointsSummary,
    topTimeTasks,
    monthlyBreakdown,
  };
}
