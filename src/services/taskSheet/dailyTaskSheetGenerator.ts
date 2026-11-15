import { Employee, Task, Presence, AttendanceIncident, TaskProject } from '../../types';
import { isTaskAssignedToEmployee } from '../../utils/rendementCalculator';
import { isSubtaskInLast3Days } from '../../utils/subtaskFilterUtils';
import { getItemTaskSheetStatus } from '../../utils/taskSheetEligibility';
import { DailyTaskSheetData, DailyTaskSheetTaskItem } from './taskSheetTypes';
import {
  buildDailyCapacityMetrics,
  buildDailyScheduleSlots,
  collectBlockagesAndComments,
  collectDailyPresenceIncidents,
} from './dailyTaskSheetHelpers';

export function generateDailyTaskSheet(
  employee: Employee,
  date: string,
  allTasks: Task[],
  presences: Presence[],
  incidents: AttendanceIncident[] = [],
  projects: TaskProject[] = []
): DailyTaskSheetData {
  const d = new Date(date + 'T12:00:00');
  const dayName = d.toLocaleDateString('fr-FR', { weekday: 'long' });

  const empTasks = allTasks.filter((t) => {
    if (!isTaskAssignedToEmployee(t, employee)) return false;
    if (t.date === date || (t.dueDate && t.dueDate === date)) return true;
    if (t.status === 'in_progress' || t.status === 'en_cours' || t.status === 'todo' || t.status === 'pending_validation') return true;
    if (t.subtasks && t.subtasks.some((s) =>
      s.dueDate === date ||
      s.startDate === date ||
      (s.createdAt && s.createdAt.startsWith(date)) ||
      isSubtaskInLast3Days(s, date)
    )) return true;
    return false;
  });

  const sortedParentTasks = [...empTasks].sort((a, b) => {
    if (a.isMilestone && !b.isMilestone) return -1;
    if (!a.isMilestone && b.isMilestone) return 1;
    const pWeight: Record<string, number> = { urgent: 4, high: 3, haut: 3, medium: 2, low: 1 };
    return (pWeight[b.priority] || 2) - (pWeight[a.priority] || 2);
  });

  const rawTopPriorities = sortedParentTasks.slice(0, 3).map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    status: t.status === 'completed' || (t as any).completed === true ? 'Fait' : 'En cours',
    isMilestone: t.isMilestone,
  }));

  const subtaskItems: DailyTaskSheetTaskItem[] = [];

  sortedParentTasks.forEach((parentTask) => {
    const proj = projects.find((p) => p.id === parentTask.projectId);
    const domain = proj ? proj.name : (parentTask.category || employee.department || 'Général');

    let prioLabel: 'P1' | 'P2' | 'P3' = 'P2';
    if (parentTask.priority === 'urgent' || parentTask.priority === 'high' || parentTask.priority === 'haut') {
      prioLabel = 'P1';
    } else if (parentTask.priority === 'low') {
      prioLabel = 'P3';
    }

    if (parentTask.subtasks && parentTask.subtasks.length > 0) {
      parentTask.subtasks.forEach((sub) => {
        const subStatus = getItemTaskSheetStatus(sub, date, parentTask.date);
        if (!subStatus) return;

        subtaskItems.push({
          id: sub.id,
          title: sub.title,
          parentTaskTitle: parentTask.title,
          domain,
          priorityLabel: prioLabel,
          estimatedMinutes: Math.round((sub.estimatedHours || 1.5) * 60),
          dueDate: sub.dueDate || parentTask.dueDate || date,
          status: subStatus,
          isMilestone: parentTask.isMilestone,
        });
      });
    } else {
      const parentStatus = getItemTaskSheetStatus(parentTask, date);
      if (parentStatus) {
        subtaskItems.push({
          id: parentTask.id,
          title: parentTask.title,
          parentTaskTitle: parentTask.title,
          domain,
          priorityLabel: prioLabel,
          estimatedMinutes: parentTask.priority === 'urgent' ? 240 : (parentTask.priority === 'high' ? 180 : 120),
          dueDate: parentTask.dueDate || parentTask.date || date,
          status: parentStatus,
          isMilestone: parentTask.isMilestone,
        });
      }
    }
  });

  const totalTasks = subtaskItems.length;
  const completedTasks = subtaskItems.filter((t) => t.status === 'Fait').length;
  const ratePercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const postponedTasks = subtaskItems.filter((t) => t.status !== 'Fait').map((t) => t.title);
  const postponedCount = postponedTasks.length;
  const topPriorities = totalTasks === 0 ? [] : rawTopPriorities;

  const capacity = buildDailyCapacityMetrics(subtaskItems, sortedParentTasks);
  const scheduleSlots = buildDailyScheduleSlots(totalTasks, subtaskItems);
  const presenceIncidents = collectDailyPresenceIncidents(employee, date, presences, incidents);
  const { unforeseenEvents, managerComments, managerAlertPoint } = collectBlockagesAndComments(sortedParentTasks);

  return {
    employee,
    date,
    dayName,
    location: 'Douala',
    department: employee.department || 'Général',
    topPriorities,
    tasks: subtaskItems,
    totalTasks,
    completedTasks,
    ratePercentage,
    postponedCount,
    capacity,
    scheduleSlots,
    presenceIncidents,
    unforeseenEvents,
    postponedTasks,
    managerAlertPoint,
    managerComments,
  };
}
