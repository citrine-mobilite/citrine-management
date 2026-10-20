import { Employee, Task, Presence, AttendanceIncident, TaskProject } from '../types';
import { isTaskAssignedToEmployee } from '../utils/rendementCalculator';
import { exportToExcel } from './excelExportService';

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
  unforeseenEvents: {
    time: string;
    subject: string;
    lostMinutes: number;
  }[];
  postponedTasks: string[];
  managerAlertPoint: string;
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
    return t.date === date || (t.dueDate && t.dueDate === date) || t.status === 'in_progress' || t.status === 'todo';
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
    status: t.status === 'completed' ? 'Fait' : 'En cours',
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
      parentTask.subtasks.forEach((sub) => {
        let subStatus: 'Fait' | 'En cours' | 'À faire' | 'Bloqué' = 'À faire';
        if (sub.completed || sub.status === 'completed') subStatus = 'Fait';
        else if (sub.status === 'in_progress' || sub.status === 'en_cours') subStatus = 'En cours';
        else if (sub.status === 'blocked') subStatus = 'Bloqué';

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
      // Si la tâche n'a pas encore de sous-tâches, la tâche parente est l'action directe
      let statusFormatted: 'Fait' | 'En cours' | 'À faire' | 'Bloqué' = 'À faire';
      if (parentTask.status === 'completed') statusFormatted = 'Fait';
      else if (parentTask.status === 'in_progress' || parentTask.status === 'en_cours') statusFormatted = 'En cours';
      else if (parentTask.status === 'blocked') statusFormatted = 'Bloqué';

      subtaskItems.push({
        id: parentTask.id,
        title: parentTask.title,
        parentTaskTitle: parentTask.title,
        domain,
        priorityLabel: prioLabel,
        estimatedMinutes: parentTask.priority === 'urgent' ? 240 : (parentTask.priority === 'high' ? 180 : 120),
        dueDate: parentTask.dueDate || parentTask.date || date,
        status: statusFormatted,
        isMilestone: parentTask.isMilestone,
      });
    }
  });

  const totalTasks = subtaskItems.length;
  const completedTasks = subtaskItems.filter((t) => t.status === 'Fait').length;
  const ratePercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const postponedTasks = subtaskItems.filter((t) => t.status !== 'Fait').map((t) => t.title);
  const postponedCount = postponedTasks.length;

  // 4. CALCUL DE CAPACITÉ JOURNALIÈRE (8h nettes = 480 min hors pause 13h-14h)
  const workMinutesNet = 480; // 8 heures de travail effectif
  const plannedMinutes = subtaskItems.reduce((sum, s) => sum + s.estimatedMinutes, 0);
  const activeMilestone = sortedParentTasks.find((t) => t.isMilestone && t.status !== 'completed');
  const hasMilestone = Boolean(activeMilestone);

  // Si jalon stratégique présent : on réserve 50% de la journée (4h) pour le jalon -> 3 à 4 sous-tâches max
  // Si sans jalon : capacité standard de 5 à 6 sous-tâches par jour
  const maxRecommendedSubtasks = hasMilestone ? 4 : 6;

  let capacityStatus: 'optimal' | 'overloaded' | 'available' = 'optimal';
  let capacityAdvice = '';

  if (plannedMinutes > 510) {
    capacityStatus = 'overloaded';
    capacityAdvice = `⚠️ Surcharge détectée : ${Math.round(plannedMinutes / 60)}h planifiées pour 8h disponibles. Risque d'inachèvement : reportez les sous-tâches non prioritaires.`;
  } else if (plannedMinutes >= 360) {
    capacityStatus = 'optimal';
    capacityAdvice = `✅ Charge équilibrée et réaliste : ${Math.round(plannedMinutes / 60)}h estimées sur 8h nettes (Pause 13h-14h respectée).`;
  } else {
    capacityStatus = 'available';
    capacityAdvice = `💡 Capacité disponible : ${Math.round(plannedMinutes / 60)}h planifiées. Vous pouvez traiter encore ${Math.max(1, maxRecommendedSubtasks - totalTasks)} sous-tâche(s).`;
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
      activity: s1 ? `${s1.title} (${s1.parentTaskTitle})` : 'Cadrage de la journée, lecture des priorités & mise en route',
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
      activity: s3 ? `${s3.title} (${s3.parentTaskTitle})` : 'Point de synchronisation, consolidation & tests intermédiaires',
      resolutionNote: s3?.status === 'Fait' ? 'Résolu avant la pause ✓' : 'Finalisation de la tranche matinale',
      statusBadge: s3?.status || 'En cours',
    },
    {
      timeRange: '13:00 – 14:00',
      activity: '🍽️ PAUSE DÉJEUNER & REPOS (Pause obligatoire)',
      resolutionNote: 'Coupure obligatoire — aucune tâche planifiée sur ce créneau',
      isBreak: true,
      statusBadge: 'Pause',
    },
    {
      timeRange: '14:00 – 16:00',
      activity: s4 ? `${s4.title} (${s4.parentTaskTitle})` : (s2 ? `Reprise et finalisation : ${s2.title}` : 'Exécution des sous-tâches de l’après-midi'),
      resolutionNote: s4?.status === 'Fait' ? 'Sous-tâche achevée ✓' : 'Déploiement et revues de code/dossier',
      statusBadge: s4?.status || 'En cours',
    },
    {
      timeRange: '16:00 – 17:30',
      activity: s5 ? `${s5.title} (${s5.parentTaskTitle})` : 'Tampon pour imprévus, bilan fin de journée & compte-rendu manager',
      resolutionNote: 'Revue des critères d’acceptation et reporting au manager',
      isBuffer: true,
      statusBadge: 'Bilan',
    },
  ];

  // 6. IMPRÉVUS DU JOUR
  const empIncidents = incidents.filter((i) => i.employeeId === employee.id && i.date === date);
  const unforeseenEvents = empIncidents.map((i) => ({
    time: i.timeString || (i.createdAt ? new Date(i.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '14:00'),
    subject: i.reason || i.description || 'Imprévu opérationnel',
    lostMinutes: 30,
  }));

  const managerAlertPoint = empIncidents.length > 0 
    ? `Point de vigilance : ${empIncidents.map((i) => i.reason || i.description).join(' ; ')}`
    : 'Aucun blocage majeur rencontré aujourd’hui.';

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
    unforeseenEvents,
    postponedTasks,
    managerAlertPoint,
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

    const dayTasks = allTasks.filter((t) => isTaskAssignedToEmployee(t, employee) && (t.date === dayDateStr || t.dueDate === dayDateStr));
    const tasksDone = dayTasks.filter((t) => t.status === 'completed').length;

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
    return taskMonth === monthStr;
  });

  const totalTasksAssigned = empMonthTasks.length;
  const totalTasksCompleted = empMonthTasks.filter((t) => t.status === 'completed').length;
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

    const monthTasks = allTasks.filter((t) => isTaskAssignedToEmployee(t, employee) && (t.date.startsWith(monthStr) || (t.dueDate && t.dueDate.startsWith(monthStr))));
    const tasksCompleted = monthTasks.filter((t) => t.status === 'completed').length;
    const rendementRate = monthTasks.length > 0 ? Math.round((tasksCompleted / monthTasks.length) * 100) : 0;

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
  const totalTasksCompleted = yearTasks.filter((t) => t.status === 'completed').length;
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
  const fileName = `feuille_de_temps_${data.employee.name.replace(/\s+/g, '_')}_${data.date}.xls`;

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Calibri, Arial, sans-serif; }
        .company-header { font-size: 20px; font-weight: bold; color: #164e4b; font-style: italic; }
        .title-banner { background-color: #2A7B76; color: #ffffff; font-weight: bold; font-size: 14px; padding: 6px; }
        .section-header { background-color: #164e4b; color: #ffffff; font-weight: bold; font-size: 11px; padding: 5px; }
        .sub-header { background-color: #2A7B76; color: #ffffff; font-weight: bold; font-size: 10px; }
        th { background-color: #2A7B76; color: #ffffff; font-weight: bold; font-size: 11px; padding: 5px; text-align: left; }
        td { font-size: 11px; padding: 4px 6px; }
        .prio-p1 { color: #dc2626; font-weight: bold; }
        .prio-p2 { color: #2563eb; font-weight: bold; }
        .prio-p3 { color: #d97706; font-weight: bold; }
        .status-fait { background-color: #d1fae5; color: #065f46; font-weight: bold; text-align: center; }
        .status-encours { background-color: #fef3c7; color: #92400e; font-weight: bold; text-align: center; }
        .break-row { background-color: #e0f2fe; font-weight: bold; color: #0369a1; }
        .buffer-row { background-color: #fef9c3; font-weight: bold; color: #854d0e; }
        .summary-bar { background-color: #164e4b; color: #ffffff; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="company-header">CITRINE</div>
      <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">PLAN DU JOUR — ${data.department.toUpperCase()}</div>
      
      <table border="0" style="margin-bottom: 12px; font-size: 11px;">
        <tr>
          <td><strong>Collaborateur :</strong> ${data.employee.name}</td>
          <td><strong>Date :</strong> ${data.date}</td>
          <td><strong>Ville :</strong> ${data.location}</td>
          <td><strong>Jour :</strong> ${data.dayName}</td>
        </tr>
      </table>

      <!-- 1. LES 3 PRIORITÉS DU JOUR (JOB DESCRIPTION) -->
      <table border="1" style="border-collapse: collapse; width: 100%; margin-bottom: 12px;">
        <tr class="section-header">
          <td colspan="3">🎯 LES 3 PRIORITÉS DU JOUR (Missions clés &amp; Job Description)</td>
        </tr>
        ${data.topPriorities.map((p, i) => `
          <tr>
            <td style="width: 30px; text-align: center; font-weight: bold;">${i + 1}.</td>
            <td style="color: #1d4ed8; font-weight: bold;">${p.title} ${p.isMilestone ? '🏆 [Jalon Clé]' : ''}</td>
            <td style="width: 100px; text-align: center;">${p.status}</td>
          </tr>
        `).join('')}
      </table>

      <!-- 2. TÂCHES DU JOUR (SOUS-TÂCHES OPÉRATIONNELLES) -->
      <table border="1" style="border-collapse: collapse; width: 100%; margin-bottom: 8px;">
        <tr class="section-header">
          <td colspan="6">📋 TÂCHES DU JOUR (Sous-tâches concrètes traitées)</td>
        </tr>
        <tr>
          <th>Sous-Tâche</th>
          <th>Tâche Parente (Job Description)</th>
          <th>Prio</th>
          <th>Estimé (min)</th>
          <th>Échéance</th>
          <th>Statut</th>
        </tr>
        ${data.tasks.map((t) => `
          <tr>
            <td style="color: #1d4ed8;">${t.title}</td>
            <td>${t.parentTaskTitle}</td>
            <td style="text-align: center;" class="prio-${t.priorityLabel.toLowerCase()}">${t.priorityLabel}</td>
            <td style="text-align: right;">${t.estimatedMinutes}</td>
            <td style="text-align: center;">${t.dueDate}</td>
            <td class="${t.status === 'Fait' ? 'status-fait' : 'status-encours'}">${t.status}</td>
          </tr>
        `).join('')}
        <tr class="summary-bar">
          <td colspan="2">Total / réalisées / taux</td>
          <td style="text-align: center;">${data.totalTasks}</td>
          <td style="text-align: right;">${data.completedTasks}</td>
          <td style="text-align: center;">${data.ratePercentage}%</td>
          <td style="text-align: center;">${data.postponedCount} report.</td>
        </tr>
      </table>

      <!-- 3. PLAN HORAIRE -->
      <table border="1" style="border-collapse: collapse; width: 100%; margin-bottom: 12px;">
        <tr class="section-header">
          <td colspan="3">🕐 PLAN HORAIRE — Résolution des sous-tâches (Pause 13h-14h obligatoire)</td>
        </tr>
        <tr>
          <th style="width: 130px;">Heure</th>
          <th>Activité / Sous-tâche traitée</th>
          <th>Résolution &amp; Détails</th>
        </tr>
        ${data.scheduleSlots.map((s) => `
          <tr class="${s.isBreak ? 'break-row' : (s.isBuffer ? 'buffer-row' : '')}">
            <td style="font-weight: bold;">${s.timeRange}</td>
            <td style="${s.isBreak ? '' : 'color: #1d4ed8; font-weight: bold;'}">${s.activity}</td>
            <td>${s.resolutionNote || ''}</td>
          </tr>
        `).join('')}
      </table>

      <!-- 4. IMPRÉVUS SURVENUS AUJOURD'HUI -->
      <table border="1" style="border-collapse: collapse; width: 100%; margin-bottom: 12px;">
        <tr class="section-header">
          <td colspan="3">⚡ IMPRÉVUS SURVENUS AUJOURD'HUI</td>
        </tr>
        <tr>
          <th style="width: 140px;">Heure</th>
          <th>Quoi ? (qui / quel sujet)</th>
          <th style="width: 120px;">Temps perdu (min)</th>
        </tr>
        ${data.unforeseenEvents.length > 0 ? data.unforeseenEvents.map((u) => `
          <tr>
            <td>${u.time}</td>
            <td>${u.subject}</td>
            <td style="text-align: right;">${u.lostMinutes} min</td>
          </tr>
        `).join('') : `
          <tr>
            <td colspan="3" style="text-align: center; color: #6b7280; font-style: italic;">Aucun imprévu signalé aujourd'hui.</td>
          </tr>
        `}
      </table>

      <!-- 5. BILAN FIN DE JOURNÉE -->
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <tr class="section-header">
          <td colspan="2">☑️ BILAN FIN DE JOURNÉE &amp; CAPACITÉ</td>
        </tr>
        <tr>
          <td style="width: 160px; font-weight: bold;">Capacité &amp; Charge :</td>
          <td>${data.capacity.capacityAdvice}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; vertical-align: top;">À reporter à demain :</td>
          <td style="color: #1d4ed8;">
            ${data.postponedTasks.length > 0 ? data.postponedTasks.map(t => `<div>• ${t}</div>`).join('') : 'Toutes les sous-tâches du jour ont été clôturées !'}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Point à signaler au manager :</td>
          <td>${data.managerAlertPoint}</td>
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
