import React, { useState } from 'react';
import {
  X,
  Flag,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Circle,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  User,
} from 'lucide-react';
import {
  Employee,
  MilestoneStatus,
  ProjectMilestone,
  StrategicProject,
} from '../../types';
import {
  computeProjectProgress,
  deriveProjectStatus,
  formatShortFrenchDate,
  MILESTONE_STATUS_META,
  PROJECT_STATUS_META,
  sortMilestones,
} from '../../services/projectService';

interface ProjectMilestonesModalProps {
  project: StrategicProject | null;
  onClose: () => void;
  canManage: boolean;
  employees: Employee[];
  onSaveProject: (updated: StrategicProject) => Promise<void> | void;
  onEditProject: (project: StrategicProject) => void;
  onDeleteProject: (projectId: string) => Promise<void> | void;
}

const StatusIcon: React.FC<{ status: MilestoneStatus; className?: string }> = ({ status, className = 'h-3.5 w-3.5' }) => {
  switch (status) {
    case 'done':
      return <CheckCircle2 className={`${className} text-emerald-600`} />;
    case 'in_progress':
      return <Clock className={`${className} text-[#2A7B76]`} />;
    case 'blocked':
      return <AlertOctagon className={`${className} text-rose-600`} />;
    default:
      return <Circle className={`${className} text-stone-400`} />;
  }
};

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/45 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#2A7B76] to-[#1d5854] text-white flex items-start justify-between gap-4">
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

        {/* Progress strip */}
        <div className="px-6 py-3 bg-stone-50 border-b border-stone-200/80">
          <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2A7B76] rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Milestones list */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {sortedMilestones.length === 0 ? (
            <p className="text-xs text-stone-500 text-center py-6">
              Aucun jalon défini pour ce projet.
            </p>
          ) : (
            <div className="divide-y divide-stone-200/80 border border-stone-200 rounded-2xl overflow-hidden">
              {sortedMilestones.map((ms, idx) => {
                const statusMeta = MILESTONE_STATUS_META[ms.status || 'todo'];
                return (
                  <div
                    key={ms.id}
                    className="p-4 bg-white hover:bg-stone-50/50 transition space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="text-[11px] font-mono tabular-nums font-bold text-stone-400 pt-0.5 shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <StatusIcon status={ms.status} />
                            <span
                              className={`text-sm font-semibold ${
                                ms.status === 'done'
                                  ? 'text-stone-500 line-through'
                                  : 'text-stone-900'
                              }`}
                            >
                              {ms.title}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                            <span className={`font-semibold ${statusMeta.textClass}`}>
                              {statusMeta.label}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                              <Calendar className="h-3 w-3 text-stone-400" />
                              {formatShortFrenchDate(ms.targetDate)}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                              <User className="h-3 w-3 text-stone-400" />
                              {ms.ownerName || 'Porteur non défini'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMilestone(ms.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                          title="Supprimer ce jalon"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {canManage && (
                      <div className="pl-7 flex items-center gap-1 flex-wrap">
                        {(['todo', 'in_progress', 'done', 'blocked'] as MilestoneStatus[]).map((st) => {
                          const active = ms.status === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleMilestoneStatusChange(ms.id, st)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                                active
                                  ? 'bg-[#2A7B76] text-white shadow-2xs'
                                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                              }`}
                            >
                              {MILESTONE_STATUS_META[st].label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Add Milestone (Admin / Responsable) */}
          {canManage && (
            <form
              onSubmit={handleAddMilestone}
              className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3"
            >
              <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-[#2A7B76]" />
                <span>Ajouter un jalon à {project.name}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Titre du jalon (ex: Intégrer paiements GPay)"
                  className="sm:col-span-2 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2A7B76]"
                />
                <input
                  type="date"
                  value={newTargetDate}
                  onChange={(e) => setNewTargetDate(e.target.value)}
                  className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-mono tabular-nums text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#2A7B76]"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={newOwnerId}
                    onChange={(e) => setNewOwnerId(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#2A7B76]"
                  >
                    <option value="">Porteur du jalon</option>
                    {activeEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as MilestoneStatus)}
                    className="px-2.5 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#2A7B76]"
                  >
                    <option value="todo">À faire</option>
                    <option value="in_progress">En cours</option>
                    <option value="done">Terminé</option>
                    <option value="blocked">Bloqué</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isAdding || !newTitle.trim()}
                  className="px-4 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {isAdding ? 'Ajout...' : 'Ajouter ce jalon'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
