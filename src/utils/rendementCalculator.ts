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
export function computeEmployeeRendement(
  employee: Employee,
  allTasks: Task[],
  assiduiteRate: number = 100
): EmployeeRendementMetrics {
  const assignedTasks = allTasks.filter((t) => isTaskAssignedToEmployee(t, employee));

  let totalTasks = assignedTasks.length;
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

  assignedTasks.forEach((t) => {
    const isCompleted = t.status === 'completed';
    if (isCompleted) completedTasks++;
    else if (t.status === 'in_progress' || t.status === 'en_cours') inProgressTasks++;
    else if (t.status === 'blocked') blockedTasks++;

    if (t.isMilestone) {
      milestonesCount++;
      if (isCompleted || (t.milestoneProgress ?? 0) >= 100) completedMilestones++;
    }

    // Heures
    // Heures de charge calculées exclusivement sur les sous-tâches (règle opérationnelle Citrine)
    if (t.subtasks && t.subtasks.length > 0) {
      totalSubtasks += t.subtasks.length;
      t.subtasks.forEach((s) => {
        if (s.completed || s.status === 'completed') completedSubtasks++;
        estimatedHoursTotal += Number(s.estimatedHours) || 1.5;
        actualHoursTotal += Number(s.actualHours) || 0;
      });
    } else {
      // Tâche élémentaire sans sous-tâche découpée
      estimatedHoursTotal += 1;
    }

    totalProgressSum += getTaskDynamicProgress(t);
  });

  // Taux de rendement dynamique moyen des tâches (0 - 100%)
  const taskRendementRate = totalTasks > 0 ? Math.round(totalProgressSum / totalTasks) : 0;

  // Score combiné RH (50% Assiduité & Respect des horaires + 50% Rendement opérationnel)
  const globalCombinedScore = totalTasks > 0
    ? Math.round(0.5 * assiduiteRate + 0.5 * taskRendementRate)
    : assiduiteRate;

  // Statut capacitaire (Surcharge > 10h/jour, soit > 50h sur une semaine de 5 jours)
  let capacityStatus: 'overloaded' | 'optimal' | 'available' = 'optimal';
  if (estimatedHoursTotal > 50) {
    capacityStatus = 'overloaded';
  } else if (estimatedHoursTotal < 30) {
    capacityStatus = 'available';
  }

  return {
    employee,
    assignedTasks,
    totalTasks,
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
  };
}
