import React from 'react';
import { Filter, History } from 'lucide-react';
import { Subtask } from '../../../types';
import { TaskDetailSubtaskRow } from './TaskDetailSubtaskRow';

interface TaskDetailSubtasksSectionProps {
  taskDate: string;
  displayedSubtasks: Subtask[];
  hiddenCount: number;
  totalCount: number;
  subtaskFilterPeriod: 'last3days' | 'all';
  setSubtaskFilterPeriod: (p: 'last3days' | 'all') => void;
  newSubtaskTitle: string;
  setNewSubtaskTitle: (val: string) => void;
  quickSubtaskDueDate: string;
  setQuickSubtaskDueDate: (val: string) => void;
  onToggleSubtask: (subId: string) => void;
  onSelectSubtaskForDetail: (sub: Subtask) => void;
  onUpdateSubtaskDueDate: (subId: string, newDueDate: string) => void;
  onDeleteSubtask: (subId: string) => void;
  onOpenSubtaskModal: () => void;
  onAddSubtask: () => void;
}

export const TaskDetailSubtasksSection: React.FC<TaskDetailSubtasksSectionProps> = ({
  taskDate,
  displayedSubtasks,
  hiddenCount,
  totalCount,
  subtaskFilterPeriod,
  setSubtaskFilterPeriod,
  newSubtaskTitle,
  setNewSubtaskTitle,
  quickSubtaskDueDate,
  setQuickSubtaskDueDate,
  onToggleSubtask,
  onSelectSubtaskForDetail,
  onUpdateSubtaskDueDate,
  onDeleteSubtask,
  onOpenSubtaskModal,
  onAddSubtask,
}) => (
  <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-stone-200/60">
      <div className="flex items-center gap-2">
        <h4 className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
          <span>📋 Sous-tâches</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-700 font-semibold">
            {displayedSubtasks.length}/{totalCount}
          </span>
        </h4>
        <span className="text-[10px] text-stone-400 hidden sm:inline" title="Triées automatiquement de la plus récente à la plus ancienne">
          • Plus récentes d'abord
        </span>
      </div>

      <div className="flex items-center gap-1 self-start sm:self-auto bg-stone-200/70 p-0.5 rounded-xl text-[10px] font-bold">
        <button
          type="button"
          onClick={() => setSubtaskFilterPeriod('last3days')}
          className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
            subtaskFilterPeriod === 'last3days' ? 'bg-white text-[#2A7B76] shadow-2xs font-extrabold' : 'text-stone-600 hover:text-stone-900'
          }`}
          title="Afficher uniquement les sous-tâches des 3 derniers jours (glissants)"
        >
          <Filter className="h-2.5 w-2.5" />
          <span>3 derniers jours</span>
        </button>
        <button
          type="button"
          onClick={() => setSubtaskFilterPeriod('all')}
          className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
            subtaskFilterPeriod === 'all' ? 'bg-white text-[#2A7B76] shadow-2xs font-extrabold' : 'text-stone-600 hover:text-stone-900'
          }`}
          title="Afficher toutes les sous-tâches sans filtre temporel"
        >
          <History className="h-2.5 w-2.5" />
          <span>Toutes ({totalCount})</span>
        </button>
      </div>
    </div>

    {subtaskFilterPeriod === 'last3days' && hiddenCount > 0 && (
      <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl px-3 py-2 text-[11px] text-amber-900 flex items-center justify-between gap-2 animate-in fade-in">
        <span className="flex items-center gap-1.5 truncate">
          <span>💡</span>
          <span className="truncate">
            <strong>{hiddenCount} sous-tâche{hiddenCount > 1 ? 's' : ''} antérieure{hiddenCount > 1 ? 's' : ''}</strong> (+ de 3 jours) masquée{hiddenCount > 1 ? 's' : ''} pour la lisibilité.
          </span>
        </span>
        <button
          type="button"
          onClick={() => setSubtaskFilterPeriod('all')}
          className="text-amber-800 hover:text-amber-950 font-bold underline shrink-0 cursor-pointer text-[10px]"
        >
          Afficher tout
        </button>
      </div>
    )}

    <div className="space-y-1.5">
      {displayedSubtasks.length === 0 ? (
        <div className="text-center py-6 bg-white rounded-xl border border-dashed border-stone-200 text-stone-400 text-xs space-y-1">
          <p>
            {totalCount > 0
              ? `Aucune sous-tâche sur les 3 derniers jours (${totalCount} antérieure${totalCount > 1 ? 's' : ''}).`
              : 'Aucune sous-tâche pour le moment.'}
          </p>
          {totalCount > 0 && subtaskFilterPeriod === 'last3days' && (
            <button
              type="button"
              onClick={() => setSubtaskFilterPeriod('all')}
              className="text-[#2A7B76] font-bold hover:underline text-xs"
            >
              Voir les {totalCount} sous-tâches antérieures
            </button>
          )}
        </div>
      ) : (
        displayedSubtasks.map((sub: Subtask) => (
          <TaskDetailSubtaskRow
            key={sub.id}
            sub={sub}
            taskDate={taskDate}
            onToggleSubtask={onToggleSubtask}
            onSelectSubtaskForDetail={onSelectSubtaskForDetail}
            onUpdateSubtaskDueDate={onUpdateSubtaskDueDate}
            onDeleteSubtask={onDeleteSubtask}
          />
        ))
      )}
    </div>

    <div className="pt-1 pb-1">
      <button
        type="button"
        onClick={onOpenSubtaskModal}
        className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-[#2A7B76] border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
        title="Créer une sous-tâche détaillée avec le même procédé stylé que les tâches (style Asana)"
      >
        <span>+ Nouvelle sous-tâche détaillée (Style Asana)</span>
      </button>
    </div>

    <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
      <input
        type="text"
        placeholder="Ajouter une sous-tâche..."
        value={newSubtaskTitle}
        onChange={(e) => setNewSubtaskTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onAddSubtask();
          }
        }}
        className="flex-1 w-full px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2A7B76]"
      />
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <label className="flex items-center gap-1 bg-white border border-stone-200 px-2 py-1 rounded-xl text-[11px]" title="Date d'échéance propre de la sous-tâche">
          <span className="text-[10px] text-stone-500 font-semibold">Fin :</span>
          <input
            type="date"
            value={quickSubtaskDueDate}
            onChange={(e) => setQuickSubtaskDueDate(e.target.value)}
            className="font-mono font-bold text-stone-800 bg-transparent outline-none cursor-pointer text-[10px]"
          />
        </label>
        <button
          type="button"
          onClick={onAddSubtask}
          className="px-3 py-1.5 bg-[#2A7B76] text-white rounded-xl text-xs font-bold hover:bg-[#23635f] cursor-pointer shrink-0"
        >
          Ajouter
        </button>
      </div>
    </div>
  </div>
);
