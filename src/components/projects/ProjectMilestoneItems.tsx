import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertOctagon,
  Circle,
  Plus,
  Trash2,
  Calendar,
  User,
} from 'lucide-react';
import { Employee, MilestoneStatus, ProjectMilestone } from '../../types';
import { formatShortFrenchDate, MILESTONE_STATUS_META } from '../../services/projectService';

const StatusIcon: React.FC<{ status: MilestoneStatus; className?: string }> = ({
  status,
  className = 'h-3.5 w-3.5',
}) => {
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

export const ProjectMilestoneRow: React.FC<{
  milestone: ProjectMilestone;
  index: number;
  canManage: boolean;
  onStatusChange: (milestoneId: string, nextStatus: MilestoneStatus) => void;
  onDelete: (milestoneId: string) => void;
}> = ({ milestone: ms, index, canManage, onStatusChange, onDelete }) => {
  const statusMeta = MILESTONE_STATUS_META[ms.status || 'todo'];
  return (
    <div className="p-4 bg-white hover:bg-stone-50/50 transition space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="text-[11px] font-mono tabular-nums font-bold text-stone-400 pt-0.5 shrink-0">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusIcon status={ms.status} />
              <span
                className={`text-sm font-semibold ${
                  ms.status === 'done' ? 'text-stone-500 line-through' : 'text-stone-900'
                }`}
              >
                {ms.title}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
              <span className={`font-semibold ${statusMeta.textClass}`}>{statusMeta.label}</span>
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
            onClick={() => onDelete(ms.id)}
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
                onClick={() => onStatusChange(ms.id, st)}
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
};

interface ProjectQuickAddMilestoneFormProps {
  projectName: string;
  activeEmployees: Employee[];
  newTitle: string;
  setNewTitle: (v: string) => void;
  newTargetDate: string;
  setNewTargetDate: (v: string) => void;
  newOwnerId: string;
  setNewOwnerId: (v: string) => void;
  newStatus: MilestoneStatus;
  setNewStatus: (v: MilestoneStatus) => void;
  isAdding: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const ProjectQuickAddMilestoneForm: React.FC<ProjectQuickAddMilestoneFormProps> = ({
  projectName,
  activeEmployees,
  newTitle,
  setNewTitle,
  newTargetDate,
  setNewTargetDate,
  newOwnerId,
  setNewOwnerId,
  newStatus,
  setNewStatus,
  isAdding,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
      <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
        <Plus className="h-3.5 w-3.5 text-[#2A7B76]" />
        <span>Ajouter un jalon à {projectName}</span>
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
  );
};
