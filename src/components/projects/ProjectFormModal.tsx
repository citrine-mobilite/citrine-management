import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Flag, Calendar, User, CheckCircle2 } from 'lucide-react';
import {
  AppUser,
  Employee,
  MilestoneStatus,
  ProjectMilestone,
  ProjectStatus,
  StrategicProject,
} from '../../types';
import { deriveProjectStatus } from '../../services/projectService';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProject: StrategicProject | null;
  employees: Employee[];
  currentUser: AppUser | null;
  onSave: (project: StrategicProject) => Promise<void> | void;
}

const createEmptyMilestone = (order: number): ProjectMilestone => ({
  id: `ms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  title: '',
  status: 'todo',
  targetDate: '',
  ownerId: '',
  ownerName: '',
  order,
});

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

  const handleMilestoneChange = (
    index: number,
    patch: Partial<ProjectMilestone>
  ) => {
    setMilestones((prev) =>
      prev.map((m, idx) => (idx === index ? { ...m, ...patch } : m))
    );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/45 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#2A7B76] to-[#1e5c58] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Flag className="h-5 w-5 text-[#F3D079] shrink-0" />
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-base truncate">
                {editingProject ? `Modifier le projet · ${editingProject.name}` : 'Nouveau Projet & Jalons'}
              </h3>
              <p className="text-[11px] text-emerald-100 truncate">
                Feuille de route stratégique visible dès l’accueil (indépendante des tâches)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/15 text-white/85 hover:text-white transition cursor-pointer shrink-0"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
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

          {/* Milestones list */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-stone-900">
                  Jalons clés du projet ({milestones.length})
                </h4>
                <p className="text-[11px] text-stone-500">
                  Le prochain jalon non terminé s’affichera automatiquement sur la page d’accueil.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddMilestoneRow}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5 text-[#2A7B76]" />
                <span>Ajouter un jalon</span>
              </button>
            </div>

            <div className="divide-y divide-stone-200/80 border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/40">
              {milestones.map((ms, idx) => (
                <div key={ms.id} className="p-3.5 space-y-2.5 bg-white">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono tabular-nums font-bold text-stone-400 w-5 shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <input
                      type="text"
                      value={ms.title}
                      onChange={(e) => handleMilestoneChange(idx, { title: e.target.value })}
                      placeholder="Ex: Préparer les documents de l'ANTIC, Intégrer GPay..."
                      className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2A7B76]"
                    />
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestoneRow(idx)}
                        className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer shrink-0"
                        title="Retirer ce jalon"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-7">
                    <div>
                      <label className="text-[10px] font-bold text-stone-500 flex items-center gap-1 mb-1">
                        <span>Statut</span>
                      </label>
                      <select
                        value={ms.status}
                        onChange={(e) => handleMilestoneChange(idx, { status: e.target.value as MilestoneStatus })}
                        className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#2A7B76]"
                      >
                        <option value="todo">À faire</option>
                        <option value="in_progress">En cours</option>
                        <option value="done">Terminé</option>
                        <option value="blocked">Bloqué</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-stone-500 flex items-center gap-1 mb-1">
                        <Calendar className="h-3 w-3 text-[#2A7B76]" />
                        <span>Date cible</span>
                      </label>
                      <input
                        type="date"
                        value={ms.targetDate || ''}
                        onChange={(e) => handleMilestoneChange(idx, { targetDate: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono tabular-nums text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#2A7B76]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-stone-500 flex items-center gap-1 mb-1">
                        <User className="h-3 w-3 text-[#2A7B76]" />
                        <span>Porteur du jalon</span>
                      </label>
                      <select
                        value={ms.ownerId || ''}
                        onChange={(e) => handleOwnerSelect(idx, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#2A7B76]"
                      >
                        <option value="">Non assigné</option>
                        {activeEmployees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Enregistrement...' : editingProject ? 'Enregistrer les modifications' : 'Créer le projet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
