import React from 'react';
import { X, Plus, Trash2, Flag, Calendar, User } from 'lucide-react';
import {
  Employee,
  MilestoneStatus,
  ProjectMilestone,
  StrategicProject,
} from '../../types';

export const createEmptyMilestone = (order: number): ProjectMilestone => ({
  id: `ms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  title: '',
  status: 'todo',
  targetDate: '',
  ownerId: '',
  ownerName: '',
  order,
});

interface ProjectFormHeaderProps {
  editingProject: StrategicProject | null;
  onClose: () => void;
}

export const ProjectFormHeader: React.FC<ProjectFormHeaderProps> = ({
  editingProject,
  onClose,
}) => (
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
);

interface ProjectMilestonesFormListProps {
  milestones: ProjectMilestone[];
  activeEmployees: Employee[];
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onMilestoneChange: (index: number, patch: Partial<ProjectMilestone>) => void;
  onOwnerSelect: (index: number, ownerId: string) => void;
}

export const ProjectMilestonesFormList: React.FC<ProjectMilestonesFormListProps> = ({
  milestones,
  activeEmployees,
  onAddRow,
  onRemoveRow,
  onMilestoneChange,
  onOwnerSelect,
}) => (
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
        onClick={onAddRow}
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
              onChange={(e) => onMilestoneChange(idx, { title: e.target.value })}
              placeholder="Ex: Préparer les documents de l'ANTIC, Intégrer GPay..."
              className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2A7B76]"
            />
            {milestones.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveRow(idx)}
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
                onChange={(e) => onMilestoneChange(idx, { status: e.target.value as MilestoneStatus })}
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
                onChange={(e) => onMilestoneChange(idx, { targetDate: e.target.value })}
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
                onChange={(e) => onOwnerSelect(idx, e.target.value)}
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
);
