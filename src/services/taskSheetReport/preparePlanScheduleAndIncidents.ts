import {
  DailyPresenceIncident,
  TaskSheetPriority,
  TaskSheetReportData,
  TaskSheetScheduleSlot,
} from './taskSheetReportTypes';

export interface PreparedPlanTask {
  title: string;
  parentTaskTitle: string;
  domain: string;
  priorityLabel: 'P1' | 'P2' | 'P3';
  estimatedMinutes: number;
  dueDate: string;
  status: string;
  isDone: boolean;
  isBlocked: boolean | undefined;
}

export function buildCleanedScheduleSlots(
  data: TaskSheetReportData,
  tasks: PreparedPlanTask[],
  topPriorities: TaskSheetPriority[],
  totalTasks: number
): TaskSheetScheduleSlot[] {
  const points = data.importantPoints || [];
  if (totalTasks === 0 && points.length === 0) {
    return [
      {
        timeRange: 'Journée complète (08:00 – 17:00)',
        activity: "N'a rien fait de la journée",
        resolutionNote: 'Aucune sous-tâche ni point important en cours ou terminé ce jour',
      },
    ];
  }

  if (totalTasks === 0 && points.length > 0 && (!data.scheduleSlots || data.scheduleSlots.length === 0)) {
    const morning = points.filter((pt) => (pt.time || '09:00') < '12:00');
    const afternoon = points.filter((pt) => (pt.time || '09:00') >= '12:00');
    const fmt = (pt: typeof points[number]) => `[${pt.categoryLabel}] ${pt.title} (${pt.durationMinutes} min)`;
    return [
      {
        timeRange: '08:00 – 10:00',
        activity: morning[0] ? fmt(morning[0]) : 'Suivi points importants / coordination',
        resolutionNote: morning[0]?.statusLabel || 'Point important suivi',
      },
      {
        timeRange: '10:00 – 12:00',
        activity: morning[1] ? fmt(morning[1]) : (morning[0] ? `Suite & suivi : ${morning[0].title}` : 'Traitement alertes & rappels matin'),
        resolutionNote: morning[1]?.statusLabel || 'Activité de suivi',
      },
      {
        timeRange: '12:00 – 13:00',
        activity: 'Pause Déjeuner (12h00 – 13h00)',
        isBreak: true,
        isBuffer: false,
        resolutionNote: 'Pause obligatoire 12h–13h respectée',
      },
      {
        timeRange: '13:00 – 15:30',
        activity: afternoon[0] ? fmt(afternoon[0]) : 'Suivi dossiers & points importants',
        resolutionNote: afternoon[0]?.statusLabel || 'Suivi opérationnel',
      },
      {
        timeRange: '15:30 – 17:00',
        activity: afternoon[1] ? fmt(afternoon[1]) : 'Clôture journée & revue des points importants',
        isBreak: false,
        isBuffer: false,
        resolutionNote: 'Fin de journée opérationnelle',
      },
    ];
  }

  let scheduleSlots = data.scheduleSlots || [];
  if (scheduleSlots.length === 0 || scheduleSlots.some((s) => s.timeRange.includes('13:00 – 14:00'))) {
    const s1 = tasks[0]?.title || topPriorities[0]?.title || 'Non assigné';
    const s2 = tasks[1]?.title || topPriorities[1]?.title || (tasks[0] ? `Suite : ${tasks[0].title}` : 'Non assigné');
    const s3 = tasks[2]?.title || (tasks[1] ? `Suite : ${tasks[1].title}` : (tasks[0] ? `Suite : ${tasks[0].title}` : 'Non assigné'));
    const s4 = tasks[3]?.title || (tasks[2] ? `Suite : ${tasks[2].title}` : (tasks[0] ? `Finalisation : ${tasks[0].title}` : 'Non assigné'));

    scheduleSlots = [
      { timeRange: '08:00 – 10:00', activity: s1, resolutionNote: tasks[0]?.isDone ? 'Sous-tâche finalisée avec succès' : 'Traitement en cours' },
      { timeRange: '10:00 – 12:00', activity: s2, resolutionNote: tasks[1]?.isDone ? 'Livrables produits et vérifiés' : 'Avancement nominal' },
      { timeRange: '12:00 – 13:00', activity: 'Pause Déjeuner (12h00 – 13h00)', isBreak: true, isBuffer: false, resolutionNote: 'Pause obligatoire 12h–13h respectée' },
      { timeRange: '13:00 – 15:30', activity: s3, resolutionNote: tasks[2]?.isDone ? 'Terminé' : 'En cours d’achèvement' },
      { timeRange: '15:30 – 17:00', activity: s4, isBreak: false, isBuffer: false, resolutionNote: 'Fin de journée opérationnelle' },
    ];
  }

  return scheduleSlots.map((s) => {
    const isLunchBreak = (s.timeRange.startsWith('12:00') && s.timeRange.includes('13:00')) || (s.isBreak && s.timeRange.includes('12:00'));
    if (isLunchBreak) {
      return { ...s, timeRange: '12:00 – 13:00', activity: 'Pause Déjeuner (12h00 – 13h00)', isBreak: true, isBuffer: false };
    }
    let cleanActivity = s.activity;
    if (cleanActivity.toLowerCase().includes('tampon') || cleanActivity.toLowerCase().includes('pause')) {
      cleanActivity = cleanActivity
        .replace(/⚡?\s*tampon\s*imprévus?\s*\/?\s*(pause\s*\(?12h[–-]13h\)?)?/gi, '')
        .replace(/pause.*?\//gi, '')
        .replace(/⚡\s*tampon.*/gi, '')
        .trim();
      if (!cleanActivity) {
        cleanActivity = s.timeRange.includes('15:30')
          ? 'Clôture opérationnelle de journée, bilan & transmission TaskSheet'
          : 'Traitement des sous-tâches prioritaires';
      }
    }
    return { ...s, activity: cleanActivity, isBreak: false, isBuffer: false };
  });
}

export function buildPresenceIncidentsList(data: TaskSheetReportData): DailyPresenceIncident[] {
  const presenceIncidents: DailyPresenceIncident[] = [];
  if (Array.isArray(data.presenceIncidents)) {
    presenceIncidents.push(...data.presenceIncidents);
  }
  if (Array.isArray(data.dailyAttendance?.incidents)) {
    data.dailyAttendance.incidents.forEach((inc) => {
      if (!presenceIncidents.some((p) => p.time === inc.time && p.description === inc.description)) {
        presenceIncidents.push(inc);
      }
    });
  }

  if (data.dailyAttendance?.statusType === 'late') {
    const alreadyHasRetard = presenceIncidents.some((p) => p.type === 'retard');
    if (!alreadyHasRetard) {
      presenceIncidents.push({
        time: data.dailyAttendance.arrivalTime || 'Matin',
        type: 'retard',
        label: "Retard à l'arrivée",
        description: `Arrivée constatée à ${data.dailyAttendance.arrivalTime || 'retard'} (au lieu de 08h00)${data.dailyAttendance.incidentNote ? ` — ${data.dailyAttendance.incidentNote}` : ''}`,
        isJustified: false,
      });
    }
  }

  if (data.dailyAttendance?.incidentNote) {
    const note = data.dailyAttendance.incidentNote;
    const alreadyConsigned = presenceIncidents.some((p) => p.description.includes(note));
    if (!alreadyConsigned) {
      presenceIncidents.push({
        time: data.dailyAttendance.arrivalTime || 'Journée',
        type: 'autre',
        label: 'Incident de présence',
        description: note,
        isJustified: false,
      });
    }
  }

  return presenceIncidents;
}
