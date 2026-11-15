import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  AppUser,
  Employee,
  ProjectMilestone,
  ProjectStatus,
  StrategicProject,
} from '../../types';
import { deriveProjectStatus } from '../../services/projectService';
import { ModalPortal } from '../common/ModalPortal';
import {
  createEmptyMilestone,
  ProjectFormHeader,
  ProjectMilestonesFormList,
} from './ProjectFormSections';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProject: StrategicProject | null;
  employees: Employee[];
  currentUser: AppUser | null;
  onSave: (project: StrategicProject) => Promise<void> | void;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  editingProject,
  employees,
  currentUser,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([createEmptyMilestone(0)]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingProject) {
      setName(editingProject.name || '');
      setDescription(editingProject.description || '');
      setStatus(editingProject.status || 'active');
      setMilestones(
        editingProject.milestones && editingProject.milestones.length > 0
          ? editingProject.milestones.map((m, idx) => ({ ...m, order: idx }))
          : [createEmptyMilestone(0)]
      );
    } else {
      setName('');
      setDescription('');
      setStatus('active');
      setMilestones([createEmptyMilestone(0)]);
    }
  }, [isOpen, editingProject]);

  if (!isOpen) return null;

  const activeEmployees = employees.filter((e) => {
    const st = e.employmentStatus || (typeof e.status === 'string' ? e.status : e.status ? 'en_poste' : 'parti');
    return st === 'en_poste' || st === 'en_mission' || st === ('true' as any);
  });

  const handleMilestoneChange = (index: number, patch: Partial<ProjectMilestone>) => {
    setMilestones((prev) => prev.map((m, idx) => (idx === index ? { ...m, ...patch } : m)));
  };

  const handleOwnerSelect = (index: number, ownerId: string) => {
    const emp = activeEmployees.find((e) => String(e.id) === String(ownerId));
    handleMilestoneChange(index, {
      ownerId: ownerId || undefined,
      ownerName: emp ? emp.name : '',
    });
  };

  const handleAddMilestoneRow = () => {
    setMilestones((prev) => [...prev, createEmptyMilestone(prev.length)]);
  };

  const handleRemoveMilestoneRow = (index: number) => {
    setMilestones((prev) =>
      prev.filter((_, idx) => idx !== index).map((m, idx) => ({ ...m, order: idx }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Veuillez saisir le nom du projet (ex: Hero).');
      return;
    }

    const cleanedMilestones: ProjectMilestone[] = milestones
      .filter((m) => m.title.trim().length > 0)
      .map((m, idx) => ({
        ...m,
        title: m.title.trim(),
        ownerName: m.ownerName?.trim() || undefined,
        ownerId: m.ownerId || undefined,
        targetDate: m.targetDate || undefined,
        order: idx,
        completedAt: m.status === 'done' ? m.completedAt || new Date().toISOString() : undefined,
      }));

    if (cleanedMilestones.length === 0) {
      setError('Ajoutez au moins un jalon pour suivre l’évolution du projet.');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const projectPayload: StrategicProject = {
        id: editingProject?.id || `proj-${Date.now()}`,
        docId: editingProject?.docId,
        name: trimmedName,
        description: description.trim() || undefined,
        status: deriveProjectStatus(cleanedMilestones, status),
        milestones: cleanedMilestones,
        createdBy: editingProject?.createdBy || currentUser?.name || currentUser?.email || 'Direction',
        createdAt: editingProject?.createdAt || now,
        updatedAt: now,
      };
      await onSave(projectPayload);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Impossible d'enregistrer le projet.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-stone-950/55 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
          <div className="shrink-0">
            <ProjectFormHeader editingProject={editingProject} onClose={onClose} />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-5">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Nom du projet *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Hero, Déploiement Partenaires..."
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2A7B76]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    État général
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2A7B76]"
                  >
                    <option value="active">En cours</option>
                    <option value="on_hold">En pause</option>
                    <option value="completed">Terminé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Objectif court (optionnel)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Lancement commercial, conformité réglementaire et paiements"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2A7B76]"
                />
              </div>

              <ProjectMilestonesFormList
                milestones={milestones}
                activeEmployees={activeEmployees}
                onAddRow={handleAddMilestoneRow}
                onRemoveRow={handleRemoveMilestoneRow}
                onMilestoneChange={handleMilestoneChange}
                onOwnerSelect={handleOwnerSelect}
              />
            </div>

            <div className="shrink-0 px-5 sm:px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-200/70 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{isSaving ? 'Enregistrement...' : editingProject ? 'Enregistrer les modifications' : 'Créer le projet'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
