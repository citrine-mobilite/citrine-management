import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Subtask } from '../../../types';
import { formatSubtaskRelativeDate } from '../../../utils/subtaskFilterUtils';

interface TaskDetailSubtaskRowProps {
  sub: Subtask;
  taskDate: string;
  onToggleSubtask: (subId: string) => void;
  onSelectSubtaskForDetail: (sub: Subtask) => void;
  onUpdateSubtaskDueDate: (subId: string, newDueDate: string) => void;
  onDeleteSubtask: (subId: string) => void;
}

export const TaskDetailSubtaskRow: React.FC<TaskDetailSubtaskRowProps> = ({
  sub,
  taskDate,
  onToggleSubtask,
  onSelectSubtaskForDetail,
  onUpdateSubtaskDueDate,
  onDeleteSubtask,
}) => {
  const relativeDate = formatSubtaskRelativeDate(sub, taskDate);
  const isSubBlocked = sub.status === 'blocked' || sub.isBlocked || (sub.incidents && sub.incidents.length > 0);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-2.5 rounded-xl border border-stone-200 gap-2 hover:border-[#2A7B76]/40 transition">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <input
          type="checkbox"
          checked={sub.completed}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSubtask(sub.id);
          }}
          className="w-4 h-4 rounded border-stone-300 text-[#2A7B76] cursor-pointer shrink-0"
        />
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelectSubtaskForDetail(sub);
          }}
          className="min-w-0 flex-1 cursor-pointer group"
          title="Cliquer pour ouvrir le détail complet de cette sous-tâche"
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4
              className={`text-sm sm:text-base font-bold text-stone-900 group-hover:text-[#2A7B76] transition truncate ${
                sub.completed ? 'line-through text-stone-400 font-medium' : ''
              }`}
            >
              {sub.title} {sub.subtasks && sub.subtasks.length > 0 ? `(${sub.subtasks.length} sous-tâche(s))` : ''}
            </h4>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-100 text-stone-500 font-medium">
              📅 {relativeDate}
            </span>
          </div>
          {sub.description && <p className="text-[11px] text-stone-500 truncate mt-0.5">{sub.description}</p>}
          {(isSubBlocked || sub.blockerReason) && (
            <div className="text-[10px] text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md mt-1 inline-flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 shrink-0 text-rose-600" />
              <span className="truncate">
                Blocage : {sub.blockerReason || (sub.incidents && sub.incidents.length > 0 ? sub.incidents[sub.incidents.length - 1].title : 'Difficulté signalée')}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] shrink-0 self-end sm:self-auto flex-wrap justify-end">
        <label
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 bg-stone-50 hover:bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-md cursor-pointer"
          title="Modifier directement la date d'échéance propre de cette sous-tâche"
        >
          <span className="text-[9px] text-stone-500 font-bold">Fin :</span>
          <input
            type="date"
            value={sub.dueDate || sub.endDate || ''}
            onChange={(e) => {
              e.stopPropagation();
              onUpdateSubtaskDueDate(sub.id, e.target.value);
            }}
            className="font-mono font-bold text-stone-800 bg-transparent outline-none cursor-pointer text-[10px]"
          />
        </label>
        {isSubBlocked && (
          <span className="px-2 py-0.5 rounded-md font-bold text-[9px] bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 shrink-0">
            <AlertTriangle className="h-2.5 w-2.5 text-rose-600" />
            <span>Bloquée</span>
          </span>
        )}
        {sub.assignedTo && <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium">{sub.assignedTo}</span>}
        {sub.estimatedHours && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-mono font-bold">{sub.estimatedHours}h</span>}
        {sub.priority && (
          <span
            className={`px-1.5 py-0.5 rounded-md font-bold uppercase text-[9px] ${
              sub.priority === 'urgent' || sub.priority === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-stone-100 text-stone-600'
            }`}
          >
            {sub.priority}
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectSubtaskForDetail(sub);
          }}
          className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-bold cursor-pointer"
          title="Ouvrir le détail complet et options de la sous-tâche"
        >
          Ouvrir ⚙️
        </button>
        <button
          type="button"
          onClick={() => onDeleteSubtask(sub.id)}
          className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer transition"
          title="Supprimer cette sous-tâche"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
