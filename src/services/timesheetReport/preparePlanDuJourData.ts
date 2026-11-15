import { TimesheetReportData } from './timesheetReportTypes';
import {
  PreparedPlanTask,
  buildCleanedScheduleSlots,
  buildPresenceIncidentsList,
} from './preparePlanScheduleAndIncidents';

export function preparePlanDuJourData(data: TimesheetReportData) {
  const dept = (data.department || 'Direction Générale').toUpperCase();
  const dateText = data.dateStr || new Date().toLocaleDateString('fr-FR');
  const locationText = data.location || 'Douala';
  const dayText = data.dayName || dateText;

  let topPriorities = data.topPriorities || [];
  if (topPriorities.length === 0) {
    const uniqueParents: string[] = [];
    data.items.forEach((item) => {
      const p = item.taskTitle || item.subTitle;
      if (p && !uniqueParents.includes(p)) {
        uniqueParents.push(p);
      }
    });

    topPriorities = uniqueParents.slice(0, 3).map((p, idx) => ({
      id: `prio-${idx + 1}`,
      title: p,
      priority: idx === 0 ? 'P1' : idx === 1 ? 'P2' : 'P3',
      status: data.items.filter((i) => i.taskTitle === p).every((i) => i.status === 'completed') ? 'Fait' : 'En cours',
      isMilestone: false,
    }));
  }

  const tasks: PreparedPlanTask[] = data.items.map((item, idx) => {
    const isDone = item.status === 'completed' || item.status === 'fait' || item.status === 'done' || (item as any).completed === true || item.statusLabel?.includes('TERM');
    const isInProgress = item.status === 'in_progress' || item.status === 'en_cours' || item.statusLabel?.includes('COURS');
    const isBlocked = item.status === 'blocked' || item.isBlocked;
    const statusText = isDone ? 'Fait' : isBlocked ? 'Bloqué' : isInProgress ? 'En cours' : 'À faire';

    let prioLabel: 'P1' | 'P2' | 'P3' = 'P2';
    if (idx === 0) prioLabel = 'P1';
    else if (idx >= 3) prioLabel = 'P3';

    return {
      title: item.subTitle || item.taskTitle,
      parentTaskTitle: item.taskTitle || item.subTitle || 'Mission Opérationnelle',
      domain: item.taskTitle || 'Général',
      priorityLabel: prioLabel,
      estimatedMinutes: Math.round((item.estimatedHours || 1.5) * 60),
      dueDate: dateText,
      status: statusText,
      isDone,
      isBlocked,
    };
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isDone).length;
  const inProgressTasks = tasks.filter((t) => t.status === 'En cours').length;
  const todoTasks = tasks.filter((t) => t.status === 'À faire').length;
  const blockedTasks = tasks.filter((t) => t.isBlocked).length;

  const ratePercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const taskInProgressRate = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;
  const taskTodoRate = totalTasks > 0 ? Math.round((todoTasks / totalTasks) * 100) : 0;
  const taskBlockedRate = totalTasks > 0 ? Math.round((blockedTasks / totalTasks) * 100) : 0;
  const postponedCount = Math.max(0, totalTasks - completedTasks);

  const prioritiesTotal = topPriorities.length;
  const prioritiesCompleted = topPriorities.filter((p) => p.status === 'Fait' || p.status === 'completed').length;
  const prioritiesInProgress = topPriorities.filter((p) => p.status === 'En cours' || p.status === 'in_progress').length;
  const prioritiesRate = prioritiesTotal > 0 ? Math.round((prioritiesCompleted / prioritiesTotal) * 100) : 0;
  const prioritiesEngagementRate = prioritiesTotal > 0 ? Math.round(((prioritiesCompleted + prioritiesInProgress) / prioritiesTotal) * 100) : 0;

  const officialDailyNetHours = 8;
  const plannedMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const activeMilestone = topPriorities.find((p) => p.isMilestone);
  const hasMilestone = Boolean(activeMilestone);
  const maxRecommendedSubtasks = hasMilestone ? 5 : 8;

  const parsedHoursWorked = data.dailyAttendance?.hoursWorkedText
    ? parseFloat(data.dailyAttendance.hoursWorkedText.replace('h', '.'))
    : (data.totalActualHours > 0 ? data.totalActualHours : Math.round((plannedMinutes / 60) * 10) / 10);
  const hoursWorkedNumber = isNaN(parsedHoursWorked) ? 8 : parsedHoursWorked;
  const hoursRate = Math.min(100, Math.round((hoursWorkedNumber / officialDailyNetHours) * 100));

  let capacityStatus: 'optimal' | 'overloaded' | 'available' = 'optimal';
  let capacityAdvice = '';

  if (totalTasks === 0) {
    capacityStatus = 'available';
    capacityAdvice = `ℹ️ Aucune activité opérationnelle enregistrée : le collaborateur n'a rien fait ce jour (aucune sous-tâche en cours ni terminée).`;
  } else if (plannedMinutes > 600) {
    capacityStatus = 'overloaded';
    capacityAdvice = `⚠️ Surcharge détectée : ${Math.round(plannedMinutes / 60)}h planifiées sur les sous-tâches (dépassement du seuil de 10h/jour, capacité max 12h). Risque d'inachèvement : priorisez ou déléguez certaines sous-tâches.`;
  } else if (plannedMinutes >= 420) {
    capacityStatus = 'optimal';
    capacityAdvice = `✅ Charge nominale et réaliste : ${Math.round(plannedMinutes / 60)}h estimées sur les sous-tâches (dans la plage recommandée de 7h à 10h, max 12h/jour).`;
  } else {
    capacityStatus = 'available';
    capacityAdvice = `💡 Capacité disponible : ${Math.round(plannedMinutes / 60)}h planifiées sur les sous-tâches (capacité max : 12h). Vous pouvez traiter des sous-tâches supplémentaires.`;
  }

  const scheduleSlots = buildCleanedScheduleSlots(data, tasks, topPriorities, totalTasks);
  const presenceIncidents = buildPresenceIncidentsList(data);

  const unforeseenEvents = data.blockers.map((b) => ({
    time: b.time || 'Journée',
    subject: b.reason,
    sourceTask: b.sourceTask || '',
    status: b.status || 'Bloqué',
    lostMinutes: 30,
  }));

  const totalLostMinutes = unforeseenEvents.reduce((acc, u) => acc + (u.lostMinutes || 0), 0);
  const availabilityRate = Math.max(0, Math.min(100, Math.round(((480 - totalLostMinutes) / 480) * 100)));

  const isLateToday = data.dailyAttendance?.statusType === 'late' || presenceIncidents.some((p) => p.type === 'retard');
  const punctualityRate = isLateToday ? 75 : (data.dailyAttendance?.arrivalTime ? 100 : 0);

  let postponedTasks = data.postponedTasks || [];
  if (postponedTasks.length === 0) {
    postponedTasks = tasks.filter((t) => !t.isDone).map((t) => t.title);
  }

  const managerAlertPoint = data.managerPoints.length > 0
    ? data.managerPoints.map((p) => p.content).join(' ; ')
    : 'Aucun point à signaler ni bloquage aujourd’hui.';

  return {
    dept,
    dateText,
    locationText,
    dayText,
    topPriorities,
    prioritiesTotal,
    prioritiesCompleted,
    prioritiesInProgress,
    prioritiesRate,
    prioritiesEngagementRate,
    tasks,
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    blockedTasks,
    ratePercentage,
    taskInProgressRate,
    taskTodoRate,
    taskBlockedRate,
    postponedCount,
    officialDailyNetHours,
    hoursWorkedNumber,
    hoursRate,
    plannedMinutes,
    hasMilestone,
    milestoneTitle: activeMilestone?.title,
    maxRecommendedSubtasks,
    capacityStatus,
    capacityAdvice,
    scheduleSlots,
    presenceIncidents,
    unforeseenEvents,
    totalLostMinutes,
    availabilityRate,
    punctualityRate,
    isLateToday,
    postponedTasks,
    managerAlertPoint,
    managerPoints: data.managerPoints,
  };
}

export type PreparedPlanDuJour = ReturnType<typeof preparePlanDuJourData>;
