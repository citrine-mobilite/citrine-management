import { AppUser, MilestoneStatus, ProjectMilestone, ProjectStatus, StrategicProject } from '../types';
import { COLLECTIONS, deleteDocument, saveDocument } from './dataService';

export function canManageStrategicProjects(user?: AppUser | null): boolean {
  if (!user) return false;
  return user.role === 'administrateur' || user.role === 'responsable';
}

export function computeProjectProgress(project: StrategicProject): {
  doneCount: number;
  totalCount: number;
  percent: number;
} {
  const milestones = Array.isArray(project.milestones) ? project.milestones : [];
  const totalCount = milestones.length;
  if (totalCount === 0) {
    return { doneCount: 0, totalCount: 0, percent: project.status === 'completed' ? 100 : 0 };
  }
  const doneCount = milestones.filter((m) => m.status === 'done').length;
  const percent = Math.round((doneCount / totalCount) * 100);
  return { doneCount, totalCount, percent };
}

export function sortMilestones(milestones: ProjectMilestone[]): ProjectMilestone[] {
  return [...(milestones || [])].sort((a, b) => {
    const orderDiff = (a.order ?? 0) - (b.order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    if (a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate);
    if (a.targetDate) return -1;
    if (b.targetDate) return 1;
    return 0;
  });
}

export function getNextMilestone(project: StrategicProject): ProjectMilestone | null {
  const sorted = sortMilestones(project.milestones || []);
  const pending = sorted.filter((m) => m.status !== 'done');
  if (pending.length === 0) return null;

  const inProgress = pending.find((m) => m.status === 'in_progress');
  if (inProgress) return inProgress;

  const blocked = pending.find((m) => m.status === 'blocked');
  if (blocked) return blocked;

  return pending[0] || null;
}

export function deriveProjectStatus(
  milestones: ProjectMilestone[],
  explicitStatus?: ProjectStatus
): ProjectStatus {
  if (milestones.length > 0 && milestones.every((m) => m.status === 'done')) {
    return 'completed';
  }
  if (explicitStatus === 'on_hold') {
    return 'on_hold';
  }
  return 'active';
}

export const MILESTONE_STATUS_META: Record<
  MilestoneStatus,
  { label: string; textClass: string; surfaceClass: string; barClass: string }
> = {
  todo: {
    label: 'À faire',
    textClass: 'text-stone-600',
    surfaceClass: 'bg-stone-100 text-stone-700 border-stone-200',
    barClass: 'bg-stone-400',
  },
  in_progress: {
    label: 'En cours',
    textClass: 'text-[#2A7B76]',
    surfaceClass: 'bg-teal-50 text-[#20635F] border-teal-200',
    barClass: 'bg-[#2A7B76]',
  },
  done: {
    label: 'Terminé',
    textClass: 'text-emerald-700',
    surfaceClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    barClass: 'bg-emerald-600',
  },
  blocked: {
    label: 'Bloqué',
    textClass: 'text-rose-700',
    surfaceClass: 'bg-rose-50 text-rose-800 border-rose-200',
    barClass: 'bg-rose-600',
  },
};

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: string; textClass: string }
> = {
  active: { label: 'En cours', textClass: 'text-[#2A7B76]' },
  on_hold: { label: 'En pause', textClass: 'text-amber-700' },
  completed: { label: 'Terminé', textClass: 'text-emerald-700' },
};

export function formatShortFrenchDate(dateStr?: string): string {
  if (!dateStr) return 'Sans échéance';
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export async function saveStrategicProject(project: StrategicProject): Promise<StrategicProject> {
  const now = new Date().toISOString();
  const normalized: StrategicProject = {
    ...project,
    milestones: sortMilestones(project.milestones || []).map((m, idx) => ({
      ...m,
      order: idx,
    })),
    status: deriveProjectStatus(project.milestones || [], project.status),
    updatedAt: now,
    createdAt: project.createdAt || now,
  };
  const saved = await saveDocument(COLLECTIONS.STRATEGIC_PROJECTS, normalized);
  return (saved as StrategicProject) || normalized;
}

export async function deleteStrategicProject(projectId: string): Promise<void> {
  await deleteDocument(COLLECTIONS.STRATEGIC_PROJECTS, projectId);
}
