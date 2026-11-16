import { AttendanceIncident, Employee, Presence, Task } from '../../types';
import {
  DailyCapacityMetrics,
  DailyTaskSheetData,
  DailyTaskSheetTaskItem,
} from './taskSheetTypes';

import { EmployeeReminderActivity, StrategicMilestoneEntry } from '../reminders/reminderActivityUtils';
import { TaskSheetImportantPoint } from './importantPointsUtils';

export function buildDailyCapacityMetrics(
  subtaskItems: DailyTaskSheetTaskItem[],
  sortedParentTasks: Task[],
  dayReminders: EmployeeReminderActivity[] = [],
  projectMilestones: StrategicMilestoneEntry[] = [],
  importantPoints: TaskSheetImportantPoint[] = []
): DailyCapacityMetrics {
  const totalTasks = subtaskItems.length;
  const workMinutesNet = 720;
  const pointsMinutes =
    importantPoints.length > 0
      ? importantPoints.reduce((sum, p) => sum + (p.durationMinutes || 0), 0)
      : dayReminders.reduce((sum, r) => sum + (r.durationMinutes || 0), 0);
  const pointsCount = importantPoints.length > 0 ? importantPoints.length : dayReminders.length;
  const plannedMinutes = subtaskItems.reduce((sum, s) => sum + s.estimatedMinutes, 0) + pointsMinutes;
  const activeTaskMilestone = sortedParentTasks.find((t) => t.isMilestone && t.status !== 'completed');
  const activeProjMilestone = projectMilestones.find((m) => !m.isDone);
  const hasMilestone = Boolean(activeTaskMilestone || activeProjMilestone);
  const milestoneTitle = activeTaskMilestone?.title || (activeProjMilestone ? `${activeProjMilestone.projectName} — ${activeProjMilestone.title}` : undefined);
  const maxRecommendedSubtasks = hasMilestone ? 5 : 8;

  let capacityStatus: 'optimal' | 'overloaded' | 'available' = 'optimal';
  let capacityAdvice = '';

  if (totalTasks === 0 && pointsCount === 0 && projectMilestones.length === 0) {
    capacityStatus = 'available';
    capacityAdvice = `ℹ️ Aucune activité opérationnelle enregistrée : le collaborateur n'a rien fait ce jour (aucune sous-tâche, jalon ni point important).`;
  } else if (plannedMinutes > 600) {
    capacityStatus = 'overloaded';
    capacityAdvice = `⚠️ Surcharge détectée : ${Math.round(plannedMinutes / 60)}h planifiées (tâches + ${Math.round((pointsMinutes / 60) * 10) / 10}h de points importants, seuil > 10h). Priorisez ou déléguez certaines actions.`;
  } else if (plannedMinutes >= 420) {
    capacityStatus = 'optimal';
    capacityAdvice = `✅ Charge équilibrée et réaliste : ${Math.round(plannedMinutes / 60)}h estimées (dont ${pointsCount} point(s) important(s) hors-tâches).`;
  } else {
    capacityStatus = 'available';
    capacityAdvice = `💡 Capacité disponible : ${Math.round(plannedMinutes / 60)}h planifiées (sous-tâches${pointsCount > 0 ? ` + ${pointsCount} point(s) important(s)` : ''}, max 12h).`;
  }

  return {
    workMinutesNet,
    plannedMinutes,
    plannedSubtasksCount: totalTasks,
    maxRecommendedSubtasks,
    hasMilestone,
    milestoneTitle,
    capacityStatus,
    capacityAdvice,
  };
}

export function buildDailyScheduleSlots(
  totalTasks: number,
  subtaskItems: DailyTaskSheetTaskItem[],
  dayReminders: EmployeeReminderActivity[] = [],
  importantPoints: TaskSheetImportantPoint[] = []
): DailyTaskSheetData['scheduleSlots'] {
  const effectivePoints: Array<{ time: string; title: string; durationMinutes: number; statusLabel: string; categoryLabel?: string }> =
    importantPoints.length > 0
      ? importantPoints.map((p) => ({
          time: p.time,
          title: `[${p.categoryLabel}] ${p.title}`,
          durationMinutes: p.durationMinutes,
          statusLabel: p.statusLabel,
          categoryLabel: p.categoryLabel,
        }))
      : dayReminders.map((r) => ({
          time: r.time,
          title: r.title,
          durationMinutes: r.durationMinutes,
          statusLabel: r.statusLabel,
        }));

  if (totalTasks === 0 && effectivePoints.length === 0) {
    return [
      {
        timeRange: 'Journée complète (08:00 – 17:00)',
        activity: "N'a rien fait de la journée",
        resolutionNote: 'Aucune sous-tâche ni point important en cours ou terminé ce jour',
        statusBadge: 'Inactif',
      },
    ];
  }

  const morningPoints = effectivePoints.filter((r) => r.time < '12:00');
  const afternoonPoints = effectivePoints.filter((r) => r.time >= '12:00');
  const formatPointList = (list: typeof effectivePoints) =>
    list.map((r) => `📌 ${r.time} ${r.title} (${r.durationMinutes} min)`).join(' · ');

  return [
    {
      timeRange: '08:00 – 10:00',
      activity: subtaskItems[0]
        ? `${subtaskItems[0].title} (${subtaskItems[0].parentTaskTitle})`
        : morningPoints[0]
        ? `📌 ${morningPoints[0].title} (${morningPoints[0].durationMinutes} min)`
        : 'Suivi points importants / coordination',
      resolutionNote: morningPoints.length > 0
        ? formatPointList(morningPoints)
        : subtaskItems[0]?.status === 'Fait'
        ? 'Sous-tâche résolue et clôturée ✓'
        : subtaskItems[0]
        ? 'Traitement opérationnel'
        : 'Non assigné',
      statusBadge: subtaskItems[0]?.status || morningPoints[0]?.statusLabel || 'Inactif',
    },
    {
      timeRange: '10:00 – 12:00',
      activity: subtaskItems[1]
        ? `${subtaskItems[1].title} (${subtaskItems[1].parentTaskTitle})`
        : subtaskItems[0]
        ? `Suite résolution : ${subtaskItems[0].title}`
        : morningPoints.length > 0
        ? formatPointList(morningPoints)
        : 'Traitement alertes & rappels matin',
      resolutionNote: subtaskItems[1]?.status === 'Fait' ? 'Sous-tâche validée ✓' : subtaskItems[1] ? 'Exécution technique' : 'Activité de suivi',
      statusBadge: subtaskItems[1]?.status || subtaskItems[0]?.status || morningPoints[0]?.statusLabel || 'Planifié',
    },
    {
      timeRange: '12:00 – 13:00',
      activity: '🍽️ Pause Déjeuner Officielle (12h00 – 13h00)',
      resolutionNote: 'Coupure obligatoire — aucune tâche planifiée sur ce créneau',
      isBreak: true,
      isBuffer: false,
      statusBadge: 'Pause',
    },
    {
      timeRange: '13:00 – 15:30',
      activity: subtaskItems[2]
        ? `${subtaskItems[2].title} (${subtaskItems[2].parentTaskTitle})`
        : afternoonPoints[0]
        ? `📌 ${afternoonPoints[0].title} (${afternoonPoints[0].durationMinutes} min)`
        : subtaskItems[1]
        ? `Suite : ${subtaskItems[1].title}`
        : subtaskItems[0]
        ? `Suite : ${subtaskItems[0].title}`
        : 'Suivi dossiers & points importants',
      resolutionNote: afternoonPoints.length > 0
        ? formatPointList(afternoonPoints)
        : subtaskItems[2]?.status === 'Fait'
        ? 'Sous-tâche achevée ✓'
        : subtaskItems[2]
        ? 'En cours de réalisation'
        : 'Suivi opérationnel',
      statusBadge: subtaskItems[2]?.status || afternoonPoints[0]?.statusLabel || 'En cours',
    },
    {
      timeRange: '15:30 – 17:00',
      activity: subtaskItems[3]
        ? `${subtaskItems[3].title} (${subtaskItems[3].parentTaskTitle})`
        : afternoonPoints[1]
        ? `📌 ${afternoonPoints[1].title} (${afternoonPoints[1].durationMinutes} min)`
        : subtaskItems[2]
        ? `Suite : ${subtaskItems[2].title}`
        : subtaskItems[0]
        ? `Finalisation : ${subtaskItems[0].title}`
        : 'Clôture journée & revue des points importants',
      resolutionNote: subtaskItems[3]?.status === 'Fait' ? 'Sous-tâche achevée ✓' : 'Fin de journée opérationnelle (17h00)',
      isBuffer: false,
      statusBadge: subtaskItems[3]?.status || afternoonPoints[1]?.statusLabel || 'Bilan',
    },
  ];
}

export function collectDailyPresenceIncidents(
  employee: Employee,
  date: string,
  presences: Presence[],
  incidents: AttendanceIncident[]
): DailyTaskSheetData['presenceIncidents'] {
  const dayPres = presences.find((p) => String(p.employeeId) === String(employee.id) && p.date === date);
  const empIncidents = incidents.filter((i) => String(i.employeeId) === String(employee.id) && i.date === date);
  const presenceIncidents: DailyTaskSheetData['presenceIncidents'] = [];

  empIncidents.forEach((i) => {
    let typeLabel = "Incident de présence";
    if (i.type === 'retard') typeLabel = "Retard à l'arrivée";
    else if (i.type === 'sortie_professionnelle' || i.type === 'sortie_prematuree') typeLabel = "Sortie en cours de journée";
    else if (i.type === 'depart_anticipe') typeLabel = "Départ anticipé";
    else if (i.type === 'permission') typeLabel = "Permission d'absence";
    else if (i.type === 'pause_anticipee' || i.type === 'rallonge_pause' || i.type === 'pause_prolongee') typeLabel = "Dépassement / Anomalie Pause";
    else if (i.type === 'absence_injustifiee' || i.type === 'absence_non_autorisee') typeLabel = "Absence non autorisée";

    presenceIncidents.push({
      time: i.timeString || 'Pointage',
      type: i.type,
      label: typeLabel,
      description: i.reason || i.description || 'Anomalie constatée sur les horaires',
      isJustified: i.isJustified || i.status === 'justifie',
    });
  });

  if (dayPres) {
    const isLate = dayPres.status === 'late' || (dayPres.arrivalTime && dayPres.arrivalTime > '08:00');
    if (isLate && !presenceIncidents.some((p) => p.type === 'retard')) {
      presenceIncidents.push({
        time: dayPres.arrivalTime || 'Matin',
        type: 'retard',
        label: "Retard à l'arrivée",
        description: `Arrivée constatée à ${dayPres.arrivalTime} (horaire officiel 08h00)${dayPres.correctionReason ? ` — Motif : ${dayPres.correctionReason}` : ''}`,
        isJustified: Boolean(dayPres.correctionReason && dayPres.correctionReasonStatus === 'approved'),
      });
    }

    if (dayPres.sortieProStart && !presenceIncidents.some((p) => p.type.includes('sortie'))) {
      presenceIncidents.push({
        time: dayPres.sortieProStart,
        type: 'sortie',
        label: "Sortie temporaire",
        description: `Sortie de ${dayPres.sortieProStart} à ${dayPres.sortieProEnd || 'en cours'}${dayPres.sortieProReason ? ` — Motif : ${dayPres.sortieProReason}` : ''}`,
        isJustified: true,
      });
    }

    if (dayPres.departureTime && dayPres.departureTime < '17:00' && dayPres.departureReason && !presenceIncidents.some((p) => p.type.includes('depart'))) {
      presenceIncidents.push({
        time: dayPres.departureTime,
        type: 'depart_anticipe',
        label: "Départ anticipé",
        description: `Départ enregistré à ${dayPres.departureTime} (avant 17h00) — Motif : ${dayPres.departureReason}`,
        isJustified: dayPres.departureReasonStatus === 'approved',
      });
    }
  }

  return presenceIncidents;
}

export { collectBlockagesAndComments } from './dailyTaskSheetBlockages';
