import React from 'react';
import { Trophy, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Task, TaskStatus } from '../../../../types';

interface EmployeeRendementTaskCardProps {
  task: Task & { estimatedHours: number; dynamicProgress: number };
  isExpanded: boolean;
  todayStr: string;
  newSubtaskTitle: string;
  newSubtaskDueDate: string;
  onToggleExpand: () => void;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
  onMilestoneProgressChange: (task: Task, progress: number) => void;
  onToggleSubtask: (task: Task, subtaskId: string) => void;
  onUpdateSubtaskDueDate: (task: Task, subtaskId: string, newDueDate: string) => void;
  onDeleteSubtask: (task: Task, subtaskId: string) => void;
  onOpenSubtaskModal: (task: Task) => void;
  onQuickTitleChange: (val: string) => void;
  onQuickDueDateChange: (val: string) => void;
  onAddSubtask: (task: Task) => void;
}

export const EmployeeRendementTaskCard: React.FC<EmployeeRendementTaskCardProps> = ({
  task,
  isExpanded,
  todayStr,
  newSubtaskTitle,
  newSubtaskDueDate,
  onToggleExpand,
  onStatusChange,
  onMilestoneProgressChange,
  onToggleSubtask,
  onUpdateSubtaskDueDate,
  onDeleteSubtask,
  onOpenSubtaskModal,
  onQuickTitleChange,
  onQuickDueDateChange,
  onAddSubtask,
}) => {
  const subtasks = task.subtasks || [];
  const completedSub = subtasks.filter((s) => s.completed || s.status === 'completed').length;
  const isCompleted = task.status === 'completed';
  const progress = task.dynamicProgress;

  return (
    <div className="bg-white hover:bg-stone-50/50 rounded-2xl border border-stone-200/90 shadow-3xs overflow-hidden transition-all duration-200">
      <div onClick={onToggleExpand} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : task.status === 'in_progress'
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : task.status === 'blocked'
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'bg-stone-100 text-stone-700 border border-stone-300'
            }`}
          >
            {isCompleted ? '✓' : isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate">{task.title}</h4>
              {task.isMilestone && (
                <span className="bg-amber-100 text-amber-950 border border-amber-300 px-1.5 py-0.2 rounded-md text-[9px] font-bold flex items-center gap-0.5">
                  <Trophy className="w-2.5 h-2.5" /> Jalon
                </span>
              )}
              {task.date && <span className="text-[10px] text-stone-400 font-mono">📅 {task.date}</span>}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-1 flex-wrap">
              <span>Sous-tâches : <strong className="text-stone-700">{completedSub}/{subtasks.length}</strong></span>
              <span>•</span>
              <span>
                Avancement réel :{' '}
                <strong className={isCompleted ? 'text-emerald-700' : progress > 0 ? 'text-[#2A7B76]' : 'text-stone-600'}>{progress}%</strong>
              </span>
              {task.priority && (
                <>
                  <span>•</span>
                  <span className="capitalize text-stone-600">Priorité : {task.priority}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-xl outline-none cursor-pointer border transition shadow-3xs ${
              isCompleted
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : task.status === 'in_progress'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : task.status === 'blocked'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-stone-50 text-stone-700 border-stone-200'
            }`}
            title="Changer directement le statut de la tâche"
          >
            <option value="todo">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="pending_validation">En attente</option>
            <option value="blocked">Bloquée</option>
            <option value="completed">Terminée ✓</option>
          </select>

          <span className="font-mono text-[11px] font-bold text-stone-700 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-xl">
            {task.estimatedHours}h
          </span>
        </div>
      </div>

      <div className="w-full bg-stone-100 h-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500' : progress > 0 ? 'bg-[#2A7B76]' : 'bg-transparent'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {task.isMilestone && (
        <div className="px-4 py-2 bg-amber-50/50 border-t border-amber-100 flex items-center justify-between gap-3 text-xs">
          <span className="font-bold text-amber-900 text-[11px] flex items-center gap-1">
            <Trophy className="h-3 w-3 text-amber-600" />
            Avancement du Jalon : {task.milestoneProgress ?? (task.status === 'completed' ? 100 : 0)}%
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={task.milestoneProgress ?? (task.status === 'completed' ? 100 : 0)}
            onChange={(e) => onMilestoneProgressChange(task, parseInt(e.target.value, 10))}
            className="w-32 accent-[#2A7B76] cursor-pointer"
            title="Ajuster l'avancement du jalon"
          />
        </div>
      )}

      {isExpanded && (
        <div className="p-4 bg-stone-50/60 border-t border-stone-200/80 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-700 uppercase tracking-wider">
            <span>Sous-tâches de la tâche ({subtasks.length})</span>
            <span className="text-[#2A7B76] font-mono font-bold">{completedSub}/{subtasks.length} achevée(s)</span>
          </div>

          <div className="space-y-2">
            {subtasks.map((sub) => (
              <div
                key={sub.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-2.5 rounded-xl border border-stone-200 hover:border-[#2A7B76]/50 transition shadow-3xs gap-2"
              >
                <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={sub.completed}
                    onChange={() => onToggleSubtask(task, sub.id)}
                    className="w-4 h-4 rounded border-stone-300 text-[#2A7B76] cursor-pointer accent-[#2A7B76]"
                  />
                  <span className={`text-xs truncate ${sub.completed ? 'line-through text-stone-400 font-medium' : 'text-stone-800 font-bold'}`}>
                    {sub.title}
                  </span>
                  {sub.estimatedHours && <span className="text-[10px] text-stone-400 font-mono ml-1">({sub.estimatedHours}h)</span>}
                </label>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <label
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 bg-stone-50 hover:bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-md text-[10px] cursor-pointer"
                    title="Modifier la date d'échéance propre de cette sous-tâche"
                  >
                    <span className="text-[9px] text-stone-500 font-bold">Fin :</span>
                    <input
                      type="date"
                      value={sub.dueDate || sub.endDate || ''}
                      onChange={(e) => {
                        e.stopPropagation();
                        onUpdateSubtaskDueDate(task, sub.id, e.target.value);
                      }}
                      className="font-mono font-bold text-stone-800 bg-transparent outline-none cursor-pointer text-[10px]"
                    />
                  </label>

                  <button
                    onClick={() => onDeleteSubtask(task, sub.id)}
                    className="p-1 text-stone-400 hover:text-rose-600 transition cursor-pointer"
                    title="Supprimer cette sous-tâche"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {subtasks.length === 0 && (
              <p className="text-xs text-stone-400 italic py-1">Aucune sous-tâche créée pour le moment.</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenSubtaskModal(task)}
              className="w-full sm:w-auto px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#2A7B76] border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              title="Créer une sous-tâche complète"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nouvelle sous-tâche détaillée</span>
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-2 flex-1 w-full">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => onQuickTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onAddSubtask(task);
                }}
                placeholder="Ajout rapide de sous-tâche..."
                className="flex-1 w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
              />
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="flex items-center gap-1 bg-white border border-stone-200 px-2 py-1 rounded-xl text-[11px] shrink-0" title="Date d'échéance de la sous-tâche">
                  <span className="text-[10px] text-stone-500 font-semibold">Fin :</span>
                  <input
                    type="date"
                    value={newSubtaskDueDate || todayStr}
                    onChange={(e) => onQuickDueDateChange(e.target.value)}
                    className="font-mono font-bold text-stone-800 bg-transparent outline-none cursor-pointer text-[10px]"
                  />
                </label>
                <button
                  onClick={() => onAddSubtask(task)}
                  className="px-3 py-1.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
