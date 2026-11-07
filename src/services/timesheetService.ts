import { Employee, Task, Subtask, Presence, AttendanceIncident, TaskProject } from '../types';
import { isTaskAssignedToEmployee } from '../utils/rendementCalculator';
import { exportToExcel } from './excelExportService';
import { isSubtaskInLast3Days, sortSubtasksNewestFirst } from '../utils/subtaskFilterUtils';
import { isTaskEligibleForDayTimesheet, getItemTimesheetStatus } from '../utils/timesheetTaskEligibility';

export interface DailyTimesheetTaskItem {
  id?: string;
  title: string;
  parentTaskTitle: string;
  domain: string;
  priorityLabel: 'P1' | 'P2' | 'P3';
  estimatedMinutes: number;
  dueDate: string;
  status: 'Fait' | 'En cours' | 'À faire' | 'Bloqué';
  isMilestone?: boolean;
}

export interface DailyCapacityMetrics {
  workMinutesNet: number; // 480 min = 8h nettes
  plannedMinutes: number;
  plannedSubtasksCount: number;
  maxRecommendedSubtasks: number;
  hasMilestone: boolean;
  milestoneTitle?: string;
  capacityStatus: 'optimal' | 'overloaded' | 'available';
  capacityAdvice: string;
}

export interface DailyTimesheetData {
  employee: Employee;
  date: string;
  dayName: string;
  location: string;
  department: string;
  topPriorities: { id: string; title: string; priority: string; status: string; isMilestone?: boolean }[];
  tasks: DailyTimesheetTaskItem[];
  totalTasks: number;
  completedTasks: number;
  ratePercentage: number;
  postponedCount: number;
  capacity: DailyCapacityMetrics;
  scheduleSlots: {
    timeRange: string;
    activity: string;
    resolutionNote?: string;
    isBreak?: boolean;
    isBuffer?: boolean;
    statusBadge?: string;
  }[];
  presenceIncidents: {
    time?: string;
    type: string;
    label: string;
    description: string;
    isJustified?: boolean;
  }[];
  unforeseenEvents: {
    time: string;
    subject: string;
    lostMinutes: number;
    sourceTask?: string;
    isFromBlockage?: boolean;
    status?: string;
  }[];
  postponedTasks: string[];
  managerAlertPoint: string;
  managerComments: {
    id: string;
    taskTitle: string;
    isSubtask: boolean;
    author: string;
    time: string;
    text: string;
  }[];
}

export interface MonthlyTimesheetData {
  employee: Employee;
  month: string; // YYYY-MM
  monthName: string;
  totalDaysWorked: number;
  totalHoursWorked: number;
  totalTasksAssigned: number;
  totalTasksCompleted: number;
  completionRate: number;
  dailyBreakdown: {
    date: string;
    dayName: string;
    arrivalTime: string;
    departureTime: string;
    hoursWorked: number;
    status: string;
    tasksDoneCount: number;
  }[];
}

export interface YearlyTimesheetData {
  employee: Employee;
  year: number;
  totalHoursWorked: number;
  totalDaysPresent: number;
  totalTasksCompleted: number;
  avgCompletionRate: number;
  monthlyBreakdown: {
    monthName: string;
    daysWorked: number;
    hoursWorked: number;
    tasksCompleted: number;
    rendementRate: number;
  }[];
}

/**
 * Génère automatiquement la feuille de temps JOURNALIÈRE
 * Structurée de manière dynamique :
 * - Priorités = Tâches parentes (Job Description & Missions clés)
 * - Tâches du jour = Sous-tâches concrètes traitées
 * - Plan horaire = Résolution progressive avec Pause obligatoire 13h-14h
 * - Gestion des imprévus
 * - Calcul dynamique de la capacité journalière
 */
export function generateDailyTimesheet(
  employee: Employee,
  date: string,
  allTasks: Task[],
  presences: Presence[],
  incidents: AttendanceIncident[] = [],
  projects: TaskProject[] = []
): DailyTimesheetData {
  const d = new Date(date + 'T12:00:00');
  const dayName = d.toLocaleDateString('fr-FR', { weekday: 'long' });

  // 1. Tâches assignées à l'employé (Représentant son Job Description et ses projets)
  const empTasks = allTasks.filter((t) => {
    if (!isTaskAssignedToEmployee(t, employee)) return false;
    // Tâche directe pour ce jour
    if (t.date === date || (t.dueDate && t.dueDate === date)) return true;
    // Tâche active (en cours, à faire, en attente)
    if (t.status === 'in_progress' || t.status === 'en_cours' || t.status === 'todo' || t.status === 'pending_validation') return true;
    // Tâche contenant des sous-tâches actives ou récentes pour cette date
    if (t.subtasks && t.subtasks.some((s) => 
      s.dueDate === date || 
      s.startDate === date || 
      (s.createdAt && s.createdAt.startsWith(date)) ||
      isSubtaskInLast3Days(s, date)
    )) return true;
    return false;
  });

  // Tri par priorité : Jalons stratégiques et urgences d'abord
  const sortedParentTasks = [...empTasks].sort((a, b) => {
    if (a.isMilestone && !b.isMilestone) return -1;
    if (!a.isMilestone && b.isMilestone) return 1;
    const pWeight: Record<string, number> = { urgent: 4, high: 3, haut: 3, medium: 2, low: 1 };
    return (pWeight[b.priority] || 2) - (pWeight[a.priority] || 2);
  });

  // 2. LES 3 PRIORITÉS DU JOUR (Les grandes tâches / Job Description)
  const topPriorities = sortedParentTasks.slice(0, 3).map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    status: t.status === 'completed' || (t as any).completed === true ? 'Fait' : 'En cours',
    isMilestone: t.isMilestone,
  }));

  // 3. TÂCHES DU JOUR = LES SOUS-TÂCHES CONCRÈTES TRAITÉES
  const subtaskItems: DailyTimesheetTaskItem[] = [];

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
      // Filtrage strict : seules les sous-tâches terminées ce jour ou en cours ce jour sont incluses.
      // Une sous-tâche terminée avant cette journée est strictement exclue, même si son échéance est aujourd'hui.
      parentTask.subtasks.forEach((sub) => {
        const subStatus = getItemTimesheetStatus(sub, date, parentTask.date);
        if (!subStatus) return; // Non éligible (ex: terminée avant ce jour)

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
      // Tâche sans sous-tâches : vérification stricte de son statut pour la journée
      const parentStatus = getItemTimesheetStatus(parentTask, date);
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

  // 4. CALCUL DE CAPACITÉ JOURNALIÈRE (basée sur les sous-tâches, 12h max, seuil de surcharge > 10h par jour)
  const workMinutesNet = 720; // 12 heures maximum par jour
  const plannedMinutes = subtaskItems.reduce((sum, s) => sum + s.estimatedMinutes, 0);
  const activeMilestone = sortedParentTasks.find((t) => t.isMilestone && t.status !== 'completed');
  const hasMilestone = Boolean(activeMilestone);

  const maxRecommendedSubtasks = hasMilestone ? 5 : 8;

  let capacityStatus: 'optimal' | 'overloaded' | 'available' = 'optimal';
  let capacityAdvice = '';

  if (plannedMinutes > 600) {
    // Plus de 10h par jour (> 600 min) = Surcharge effective
    capacityStatus = 'overloaded';
    capacityAdvice = `⚠️ Surcharge détectée : ${Math.round(plannedMinutes / 60)}h planifiées sur les sous-tâches (seuil de surcharge > 10h, capacité maximale 12h/jour). Risque d'inachèvement : priorisez ou déléguez certaines sous-tâches.`;
  } else if (plannedMinutes >= 420) {
    // 7h à 10h (420 à 600 min) = Charge équilibrée et réaliste
    capacityStatus = 'optimal';
    capacityAdvice = `✅ Charge équilibrée et réaliste : ${Math.round(plannedMinutes / 60)}h estimées sur les sous-tâches (plage recommandée de 7h à 10h, max 12h).`;
  } else {
    // Moins de 7h = Capacité disponible
    capacityStatus = 'available';
    capacityAdvice = `💡 Capacité disponible : ${Math.round(plannedMinutes / 60)}h planifiées sur les sous-tâches (capacité max : 12h). Vous pouvez traiter des sous-tâches additionnelles.`;
  }

  const capacity: DailyCapacityMetrics = {
    workMinutesNet,
    plannedMinutes,
    plannedSubtasksCount: totalTasks,
    maxRecommendedSubtasks,
    hasMilestone,
    milestoneTitle: activeMilestone?.title,
    capacityStatus,
    capacityAdvice,
  };

  // 5. PLAN HORAIRE DYNAMIQUE (RÉSOLUTIONS DE SOUS-TÂCHES & PAUSE OBLIGATOIRE 13h-14h)
  const s1 = subtaskItems[0];
  const s2 = subtaskItems[1];
  const s3 = subtaskItems[2];
  const s4 = subtaskItems[3];
  const s5 = subtaskItems[4];

  const scheduleSlots = [
    {
      timeRange: '08:00 – 10:00',
      activity: s1 ? `${s1.title} (${s1.parentTaskTitle})` : 'Prise de contact, lecture des priorités & mise en route',
      resolutionNote: s1?.status === 'Fait' ? 'Sous-tâche résolue et clôturée ✓' : 'Traitement opérationnel des livrables',
      statusBadge: s1?.status || 'En cours',
    },
    {
      timeRange: '10:00 – 12:00',
      activity: s2 ? `${s2.title} (${s2.parentTaskTitle})` : (s1 ? `Suite résolution : ${s1.title}` : 'Avancement des tâches prioritaires P1'),
      resolutionNote: s2?.status === 'Fait' ? 'Sous-tâche validée ✓' : 'Exécution technique et validations',
      statusBadge: s2?.status || 'En cours',
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
      activity: s3 ? `${s3.title} (${s3.parentTaskTitle})` : (s2 ? `Reprise et finalisation : ${s2.title}` : 'Exécution des sous-tâches de l’après-midi'),
      resolutionNote: s3?.status === 'Fait' ? 'Sous-tâche achevée ✓' : 'Déploiement et revues de code/dossier',
      statusBadge: s3?.status || 'En cours',
    },
    {
      timeRange: '15:30 – 17:00',
      activity: s4 ? `${s4.title} (${s4.parentTaskTitle})` : 'Clôture opérationnelle de journée, bilan & transmission feuille de temps',
      resolutionNote: 'Revue des critères d’acceptation et reporting au manager (fin à 17h00)',
      isBuffer: false,
      statusBadge: 'Bilan',
    },
  ];

  // 6. INCIDENTS DE PRÉSENCE DU JOUR (Retards, Sorties, Départs anticipés...)
  const dayPres = presences.find((p) => String(p.employeeId) === String(employee.id) && p.date === date);
  const empIncidents = incidents.filter((i) => String(i.employeeId) === String(employee.id) && i.date === date);
  const presenceIncidents: DailyTimesheetData['presenceIncidents'] = [];

  // Incidents déclarés dans la collection attendance_incidents
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

  // Retard constaté sur le pointage (si pas déjà listé)
  if (dayPres) {
    const isLate = dayPres.status === 'late' || (dayPres.arrivalTime && dayPres.arrivalTime > '08:00');
    if (isLate && !presenceIncidents.some(p => p.type === 'retard')) {
      presenceIncidents.push({
        time: dayPres.arrivalTime || 'Matin',
        type: 'retard',
        label: "Retard à l'arrivée",
        description: `Arrivée constatée à ${dayPres.arrivalTime} (horaire officiel 08h00)${dayPres.correctionReason ? ` — Motif : ${dayPres.correctionReason}` : ''}`,
        isJustified: Boolean(dayPres.correctionReason && dayPres.correctionReasonStatus === 'approved'),
      });
    }

    // Sortie professionnelle / temporaire
    if (dayPres.sortieProStart && !presenceIncidents.some(p => p.type.includes('sortie'))) {
      presenceIncidents.push({
        time: dayPres.sortieProStart,
        type: 'sortie',
        label: "Sortie temporaire",
        description: `Sortie de ${dayPres.sortieProStart} à ${dayPres.sortieProEnd || 'en cours'}${dayPres.sortieProReason ? ` — Motif : ${dayPres.sortieProReason}` : ''}`,
        isJustified: true,
      });
    }

    // Départ anticipé
    if (dayPres.departureTime && dayPres.departureTime < '17:00' && dayPres.departureReason && !presenceIncidents.some(p => p.type.includes('depart'))) {
      presenceIncidents.push({
        time: dayPres.departureTime,
        type: 'depart_anticipe',
        label: "Départ anticipé",
        description: `Départ enregistré à ${dayPres.departureTime} (avant 17h00) — Motif : ${dayPres.departureReason}`,
        isJustified: dayPres.departureReasonStatus === 'approved',
      });
    }
  }

  // 7. BLOCAGES & IMPRÉVUS SUR LES TÂCHES OPÉRATIONNELLES
  const unforeseenEvents: DailyTimesheetData['unforeseenEvents'] = [];
  const managerComments: DailyTimesheetData['managerComments'] = [];

  // Remontée des blocages (= Imprévus) et des commentaires (= Points à signaler au manager)
  sortedParentTasks.forEach((t) => {
    // A. Blocages sur la tâche parente
    if (t.incidents && t.incidents.length > 0) {
      t.incidents.forEach((inc) => {
        unforeseenEvents.push({
          time: t.time || '10:30',
          subject: `🚨 [Blocage tâche] ${t.title} : ${inc.title || inc.description || 'Difficulté opérationnelle'}`,
          lostMinutes: 45,
          sourceTask: t.title,
          isFromBlockage: true,
          status: inc.resolved ? 'Résolu' : 'Bloqué',
        });
      });
    } else if (t.status === 'blocked') {
      unforeseenEvents.push({
        time: t.time || '10:30',
        subject: `🚨 [Blocage tâche] ${t.title} : Tâche bloquée`,
        lostMinutes: 45,
        sourceTask: t.title,
        isFromBlockage: true,
        status: 'Bloqué',
      });
    }

    // B. Commentaires sur la tâche parente -> Points à signaler au manager
    if (t.comments && t.comments.length > 0) {
      t.comments.forEach((c) => {
        managerComments.push({
          id: c.id,
          taskTitle: t.title,
          isSubtask: false,
          author: c.author,
          time: c.timestamp || 'Journée',
          text: c.text,
        });
      });
    }

    // C. Traitement récursif des sous-tâches : Blocages -> Imprévus, Commentaires -> Points au manager
    const traverseSubtasks = (subList: Subtask[], parentName: string) => {
      subList.forEach((sub) => {
        // Blocages sur la sous-tâche
        if (sub.incidents && sub.incidents.length > 0) {
          sub.incidents.forEach((inc) => {
            unforeseenEvents.push({
              time: sub.time || '14:15',
              subject: `🚨 [Blocage sous-tâche] ${sub.title} (sur "${parentName}") : ${inc.title || inc.description || 'Difficulté opérationnelle'}`,
              lostMinutes: 30,
              sourceTask: sub.title,
              isFromBlockage: true,
              status: inc.resolved ? 'Résolu' : 'Bloqué',
            });
          });
        } else if (sub.status === 'blocked' || sub.isBlocked || sub.blockerReason) {
          unforeseenEvents.push({
            time: sub.time || '14:15',
            subject: `🚨 [Blocage sous-tâche] ${sub.title} (sur "${parentName}") : ${sub.blockerReason || 'Difficulté opérationnelle signalée'}`,
            lostMinutes: 30,
            sourceTask: sub.title,
            isFromBlockage: true,
            status: 'Bloqué',
          });
        }

        // Commentaires sur la sous-tâche -> Points à signaler au manager
        if (sub.comments && sub.comments.length > 0) {
          sub.comments.forEach((c) => {
            managerComments.push({
              id: c.id,
              taskTitle: `${sub.title} (sur "${parentName}")`,
              isSubtask: true,
              author: c.author,
              time: c.timestamp || 'Journée',
              text: c.text,
            });
          });
        }

        // Récursion sur les sous-sous-tâches
        if (sub.subtasks && sub.subtasks.length > 0) {
          traverseSubtasks(sub.subtasks, sub.title);
        }
      });
    };

    if (t.subtasks && t.subtasks.length > 0) {
      traverseSubtasks(t.subtasks, t.title);
    }
  });

  const managerAlertPoint = managerComments.length > 0
    ? managerComments.map((c) => `[${c.taskTitle}] ${c.author}: ${c.text}`).join(' | ')
    : 'Aucun point particulier consigné par le collaborateur aujourd’hui.';

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

/**
 * Génère automatiquement la feuille de temps MENSUELLE
 */
export function generateMonthlyTimesheet(
  employee: Employee,
  monthStr: string, // YYYY-MM
  allTasks: Task[],
  presences: Presence[]
): MonthlyTimesheetData {
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
      hoursWorked = Math.max(0, (dh + dm / 60) - (ah + am / 60) - 1); // 1h pause déjeuner 13h-14h
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

  empMonthTasks.forEach((t) => {
    if (t.subtasks && t.subtasks.length > 0) {
      const subs = t.subtasks.filter((s) => isTaskAssignedToEmployee(s, employee) || isTaskAssignedToEmployee(t, employee));
      const effectiveSubs = subs.length > 0 ? subs : t.subtasks;
      totalTasksAssigned += effectiveSubs.length;
      totalTasksCompleted += effectiveSubs.filter((s) => s.completed || s.status === 'completed').length;
    } else {
      totalTasksAssigned += 1;
      if (t.status === 'completed' || (t as any).completed) {
        totalTasksCompleted += 1;
      }
    }
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
    completionRate,
    dailyBreakdown,
  };
}

/**
 * Génère automatiquement la feuille de temps ANNUELLE
 */
export function generateYearlyTimesheet(
  employee: Employee,
  year: number,
  allTasks: Task[],
  presences: Presence[]
): YearlyTimesheetData {
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

/**
 * Export Excel Haute Fidélité conforme avec pause 13h-14h et sous-tâches dynamiques
 */
export function exportDailyTimesheetToExcel(data: DailyTimesheetData) {
  const safeName = data.employee.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const safeDate = data.date.replace(/[^a-z0-9_-]/g, '_');
  const fileName = `feuille_de_temps_${safeName}_${safeDate}.xls`;

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Feuil1</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: Calibri, Arial, sans-serif; background-color: #ffffff; color: #1e293b; padding: 16px; }
        .company-header { font-family: Georgia, serif; font-size: 22pt; font-weight: bold; font-style: italic; color: #104c38; }
        .subtitle { font-family: Georgia, Calibri, sans-serif; font-size: 13pt; font-weight: bold; color: #92400e; border-bottom: 1.5px solid #92400e; padding-bottom: 4px; }
        .section-header { background-color: #0e3d2f; color: #ffffff; font-weight: bold; font-size: 11pt; padding: 6px 10px; border: 1px solid #0e3d2f; }
        .col-header { background-color: #1f514c; color: #ffffff; font-weight: bold; font-size: 10pt; padding: 6px 10px; border: 1px solid #143e3a; }
        td { font-size: 10pt; padding: 5px 8px; border: 1px solid #cbd5e1; }
        .blue-text { color: #1d4ed8; font-weight: bold; }
        .prio-p1 { background-color: #fee2e2; color: #dc2626; font-weight: bold; text-align: center; }
        .prio-p2 { color: #2563eb; font-weight: bold; text-align: center; }
        .prio-p3 { color: #2563eb; font-weight: bold; text-align: center; }
        .status-fait { background-color: #d1fae5; color: #065f46; font-weight: bold; text-align: center; border: 1px solid #a7f3d0; }
        .status-encours { background-color: #fef3c7; color: #92400e; font-weight: bold; text-align: center; border: 1px solid #fde68a; }
        .status-afaire { background-color: #f1f5f9; color: #475569; font-weight: bold; text-align: center; }
        .summary-row { background-color: #0e3d2f; color: #ffffff; font-weight: bold; }
        .tampon-row { background-color: #fef9c3; color: #854d0e; font-weight: bold; }
        .guide-title { color: #0e3d2f; font-weight: bold; font-size: 11pt; padding-top: 14px; }
        .guide-text { color: #334155; font-size: 9.5pt; line-height: 1.4; }
      </style>
    </head>
    <body>
      <!-- EN-TÊTE OFFICIEL CITRINE -->
      <table border="0" style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
        <tr>
          <td colspan="6" class="company-header" style="border: none; padding-bottom: 2px;">CITRINE</td>
        </tr>
        <tr>
          <td colspan="6" class="subtitle" style="border-top: none; border-left: none; border-right: none; margin-bottom: 8px;">
            PLAN DU JOUR — ${data.department.toUpperCase()}
          </td>
        </tr>
        <tr><td colspan="6" style="height: 6px; border: none;"></td></tr>
        <tr>
          <td style="border: none; width: 140px;"><strong>Date :</strong> ${data.date}</td>
          <td style="border: none; width: 120px;" class="blue-text">${data.location}</td>
          <td style="border: none; width: 80px;"><strong>Jour :</strong> ${data.dayName}</td>
          <td style="border: none;" colspan="2"></td>
          <td style="border: none; text-align: right;" class="blue-text">${data.date}</td>
        </tr>
        <tr><td colspan="6" style="height: 6px; border: none;"></td></tr>
      </table>

      <!-- 🚨 SIGNALEMENT DES INCIDENTS & ANOMALIES DE PRÉSENCE (RETARD, SORTIE, DÉPART ANTICIPÉ...) -->
      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 12px; border: 1.5px solid ${data.presenceIncidents && data.presenceIncidents.length > 0 ? '#ea580c' : '#86efac'};">
        <tr>
          <td colspan="6" style="background-color: ${data.presenceIncidents && data.presenceIncidents.length > 0 ? '#c2410c' : '#15803d'}; color: #ffffff; font-weight: bold; font-size: 10.5pt; padding: 6px 10px;">
            ${data.presenceIncidents && data.presenceIncidents.length > 0 ? '⚠️ SIGNALEMENT DES INCIDENTS DE PRÉSENCE & HORAIRES' : '✅ PONCTUALITÉ & HORAIRES DE PRÉSENCE'} (${data.presenceIncidents ? data.presenceIncidents.length : 0})
          </td>
        </tr>
        ${data.presenceIncidents && data.presenceIncidents.length > 0 ? `
          <tr style="background-color: #fdba74; color: #7c2d12; font-weight: bold;">
            <td style="width: 15%; padding: 5px;">Heure</td>
            <td style="width: 25%; padding: 5px;">Type</td>
            <td colspan="3" style="padding: 5px;">Détails & Motif constaté</td>
            <td style="width: 15%; text-align: center; padding: 5px;">Statut</td>
          </tr>
          ${data.presenceIncidents.map((inc) => `
            <tr style="background-color: #fff7ed; color: #7c2d12;">
              <td style="font-weight: bold; font-family: monospace;">${inc.time || 'Pointage'}</td>
              <td style="font-weight: bold; color: #c2410c;">${inc.label}</td>
              <td colspan="3">${inc.description}</td>
              <td style="text-align: center; font-weight: bold; ${inc.isJustified ? 'color: #065f46;' : 'color: #991b1b;'}">
                ${inc.isJustified ? '✓ Justifié' : '⚠️ Non régularisé'}
              </td>
            </tr>
          `).join('')}
        ` : `
          <tr style="background-color: #f0fdf4;">
            <td colspan="6" style="color: #166534; font-weight: bold; padding: 7px 10px;">
              ✓ Aucun incident de présence : ponctualité respectée (dès 08h00), pause 12h–13h conforme, aucune sortie irrégulière.
            </td>
          </tr>
        `}
      </table>

      <!-- 1. LES 3 PRIORITÉS DU JOUR -->
      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr>
          <td colspan="6" class="section-header">🎯 LES 3 PRIORITÉS DU JOUR — si je ne fais que ça, la journée est réussie</td>
        </tr>
        ${data.topPriorities.map((item, idx) => `
          <tr>
            <td style="width: 35px; text-align: center; font-weight: bold; color: #b45309;">${idx + 1}.</td>
            <td colspan="5" class="blue-text" style="text-decoration: underline;">${item.title}</td>
          </tr>
        `).join('')}
      </table>

      <!-- 2. TÂCHES DU JOUR -->
      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr>
          <td colspan="6" class="section-header">📋 TÂCHES DU JOUR</td>
        </tr>
        <tr>
          <td class="col-header" style="width: 34%;">Tâche</td>
          <td class="col-header" style="width: 16%;">Domaine</td>
          <td class="col-header" style="width: 10%; text-align: center;">Prio</td>
          <td class="col-header" style="width: 14%; text-align: center;">Estimé (min)</td>
          <td class="col-header" style="width: 12%; text-align: center;">Échéance</td>
          <td class="col-header" style="width: 14%; text-align: center;">Statut</td>
        </tr>
        ${data.tasks.map((t) => {
          const prioClass = t.priorityLabel === 'P1' ? 'prio-p1' : (t.priorityLabel === 'P2' ? 'prio-p2' : 'prio-p3');
          const statusClass = t.status === 'Fait' ? 'status-fait' : (t.status === 'En cours' ? 'status-encours' : 'status-afaire');
          return `
            <tr>
              <td class="blue-text">${t.title}</td>
              <td class="blue-text">${t.parentTaskTitle || t.domain}</td>
              <td class="${prioClass}">${t.priorityLabel}</td>
              <td style="text-align: right;">${t.estimatedMinutes}</td>
              <td style="text-align: center;">${t.dueDate}</td>
              <td class="${statusClass}">${t.status}</td>
            </tr>
          `;
        }).join('')}
        <tr class="summary-row">
          <td colspan="2" style="border: 1px solid #0e3d2f; padding: 6px 10px;">Total / réalisées / taux</td>
          <td style="border: 1px solid #0e3d2f; text-align: center;">${data.totalTasks}</td>
          <td style="border: 1px solid #0e3d2f; text-align: center;">${data.completedTasks}</td>
          <td style="border: 1px solid #0e3d2f; text-align: center;">${data.ratePercentage}%</td>
          <td style="border: 1px solid #0e3d2f; text-align: center;">${data.postponedCount} report.</td>
        </tr>
      </table>

      <!-- 3. PLAN HORAIRE -->
      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr>
          <td colspan="6" class="section-header">🕒 PLAN HORAIRE (08:00 – 17:00) — Pause déjeuner officielle 12h00 – 13h00</td>
        </tr>
        <tr>
          <td class="col-header" style="width: 25%;">Heure</td>
          <td class="col-header" colspan="5">Ce que je fais sur ce créneau</td>
        </tr>
        ${data.scheduleSlots.map((s) => {
          const isLunchBreak = s.isBreak || (s.timeRange.startsWith('12:00') && s.timeRange.includes('13:00'));
          return `
            <tr class="${isLunchBreak ? 'tampon-row' : ''}">
              <td style="font-weight: bold;">${s.timeRange}</td>
              <td colspan="5" class="${isLunchBreak ? '' : 'blue-text'}">${isLunchBreak ? '🍽️ Pause Déjeuner Officielle (12h00 – 13h00)' : s.activity}</td>
            </tr>
          `;
        }).join('')}
      </table>

      <!-- 4. IMPRÉVUS SURVENUS AUJOURD'HUI -->
      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr>
          <td colspan="6" class="section-header">⚡ IMPRÉVUS SURVENUS AUJOURD'HUI</td>
        </tr>
        <tr>
          <td class="col-header" style="width: 20%;">Heure</td>
          <td class="col-header" colspan="4">Quoi ? (qui / quel sujet)</td>
          <td class="col-header" style="width: 20%; text-align: center;">Temps perdu (min)</td>
        </tr>
        ${data.unforeseenEvents.length > 0 ? data.unforeseenEvents.map((u) => `
          <tr>
            <td>${u.time}</td>
            <td colspan="4" class="blue-text">${u.subject}</td>
            <td style="text-align: right;">${u.lostMinutes} min</td>
          </tr>
        `).join('') : `
          <tr>
            <td colspan="6" style="text-align: center; color: #64748b; font-style: italic; padding: 8px;">
              Aucun imprévu signalé aujourd'hui.
            </td>
          </tr>
        `}
      </table>

      <!-- 5. BILAN FIN DE JOURNÉE -->
      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr>
          <td colspan="6" class="section-header">☑️ BILAN FIN DE JOURNÉE (2 min)</td>
        </tr>
        <tr>
          <td style="width: 28%; font-weight: bold; vertical-align: top; background-color: #f8fafc;">
            À reporter à demain :
          </td>
          <td colspan="5" class="blue-text" style="vertical-align: top;">
            ${data.postponedTasks.length > 0 ? data.postponedTasks.map((t) => `<div>${t}</div>`).join('') : 'Toutes les tâches du jour ont été clôturées !'}
          </td>
        </tr>
        <tr>
          <td style="width: 28%; font-weight: bold; background-color: #f8fafc;">
            Point à signaler au manager :
          </td>
          <td colspan="5" class="blue-text">
            ${data.managerAlertPoint || 'Aucun point bloquant majeur à signaler.'}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
