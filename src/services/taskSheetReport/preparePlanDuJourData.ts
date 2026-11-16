import { TaskSheetReportData } from './taskSheetReportTypes';
import {
  PreparedPlanTask,
  buildCleanedScheduleSlots,
  buildPresenceIncidentsList,
} from './preparePlanScheduleAndIncidents';

export function preparePlanDuJourData(data: TaskSheetReportData) {
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

  const importantPoints = data.importantPoints || [];
  const importantPointsCount = importantPoints.length;
  const alertsCount = importantPoints.filter((pt) => pt.category === 'alerte').length;
  const remindersCount = importantPoints.filter((pt) => pt.category === 'rappel').length;
  const movementsCount = importantPoints.filter((pt) => pt.category === 'mouvement').length;
  const importantPointsMinutes = importantPoints.reduce((sum, pt) => sum + (pt.durationMinutes || 0), 0);

  const officialDailyNetHours = 8;
  const plannedMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0) + importantPointsMinutes;
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

  if (totalTasks === 0 && importantPointsCount === 0) {
    capacityStatus = 'available';
    capacityAdvice = `ℹ️ Aucune activité opérationnelle enregistrée : le collaborateur n'a rien fait ce jour (aucune sous-tâche ni point important).`;
  } else if (totalTasks === 0 && importantPointsCount > 0) {
    capacityStatus = plannedMinutes > 600 ? 'overloaded' : plannedMinutes >= 420 ? 'optimal' : 'available';
    capacityAdvice = `📌 Aucune sous-tâche formelle ce jour, mais ${importantPointsCount} point(s) important(s) suivi(s) (${Math.round((importantPointsMinutes / 60) * 10) / 10}h : ${alertsCount} alerte(s), ${remindersCount} rappel(s), ${movementsCount} petit(s) mouvement(s)).`;
  } else if (plannedMinutes > 600) {
    capacityStatus = 'overloaded';
    capacityAdvice = `⚠️ Surcharge détectée : ${Math.round(plannedMinutes / 60)}h planifiées (sous-tâches${importantPointsCount > 0 ? ` + ${importantPointsCount} point(s) important(s)` : ''}, dépassement du seuil de 10h/jour). Priorisez ou déléguez certaines actions.`;
  } else if (plannedMinutes >= 420) {
    capacityStatus = 'optimal';
    capacityAdvice = `✅ Charge nominale et réaliste : ${Math.round(plannedMinutes / 60)}h estimées (sous-tâches${importantPointsCount > 0 ? ` + ${importantPointsCount} point(s) important(s) hors-tâches` : ''}, plage recommandée 7h–10h).`;
  } else {
    capacityStatus = 'available';
    capacityAdvice = `💡 Capacité disponible : ${Math.round(plannedMinutes / 60)}h planifiées (sous-tâches${importantPointsCount > 0 ? ` + ${importantPointsCount} point(s) important(s)` : ''}, max : 12h). Vous pouvez traiter des sous-tâches supplémentaires.`;
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
    dept, dateText, locationText, dayText, topPriorities, prioritiesTotal, prioritiesCompleted,
    prioritiesInProgress, prioritiesRate, prioritiesEngagementRate, tasks, totalTasks, completedTasks,
    inProgressTasks, todoTasks, blockedTasks, ratePercentage, taskInProgressRate, taskTodoRate,
    taskBlockedRate, postponedCount, officialDailyNetHours, hoursWorkedNumber, hoursRate,
    plannedMinutes, hasMilestone, milestoneTitle: activeMilestone?.title, maxRecommendedSubtasks,
    capacityStatus, capacityAdvice, scheduleSlots, presenceIncidents, unforeseenEvents,
    totalLostMinutes, availabilityRate, punctualityRate, isLateToday, postponedTasks,
    managerAlertPoint, managerPoints: data.managerPoints,
    importantPoints, importantPointsCount, alertsCount, remindersCount, movementsCount, importantPointsMinutes,
  };
}

export type PreparedPlanDuJour = ReturnType<typeof preparePlanDuJourData>;
