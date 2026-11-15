import { AttendanceIncident, Employee, Presence, Task } from '../../types';
import {
  DailyCapacityMetrics,
  DailyTimesheetData,
  DailyTimesheetTaskItem,
} from './timesheetTypes';

export function buildDailyCapacityMetrics(
  subtaskItems: DailyTimesheetTaskItem[],
  sortedParentTasks: Task[]
): DailyCapacityMetrics {
  const totalTasks = subtaskItems.length;
  const workMinutesNet = 720;
  const plannedMinutes = subtaskItems.reduce((sum, s) => sum + s.estimatedMinutes, 0);
  const activeMilestone = sortedParentTasks.find((t) => t.isMilestone && t.status !== 'completed');
  const hasMilestone = Boolean(activeMilestone);
  const maxRecommendedSubtasks = hasMilestone ? 5 : 8;

  let capacityStatus: 'optimal' | 'overloaded' | 'available' = 'optimal';
  let capacityAdvice = '';

  if (totalTasks === 0) {
    capacityStatus = 'available';
    capacityAdvice = `ℹ️ Aucune activité opérationnelle enregistrée : le collaborateur n'a rien fait ce jour (aucune sous-tâche en cours ni terminée).`;
  } else if (plannedMinutes > 600) {
    capacityStatus = 'overloaded';
    capacityAdvice = `⚠️ Surcharge détectée : ${Math.round(plannedMinutes / 60)}h planifiées sur les sous-tâches (seuil de surcharge > 10h, capacité maximale 12h/jour). Risque d'inachèvement : priorisez ou déléguez certaines sous-tâches.`;
  } else if (plannedMinutes >= 420) {
    capacityStatus = 'optimal';
    capacityAdvice = `✅ Charge équilibrée et réaliste : ${Math.round(plannedMinutes / 60)}h estimées sur les sous-tâches (plage recommandée de 7h à 10h, max 12h).`;
  } else {
    capacityStatus = 'available';
    capacityAdvice = `💡 Capacité disponible : ${Math.round(plannedMinutes / 60)}h planifiées sur les sous-tâches (capacité max : 12h). Vous pouvez traiter des sous-tâches additionnelles.`;
  }

  return {
    workMinutesNet,
    plannedMinutes,
    plannedSubtasksCount: totalTasks,
    maxRecommendedSubtasks,
    hasMilestone,
    milestoneTitle: activeMilestone?.title,
    capacityStatus,
    capacityAdvice,
  };
}

export function buildDailyScheduleSlots(
  totalTasks: number,
  subtaskItems: DailyTimesheetTaskItem[]
): DailyTimesheetData['scheduleSlots'] {
  if (totalTasks === 0) {
    return [
      {
        timeRange: '08:00 – 10:00',
        activity: "N'a rien fait",
        resolutionNote: 'Aucune sous-tâche en cours ni terminée ce jour',
        statusBadge: 'Inactif',
      },
      {
        timeRange: '10:00 – 12:00',
        activity: "N'a rien fait",
        resolutionNote: 'Aucune sous-tâche en cours ni terminée ce jour',
        statusBadge: 'Inactif',
      },
      {
        timeRange: '12:00 – 13:00',
        activity: '🍽️ Pause Déjeuner Officielle (12h00 – 13h00)',
        resolutionNote: 'Coupure obligatoire — aucune tâche planifiée',
        isBreak: true,
        isBuffer: false,
        statusBadge: 'Pause',
      },
      {
        timeRange: '13:00 – 15:30',
        activity: "N'a rien fait",
        resolutionNote: 'Aucune sous-tâche en cours ni terminée ce jour',
        statusBadge: 'Inactif',
      },
      {
        timeRange: '15:30 – 17:00',
        activity: "N'a rien fait",
        resolutionNote: 'Aucune sous-tâche en cours ni terminée ce jour',
        isBuffer: false,
        statusBadge: 'Inactif',
      },
    ];
  }

  return [
    {
      timeRange: '08:00 – 10:00',
      activity: subtaskItems[0] ? `${subtaskItems[0].title} (${subtaskItems[0].parentTaskTitle})` : "Aucune tâche assignée sur ce créneau",
      resolutionNote: subtaskItems[0]?.status === 'Fait' ? 'Sous-tâche résolue et clôturée ✓' : (subtaskItems[0] ? 'Traitement opérationnel' : 'Non assigné'),
      statusBadge: subtaskItems[0]?.status || 'Inactif',
    },
    {
      timeRange: '10:00 – 12:00',
      activity: subtaskItems[1] ? `${subtaskItems[1].title} (${subtaskItems[1].parentTaskTitle})` : (subtaskItems[0] ? `Suite résolution : ${subtaskItems[0].title}` : "Aucune tâche assignée"),
      resolutionNote: subtaskItems[1]?.status === 'Fait' ? 'Sous-tâche validée ✓' : (subtaskItems[1] ? 'Exécution technique' : 'Non assigné'),
      statusBadge: subtaskItems[1]?.status || subtaskItems[0]?.status || 'Inactif',
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
      activity: subtaskItems[2] ? `${subtaskItems[2].title} (${subtaskItems[2].parentTaskTitle})` : (subtaskItems[1] ? `Suite : ${subtaskItems[1].title}` : (subtaskItems[0] ? `Suite : ${subtaskItems[0].title}` : "Aucune tâche assignée")),
      resolutionNote: subtaskItems[2]?.status === 'Fait' ? 'Sous-tâche achevée ✓' : (subtaskItems[2] ? 'En cours de réalisation' : 'Non assigné'),
      statusBadge: subtaskItems[2]?.status || 'En cours',
    },
    {
      timeRange: '15:30 – 17:00',
      activity: subtaskItems[3] ? `${subtaskItems[3].title} (${subtaskItems[3].parentTaskTitle})` : (subtaskItems[2] ? `Suite : ${subtaskItems[2].title}` : (subtaskItems[0] ? `Finalisation : ${subtaskItems[0].title}` : "Aucune tâche assignée")),
      resolutionNote: subtaskItems[3]?.status === 'Fait' ? 'Sous-tâche achevée ✓' : 'Fin de journée opérationnelle (17h00)',
      isBuffer: false,
      statusBadge: subtaskItems[3]?.status || 'Bilan',
    },
  ];
}

export function collectDailyPresenceIncidents(
  employee: Employee,
  date: string,
  presences: Presence[],
  incidents: AttendanceIncident[]
): DailyTimesheetData['presenceIncidents'] {
  const dayPres = presences.find((p) => String(p.employeeId) === String(employee.id) && p.date === date);
  const empIncidents = incidents.filter((i) => String(i.employeeId) === String(employee.id) && i.date === date);
  const presenceIncidents: DailyTimesheetData['presenceIncidents'] = [];

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

export { collectBlockagesAndComments } from './dailyTimesheetBlockages';
