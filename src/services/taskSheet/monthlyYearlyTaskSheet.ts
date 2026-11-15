import { Employee, Presence, Task } from '../../types';
import { isTaskAssignedToEmployee } from '../../utils/rendementCalculator';
import { MonthlyTaskSheetData, YearlyTaskSheetData } from './taskSheetTypes';

export function generateMonthlyTaskSheet(
  employee: Employee,
  monthStr: string,
  allTasks: Task[],
  presences: Presence[]
): MonthlyTaskSheetData {
  const [yStr, mStr] = monthStr.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);

  const d = new Date(y, m - 1, 1);
  const monthName = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(y, m, 0).getDate();

  let totalDaysWorked = 0;
  let totalHoursWorked = 0;

  const dailyBreakdown = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayDate = new Date(y, m - 1, day);
    const dayNameFr = dayDate.toLocaleDateString('fr-FR', { weekday: 'short' });

    const p = presences.find((pres) => pres.employeeId === employee.id && pres.date === dayDateStr);

    let hoursWorked = 0;
    if (p && p.arrivalTime && p.departureTime) {
      const [ah, am] = p.arrivalTime.split(':').map(Number);
      const [dh, dm] = p.departureTime.split(':').map(Number);
      hoursWorked = Math.max(0, (dh + dm / 60) - (ah + am / 60) - 1);
      totalDaysWorked++;
      totalHoursWorked += hoursWorked;
    } else if (p && p.status === 'present') {
      hoursWorked = 8;
      totalDaysWorked++;
      totalHoursWorked += 8;
    }

    const dayTasks = allTasks.filter((t) => {
      if (!isTaskAssignedToEmployee(t, employee)) return false;
      if (t.date === dayDateStr || (t.dueDate && t.dueDate === dayDateStr)) return true;
      if (t.subtasks && t.subtasks.some((s) => s.dueDate === dayDateStr || s.startDate === dayDateStr || (s.createdAt && s.createdAt.startsWith(dayDateStr)))) return true;
      return false;
    });

    let tasksDone = 0;
    dayTasks.forEach((t) => {
      if (t.subtasks && t.subtasks.length > 0) {
        const subsForDay = t.subtasks.filter((s) =>
          s.dueDate === dayDateStr || s.startDate === dayDateStr || (s.createdAt && s.createdAt.startsWith(dayDateStr)) || t.date === dayDateStr
        );
        const doneSubs = (subsForDay.length > 0 ? subsForDay : t.subtasks).filter((s) => s.completed || s.status === 'completed');
        if (doneSubs.length > 0) {
          tasksDone += doneSubs.length;
        } else if (t.status === 'completed' || (t as any).completed) {
          tasksDone += 1;
        }
      } else if (t.status === 'completed' || (t as any).completed) {
        tasksDone += 1;
      }
    });

    dailyBreakdown.push({
      date: dayDateStr,
      dayName: dayNameFr,
      arrivalTime: p?.arrivalTime || '-',
      departureTime: p?.departureTime || '-',
      hoursWorked: Math.round(hoursWorked * 10) / 10,
      status: p?.status === 'present' ? 'Présent' : (p?.status === 'late' ? 'En retard' : (p?.status === 'absent' ? 'Absent' : '-')),
      tasksDoneCount: tasksDone,
    });
  }

  const empMonthTasks = allTasks.filter((t) => {
    if (!isTaskAssignedToEmployee(t, employee)) return false;
    const taskMonth = (t.date || t.dueDate || '').slice(0, 7);
    if (taskMonth === monthStr) return true;
    if (t.subtasks && t.subtasks.some((s) =>
      (s.dueDate && s.dueDate.startsWith(monthStr)) ||
      (s.startDate && s.startDate.startsWith(monthStr)) ||
      (s.createdAt && s.createdAt.startsWith(monthStr))
    )) return true;
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
    const isCompleted = t.status === 'completed' || (t as any).completed || (effectiveSubs.length > 0 && completedSubsCount === effectiveSubs.length);

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

    const completionPercentage = effectiveSubs.length > 0
      ? Math.round((completedSubsCount / effectiveSubs.length) * 100)
      : (isCompleted ? 100 : 0);

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

  return {
    employee,
    month: monthStr,
    monthName,
    totalDaysWorked,
    totalHoursWorked: Math.round(totalHoursWorked),
    totalTasksAssigned,
    totalTasksCompleted,
    totalSubtasksCount,
    completedSubtasksCount,
    completionRate,
    tasksList,
    dailyBreakdown,
  };
}

export function generateYearlyTaskSheet(
  employee: Employee,
  year: number,
  allTasks: Task[],
  presences: Presence[]
): YearlyTaskSheetData {
  let totalHoursWorked = 0;
  let totalDaysPresent = 0;
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const monthlyBreakdown = monthNames.map((monthName, idx) => {
    const mNum = String(idx + 1).padStart(2, '0');
    const monthStr = `${year}-${mNum}`;

    const monthPresences = presences.filter((p) => p.employeeId === employee.id && p.date.startsWith(monthStr));
    const daysWorked = monthPresences.filter((p) => p.status === 'present' || p.status === 'late' || Boolean(p.arrivalTime)).length;
    const hoursWorked = daysWorked * 8;

    const monthTasks = allTasks.filter((t) => {
      if (!isTaskAssignedToEmployee(t, employee)) return false;
      if (t.date.startsWith(monthStr) || (t.dueDate && t.dueDate.startsWith(monthStr))) return true;
      if (t.subtasks && t.subtasks.some((s) => (s.dueDate && s.dueDate.startsWith(monthStr)) || (s.startDate && s.startDate.startsWith(monthStr)) || (s.createdAt && s.createdAt.startsWith(monthStr)))) return true;
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

    totalDaysPresent += daysWorked;
    totalHoursWorked += hoursWorked;

    return {
      monthName,
      daysWorked,
      hoursWorked,
      tasksCompleted,
      rendementRate,
    };
  });

  const yearTasks = allTasks.filter((t) => isTaskAssignedToEmployee(t, employee) && (t.date.startsWith(String(year)) || (t.dueDate && t.dueDate.startsWith(String(year)))));
  const totalTasksCompleted = yearTasks.filter((t) => t.status === 'completed' || (t as any).completed).length;
  const avgCompletionRate = yearTasks.length > 0 ? Math.round((totalTasksCompleted / yearTasks.length) * 100) : 0;

  return {
    employee,
    year,
    totalHoursWorked,
    totalDaysPresent,
    totalTasksCompleted,
    avgCompletionRate,
    monthlyBreakdown,
  };
}
