import { Employee, Task, Subtask } from '../types';

export interface EmployeeRendementMetrics {
  employee: Employee;
  assignedTasks: Task[];
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  totalSubtasks: number;
  completedSubtasks: number;
  milestonesCount: number;
  completedMilestones: number;
  estimatedHoursTotal: number;
  actualHoursTotal: number;
  taskRendementRate: number;      // Taux d'achèvement dynamique réel (%)
  assiduiteRate: number;          // Taux d'assiduité / présence (%)
  globalCombinedScore: number;    // Score combiné RH (Assiduité 50% + Rendement 50%)
  capacityStatus: 'overloaded' | 'optimal' | 'available';
}

/**
 * Vérifie si une tâche ou sous-tâche est assignée à un collaborateur
 */
export function isTaskAssignedToEmployee(task: Task | Subtask, employee: Employee): boolean {
  if (task.employeeId && (task.employeeId === employee.id || String(task.employeeId) === String(employee.id))) {
    return true;
  }

  const assignedTo = (task.assignedTo || '').trim();
  if (!assignedTo) return false;

  const empName = (employee.name || '').trim().toLowerCase();
  const empEmail = (employee.email || '').trim().toLowerCase();

  const assignees = assignedTo.split(',').map((s) => s.trim().toLowerCase());

  // Assignations collectives
  if (assignees.some((a) => a === 'équipe' || a === 'toute l\'équipe' || a === 'tous')) {
    return true;
  }

  return assignees.some((a) => {
    if (!a) return false;
    if (a === empName || (empEmail && a === empEmail)) return true;
    if (empName.includes(a) || a.includes(empName)) return true;
    return false;
  });
}

/**
 * Calcule dynamiquement le taux de progression d'une tâche (0 - 100%)
 * en prenant en compte son statut, ses sous-tâches et son jalon stratégique.
 */
export function getTaskDynamicProgress(task: Task): number {
  if (task.status === 'completed') return 100;

  // 1. Si la tâche est explicitement "À faire" ou "Idée", son avancement ne peut pas être 100%
  if (task.status === 'todo' || task.status === 'idea') {
    if (task.subtasks && task.subtasks.length > 0) {
      const completedSub = task.subtasks.filter((s) => s.completed || s.status === 'completed').length;
      // Même avec des sous-tâches entamées, une tâche "À faire" ne dépasse pas 25%
      return Math.min(25, Math.round((completedSub / task.subtasks.length) * 25));
    }
    return 0;
  }

  // 2. Si la tâche est un jalon stratégique avec progression explicite
  if (task.isMilestone && typeof task.milestoneProgress === 'number') {
    return Math.max(0, Math.min(90, task.milestoneProgress));
  }

  // 3. Si la tâche possède des sous-tâches, progression proportionnelle plafonnée à 85% tant que non terminée
  if (task.subtasks && task.subtasks.length > 0) {
    const completedSub = task.subtasks.filter((s) => s.completed || s.status === 'completed').length;
    const ratio = completedSub / task.subtasks.length;
    // Si toutes les sous-tâches sont faites (100% des sous-tâches), la tâche attend d'être clôturée (max 85%)
    return Math.round(ratio * 85);
  }

  // 4. Sinon selon le statut de la tâche
  switch (task.status) {
    case 'pending_validation':
      return 80;
    case 'in_progress':
    case 'en_cours':
      return 50;
    case 'blocked':
      return 15;
    default:
      return 0;
  }
}

/**
 * Calcule le rendement complet d'un collaborateur à partir des tâches et présences
 */
export interface RendementPeriodFilter {
  startStr: string;
  endStr: string;
  period?: string;
}

export interface EmployeeRendementMetrics {
  employee: Employee;
  assignedTasks: Task[];
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  totalSubtasks: number;
  completedSubtasks: number;
  milestonesCount: number;
  completedMilestones: number;
  estimatedHoursTotal: number;
  actualHoursTotal: number;
  taskRendementRate: number;      // Taux d'achèvement dynamique réel (%)
  assiduiteRate: number;          // Taux d'assiduité / présence (%)
  globalCombinedScore: number;    // Score combiné RH (Assiduité 50% + Rendement 50%)
  capacityStatus: 'overloaded' | 'optimal' | 'available';
  hasActivity: boolean;           // Indique si le collaborateur a des sous-tâches en cours ou tâches terminées dans la période
  periodLabel?: string;
}

/**
 * Extrait la date d'achèvement (YYYY-MM-DD) d'une tâche ou sous-tâche
 */
function getItemCompletionDate(item: Task | Subtask, fallbackParentDate?: string): string | null {
  const isDone = item.status === 'completed' || (item as any).completed === true || (item.status as string) === 'fait';
  if (!isDone) return null;

  if (item.completedAt && typeof item.completedAt === 'string') {
    const d = item.completedAt.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  }
  const lastUpdated = (item as any).lastUpdatedTime || (item as any).updatedAt || (item as any).updated_at;
  if (lastUpdated && typeof lastUpdated === 'string') {
    const d = lastUpdated.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  }
  const itemCreatedAt = (item as any).createdAt;
  if (itemCreatedAt && typeof itemCreatedAt === 'string') {
    const d = itemCreatedAt.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  }
  if ((item as any).date && typeof (item as any).date === 'string') {
    const d = (item as any).date.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  }
  if (fallbackParentDate && /^\d{4}-\d{2}-\d{2}$/.test(fallbackParentDate)) {
    return fallbackParentDate;
  }
  return null;
}

/**
 * Calcule le rendement complet d'un collaborateur à partir des tâches et présences
 * Supporte le filtrage strict par période (aujourd'hui, hier, semaine, mois, 3 mois, personnalisé)
 */
export function computeEmployeeRendement(
  employee: Employee,
  allTasks: Task[],
  assiduiteRate: number = 100,
  periodFilter?: RendementPeriodFilter
): EmployeeRendementMetrics {
  const rawAssignedTasks = allTasks.filter((t) => isTaskAssignedToEmployee(t, employee));

  let assignedTasks = rawAssignedTasks;
  let totalWorkUnits = 0;
  let completedWorkUnits = 0;
  let hasActivity = false;

  let completedTasks = 0;
  let inProgressTasks = 0;
  let blockedTasks = 0;
  let totalSubtasks = 0;
  let completedSubtasks = 0;
  let milestonesCount = 0;
  let completedMilestones = 0;
  let estimatedHoursTotal = 0;
  let actualHoursTotal = 0;
  let totalProgressSum = 0;

  if (periodFilter && periodFilter.startStr && periodFilter.endStr) {
    const { startStr, endStr } = periodFilter;
    const isSingleDay = startStr === endStr;

    // Filtrer les tâches et sous-tâches pertinentes pour la plage de dates
    const relevantTasks: Task[] = [];

    rawAssignedTasks.forEach((t) => {
      const subs = t.subtasks || [];
      const empSubs = subs.filter((s) => isTaskAssignedToEmployee(s, employee) || isTaskAssignedToEmployee(t, employee));
      const effectiveSubs = empSubs.length > 0 ? empSubs : subs;

      if (effectiveSubs.length > 0) {
        // Filtrer les sous-tâches de la période
        const periodSubs: Subtask[] = [];

        effectiveSubs.forEach((sub) => {
          const compDate = getItemCompletionDate(sub, t.date);
          const isDone = Boolean(sub.completed || sub.status === 'completed' || (sub.status as string) === 'fait');
          const isInProgress = sub.status === 'in_progress' || sub.status === 'en_cours';
          const isBlocked = sub.status === 'blocked' || sub.isBlocked;

          if (isSingleDay) {
            // Jour unique (ex: Aujourd'hui ou Hier) :
            // Règle stricte demandée par l'utilisateur :
            // Soit la sous-tâche est en cours ce jour, soit elle a été terminée ce jour
            const isCompletedThisDay = isDone && (compDate === startStr || (!compDate && (t.date === startStr || (sub as any).date === startStr)));
            const isProgressThisDay = isInProgress && (!compDate || compDate >= startStr);

            if (isCompletedThisDay) {
              hasActivity = true;
              completedWorkUnits++;
              totalWorkUnits++;
              periodSubs.push(sub);
            } else if (isProgressThisDay) {
              hasActivity = true;
              totalWorkUnits++;
              periodSubs.push(sub);
            } else if (isBlocked && ((sub as any).date === startStr || t.date === startStr)) {
              hasActivity = true;
              totalWorkUnits++;
              periodSubs.push(sub);
            }
          } else {
            // Plage de dates (ex: semaine, mois, 3 mois, personnalisé) :
            const isCompletedInRange = isDone && compDate && compDate >= startStr && compDate <= endStr;
            const isProgressInRange = isInProgress;
            const isDueInRange = (sub.dueDate && sub.dueDate >= startStr && sub.dueDate <= endStr) || (t.date && t.date >= startStr && t.date <= endStr);

            if (isCompletedInRange) {
              hasActivity = true;
              completedWorkUnits++;
              totalWorkUnits++;
              periodSubs.push(sub);
            } else if (isProgressInRange) {
              hasActivity = true;
              totalWorkUnits++;
              periodSubs.push(sub);
            } else if (isDueInRange) {
              totalWorkUnits++;
              if (isDone) completedWorkUnits++;
              periodSubs.push(sub);
            }
          }
        });

        if (periodSubs.length > 0) {
          relevantTasks.push({
            ...t,
            subtasks: periodSubs,
          });
        }
      } else {
        // Tâche unitaire sans sous-tâche
        const compDate = getItemCompletionDate(t);
        const isDone = Boolean(t.status === 'completed' || (t as any).completed === true);
        const isInProgress = t.status === 'in_progress' || t.status === 'en_cours' || t.status === 'pending_validation';
        const isBlocked = t.status === 'blocked';

        if (isSingleDay) {
          const isCompletedThisDay = isDone && (compDate === startStr || (!compDate && t.date === startStr));
          const isProgressThisDay = isInProgress;

          if (isCompletedThisDay) {
            hasActivity = true;
            completedWorkUnits++;
            totalWorkUnits++;
            relevantTasks.push(t);
          } else if (isProgressThisDay) {
            hasActivity = true;
            totalWorkUnits++;
            relevantTasks.push(t);
          } else if (isBlocked && t.date === startStr) {
            hasActivity = true;
            totalWorkUnits++;
            relevantTasks.push(t);
          }
        } else {
          const isCompletedInRange = isDone && compDate && compDate >= startStr && compDate <= endStr;
          const isProgressInRange = isInProgress;
          const isDueInRange = (t.dueDate && t.dueDate >= startStr && t.dueDate <= endStr) || (t.date && t.date >= startStr && t.date <= endStr);

          if (isCompletedInRange) {
            hasActivity = true;
            completedWorkUnits++;
            totalWorkUnits++;
            relevantTasks.push(t);
          } else if (isProgressInRange || isDueInRange) {
            if (isProgressInRange) hasActivity = true;
            totalWorkUnits++;
            if (isDone) completedWorkUnits++;
            relevantTasks.push(t);
          }
        }
      }
    });

    assignedTasks = relevantTasks;

    // Calcul des compteurs
    assignedTasks.forEach((t) => {
      const isCompleted = t.status === 'completed' || (t as any).completed === true || (Boolean(t.subtasks && t.subtasks.length > 0 && t.subtasks.every(s => s.completed || s.status === 'completed')));
      if (isCompleted) completedTasks++;
      else if (t.status === 'in_progress' || t.status === 'en_cours' || t.status === 'pending_validation') inProgressTasks++;
      else if (t.status === 'blocked') blockedTasks++;

      if (t.isMilestone) {
        milestonesCount++;
        if (isCompleted || (t.milestoneProgress ?? 0) >= 100) completedMilestones++;
      }

      if (t.subtasks && t.subtasks.length > 0) {
        totalSubtasks += t.subtasks.length;
        t.subtasks.forEach((s) => {
          if (s.completed || s.status === 'completed') completedSubtasks++;
          estimatedHoursTotal += Number(s.estimatedHours) || 1.5;
          actualHoursTotal += Number(s.actualHours) || 0;
        });
      } else {
        estimatedHoursTotal += 1;
      }

      totalProgressSum += getTaskDynamicProgress(t);
    });

  } else {
    // Mode global (sans filtre de période)
    assignedTasks.forEach((t) => {
      const isCompleted = t.status === 'completed' || (t as any).completed === true || (Boolean(t.subtasks && t.subtasks.length > 0 && t.subtasks.every(s => s.completed || s.status === 'completed')));
      if (isCompleted) completedTasks++;
      else if (t.status === 'in_progress' || t.status === 'en_cours' || t.status === 'pending_validation') inProgressTasks++;
      else if (t.status === 'blocked') blockedTasks++;

      if (t.isMilestone) {
        milestonesCount++;
        if (isCompleted || (t.milestoneProgress ?? 0) >= 100) completedMilestones++;
      }

      if (t.subtasks && t.subtasks.length > 0) {
        totalSubtasks += t.subtasks.length;
        t.subtasks.forEach((s) => {
          if (s.completed || s.status === 'completed') completedSubtasks++;
          estimatedHoursTotal += Number(s.estimatedHours) || 1.5;
          actualHoursTotal += Number(s.actualHours) || 0;
        });
      } else {
        estimatedHoursTotal += 1;
      }

      totalProgressSum += getTaskDynamicProgress(t);
    });

    assignedTasks.forEach((t) => {
      if (t.subtasks && t.subtasks.length > 0) {
        totalWorkUnits += t.subtasks.length;
        t.subtasks.forEach((s) => {
          if (s.completed || s.status === 'completed') completedWorkUnits++;
        });
      } else {
        totalWorkUnits += 1;
        if (t.status === 'completed' || (t as any).completed === true) completedWorkUnits++;
      }
    });

    hasActivity = totalWorkUnits > 0 || assignedTasks.length > 0;
  }

  // Taux de rendement dynamique des sous-tâches (0 - 100%)
  // Si le collaborateur n'a rien fait ce jour (aucune sous-tâche en cours ni terminée), le taux est strictement 0%
  const taskRendementRate = !hasActivity || totalWorkUnits === 0 
    ? 0 
    : Math.round((completedWorkUnits / totalWorkUnits) * 100);

  // Score combiné RH
  const globalCombinedScore = hasActivity && totalWorkUnits > 0
    ? Math.round(0.5 * assiduiteRate + 0.5 * taskRendementRate)
    : Math.round(assiduiteRate * 0.5); // Si aucune activité de tâche, le score reflète l'inactivité

  let capacityStatus: 'overloaded' | 'optimal' | 'available' = 'optimal';
  if (estimatedHoursTotal > 50) {
    capacityStatus = 'overloaded';
  } else if (estimatedHoursTotal < 30) {
    capacityStatus = 'available';
  }

  return {
    employee,
    assignedTasks,
    totalTasks: assignedTasks.length,
    completedTasks,
    inProgressTasks,
    blockedTasks,
    totalSubtasks,
    completedSubtasks,
    milestonesCount,
    completedMilestones,
    estimatedHoursTotal,
    actualHoursTotal,
    taskRendementRate,
    assiduiteRate,
    globalCombinedScore,
    capacityStatus,
    hasActivity,
  };
}
