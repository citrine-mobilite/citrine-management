import React, { useState } from 'react';
import { X, Flag, Pencil, Trash2 } from 'lucide-react';
import { Employee, MilestoneStatus, ProjectMilestone, StrategicProject } from '../../types';
import {
  computeProjectProgress,
  deriveProjectStatus,
  PROJECT_STATUS_META,
  sortMilestones,
} from '../../services/projectService';
import { ProjectMilestoneRow, ProjectQuickAddMilestoneForm } from './ProjectMilestoneItems';
import { ModalPortal } from '../common/ModalPortal';

interface ProjectMilestonesModalProps {
  project: StrategicProject | null;
  onClose: () => void;
  canManage: boolean;
  employees: Employee[];
  onSaveProject: (updated: StrategicProject) => Promise<void> | void;
  onEditProject: (project: StrategicProject) => void;
  onDeleteProject: (projectId: string) => Promise<void> | void;
}

export const ProjectMilestonesModal: React.FC<ProjectMilestonesModalProps> = ({
  project,
  onClose,
  canManage,
  employees,
  onSaveProject,
  onEditProject,
  onDeleteProject,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newOwnerId, setNewOwnerId] = useState('');
  const [newStatus, setNewStatus] = useState<MilestoneStatus>('todo');
  const [isAdding, setIsAdding] = useState(false);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);

  if (!project) return null;

  const sortedMilestones = sortMilestones(project.milestones || []);
  const { doneCount, totalCount, percent } = computeProjectProgress(project);
  const projectStatusMeta = PROJECT_STATUS_META[project.status || 'active'];

  const activeEmployees = employees.filter((e) => {
    const st = e.employmentStatus || (typeof e.status === 'string' ? e.status : e.status ? 'en_poste' : 'parti');
    return st === 'en_poste' || st === 'en_mission' || st === ('true' as any);
  });

  const handleMilestoneStatusChange = async (milestoneId: string, nextStatus: MilestoneStatus) => {
    if (!canManage) return;
    const updatedMilestones = sortedMilestones.map((m) =>
      m.id === milestoneId
        ? {
            ...m,
            status: nextStatus,
            completedAt: nextStatus === 'done' ? m.completedAt || new Date().toISOString() : undefined,
          }
        : m
    );
    await onSaveProject({
      ...project,
      milestones: updatedMilestones,
      status: deriveProjectStatus(updatedMilestones, project.status),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !newTitle.trim()) return;
    setIsAdding(true);
    try {
      const owner = activeEmployees.find((emp) => String(emp.id) === String(newOwnerId));
      const newMilestone: ProjectMilestone = {
        id: `ms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: newTitle.trim(),
        status: newStatus,
        targetDate: newTargetDate || undefined,
        ownerId: newOwnerId || undefined,
        ownerName: owner ? owner.name : undefined,
        order: sortedMilestones.length,
        completedAt: newStatus === 'done' ? new Date().toISOString() : undefined,
      };
      const updatedMilestones = [...sortedMilestones, newMilestone];
      await onSaveProject({
        ...project,
        milestones: updatedMilestones,
        status: deriveProjectStatus(updatedMilestones, project.status),
        updatedAt: new Date().toISOString(),
      });
      setNewTitle('');
      setNewTargetDate('');
      setNewOwnerId('');
      setNewStatus('todo');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!canManage) return;
    const updatedMilestones = sortedMilestones
      .filter((m) => m.id !== milestoneId)
      .map((m, idx) => ({ ...m, order: idx }));
    await onSaveProject({
      ...project,
      milestones: updatedMilestones,
      status: deriveProjectStatus(updatedMilestones, project.status),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-stone-950/55 backdrop-blur-xs">
        <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-[#2A7B76] to-[#1d5854] text-white flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-[#F3D079] shrink-0" />
              <h3 className="font-serif font-bold text-lg truncate">{project.name}</h3>
            </div>
            {project.description && (
              <p className="text-xs text-emerald-100/90 line-clamp-2">{project.description}</p>
            )}
            <div className="text-[11px] text-emerald-100 font-mono tabular-nums flex items-center gap-2 pt-0.5">
              <span>{projectStatusMeta.label}</span>
              <span aria-hidden="true">·</span>
              <span>
                {percent}% ({doneCount}/{totalCount} jalons terminés)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => onEditProject(project)}
                  className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Modifier</span>
                </button>
                {!confirmDeleteProject ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteProject(true)}
                    className="p-1.5 hover:bg-rose-500/30 text-white/85 hover:text-white rounded-xl transition cursor-pointer"
                    title="Supprimer le projet"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      await onDeleteProject(project.id);
                      onClose();
                    }}
                    className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
                  >
                    Confirmer suppression
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/15 text-white/85 hover:text-white transition cursor-pointer"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-3 bg-stone-50 border-b border-stone-200/80">
          <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2A7B76] rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {sortedMilestones.length === 0 ? (
            <p className="text-xs text-stone-500 text-center py-6">
              Aucun jalon défini pour ce projet.
            </p>
          ) : (
            <div className="divide-y divide-stone-200/80 border border-stone-200 rounded-2xl overflow-hidden">
              {sortedMilestones.map((ms, idx) => (
                <ProjectMilestoneRow
                  key={ms.id}
                  milestone={ms}
                  index={idx}
                  canManage={canManage}
                  onStatusChange={handleMilestoneStatusChange}
                  onDelete={handleDeleteMilestone}
                />
              ))}
            </div>
          )}

          {canManage && (
            <ProjectQuickAddMilestoneForm
              projectName={project.name}
              activeEmployees={activeEmployees}
              newTitle={newTitle}
              setNewTitle={setNewTitle}
              newTargetDate={newTargetDate}
              setNewTargetDate={setNewTargetDate}
              newOwnerId={newOwnerId}
              setNewOwnerId={setNewOwnerId}
              newStatus={newStatus}
              setNewStatus={setNewStatus}
              isAdding={isAdding}
              onSubmit={handleAddMilestone}
            />
          )}
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
