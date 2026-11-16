import {
  TaskSheetItem,
  TaskSheetBlocker,
  TaskSheetManagerPoint,
  TaskSheetScheduleSlot,
} from '../taskSheetReportService';
import { getItemTaskSheetStatus } from '../../utils/taskSheetEligibility';
import { extractStrategicMilestones } from '../reminders/reminderActivityUtils';
import { buildDailyImportantPoints, TaskSheetImportantPoint } from './importantPointsUtils';

export function buildEmployeeTasksSummary(params: {
  empId: any;
  empName: string;
  empEmail: string;
  tasks: any[];
  dayIso: string;
  reminders?: any[];
  strategicProjects?: any[];
  notifications?: any[];
  department?: string;
  roleType?: string;
}) {
  const {
    empId,
    empName,
    empEmail,
    tasks,
    dayIso,
    reminders = [],
    strategicProjects = [],
    notifications = [],
    department,
    roleType,
  } = params;
  const empTasks = tasks.filter((t: any) => {
    const assigned = (t.assignedTo || '').toLowerCase();
    return (
      assigned.includes(empName.toLowerCase()) ||
      assigned.includes(empEmail.toLowerCase()) ||
      String(t.employeeId || '') === String(empId)
    );
  });

  let itemIndex = 1;
  const items: TaskSheetItem[] = [];
  const blockers: TaskSheetBlocker[] = [];
  const managerPoints: TaskSheetManagerPoint[] = [];

  empTasks.forEach((t: any) => {
    if (t.incidents && Array.isArray(t.incidents) && t.incidents.length > 0) {
      t.incidents.forEach((inc: any) => {
        blockers.push({
          sourceTask: t.title,
          reason: inc.title || inc.description || 'Incident signalé',
          status: inc.resolved ? 'Résolu' : 'Bloqué',
        });
      });
    } else if (t.status === 'blocked') {
      blockers.push({
        sourceTask: t.title,
        reason: 'Tâche déclarée bloquée',
        status: 'Bloqué',
      });
    }

    if (t.comment && typeof t.comment === 'string' && t.comment.trim()) {
      managerPoints.push({
        sourceTask: t.title,
        content: t.comment.trim(),
        author: empName,
      });
    }
    if (Array.isArray(t.comments) && t.comments.length > 0) {
      t.comments.forEach((c: any) => {
        managerPoints.push({
          sourceTask: t.title,
          content: c.text || c.content || '',
          author: c.author || empName,
          time: c.timestamp || '',
        });
      });
    }

    if (Array.isArray(t.subtasks) && t.subtasks.length > 0) {
      t.subtasks.forEach((sub: any) => {
        const statusLabel = getItemTaskSheetStatus(sub, dayIso, t.date);
        if (!statusLabel) return;

        const isBlocked = sub.status === 'blocked' || sub.isBlocked || Boolean(sub.blockerReason);
        items.push({
          index: itemIndex++,
          taskTitle: t.title,
          subTitle: sub.title,
          status:
            statusLabel === 'Fait'
              ? 'completed'
              : statusLabel === 'En cours'
              ? 'in_progress'
              : statusLabel === 'Bloqué'
              ? 'blocked'
              : 'todo',
          statusLabel,
          estimatedHours: Number(sub.estimatedHours) || 0,
          actualHours: Number(sub.actualHours) || 0,
          blockerReason: sub.blockerReason,
          isBlocked,
        });

        if (isBlocked) {
          blockers.push({
            sourceTask: `${sub.title} (sur "${t.title}")`,
            reason: sub.blockerReason || 'Difficulté opérationnelle signalée',
            status: 'Bloqué',
          });
        }

        if (Array.isArray(sub.comments)) {
          sub.comments.forEach((c: any) => {
            managerPoints.push({
              sourceTask: `${sub.title} (sur "${t.title}")`,
              content: c.text || c.content || '',
              author: c.author || empName,
              time: c.timestamp || '',
            });
          });
        }
      });
    } else {
      const statusLabel = getItemTaskSheetStatus(t, dayIso);
      if (statusLabel) {
        const isBlocked = t.status === 'blocked';
        items.push({
          index: itemIndex++,
          taskTitle: t.title,
          subTitle: t.title,
          status:
            statusLabel === 'Fait'
              ? 'completed'
              : statusLabel === 'En cours'
              ? 'in_progress'
              : statusLabel === 'Bloqué'
              ? 'blocked'
              : 'todo',
          statusLabel,
          estimatedHours: Number(t.estimatedHours) || 1,
          actualHours: Number(t.actualHours) || 0,
          blockerReason: isBlocked ? 'Tâche bloquée' : undefined,
          isBlocked,
        });
      }
    }
  });

  const empRef: any = { id: empId, name: empName, email: empEmail, department, roleType };
  const importantPoints: TaskSheetImportantPoint[] = buildDailyImportantPoints({
    employee: empRef,
    dateIso: dayIso,
    reminders,
    notifications,
  });

  const activeProjectMilestones = extractStrategicMilestones(strategicProjects, empRef).filter(
    (m) =>
      (m.targetDate && m.targetDate.split('T')[0] === dayIso) ||
      (m.completedAt && m.completedAt.split('T')[0] === dayIso) ||
      m.status === 'in_progress' ||
      m.status === 'blocked'
  );

  const scheduleSlots: TaskSheetScheduleSlot[] | undefined =
    importantPoints.length > 0
      ? importantPoints.map((pt) => ({
          timeRange: pt.time,
          activity: `📌 [${pt.categoryLabel}] ${pt.title} (${pt.durationMinutes} min${pt.location ? ` · ${pt.location}` : ''})`,
          resolutionNote: pt.statusLabel,
        }))
      : undefined;

  const taskEstimated = items.reduce((sum, i) => sum + i.estimatedHours, 0);
  const pointsEstimated = importantPoints.reduce((sum, p) => sum + (p.durationMinutes || 0) / 60, 0);
  const totalEstimated = Math.round((taskEstimated + pointsEstimated) * 10) / 10;
  const totalActual = Math.round(items.reduce((sum, i) => sum + i.actualHours, 0) * 10) / 10;

  const topPriorities = [
    ...activeProjectMilestones.slice(0, 2).map((m) => ({
      id: `proj-ms-${m.milestoneId}`,
      title: `${m.projectName} · ${m.title}`,
      priority: (m.isBlocked ? 'P1' : 'P2') as 'P1' | 'P2' | 'P3',
      status: m.isDone ? 'Fait' : m.isBlocked ? 'Bloqué' : 'En cours',
      isMilestone: true,
    })),
    ...(items.length === 0
      ? []
      : empTasks.slice(0, 3).map((t: any, idx: number) => ({
          id: t.id,
          title: t.title,
          priority: (idx === 0 ? 'P1' : idx === 1 ? 'P2' : 'P3') as 'P1' | 'P2' | 'P3',
          status: t.status === 'completed' ? 'Fait' : t.status === 'in_progress' ? 'En cours' : 'À faire',
          isMilestone: !!t.isMilestone,
        }))),
  ].slice(0, 4);

  const postponedTasks = empTasks.filter((t: any) => t.status !== 'completed').map((t: any) => t.title);

  return {
    items,
    importantPoints,
    blockers,
    managerPoints,
    totalEstimated,
    totalActual,
    topPriorities,
    postponedTasks,
    scheduleSlots,
  };
}
