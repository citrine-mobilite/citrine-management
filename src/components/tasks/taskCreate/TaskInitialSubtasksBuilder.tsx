import React from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';
import { Employee, Subtask } from '../../../types';

interface TaskInitialSubtasksBuilderProps {
  subtasks: Subtask[];
  showSubtaskForm: boolean;
  setShowSubtaskForm: (v: boolean) => void;
  newSubtaskTitle: string;
  setNewSubtaskTitle: (v: string) => void;
  newSubtaskAssignee: string;
  setNewSubtaskAssignee: (v: string) => void;
  newSubtaskHours: number;
  setNewSubtaskHours: (v: number) => void;
  newSubtaskDueDate: string;
  setNewSubtaskDueDate: (v: string) => void;
  availableEmployees: Employee[];
  onAddSubtaskQuick: () => void;
  onUpdateSubtaskDueDateInline: (index: number, updatedDate: string) => void;
  onRemoveSubtask: (idx: number) => void;
}

export const TaskInitialSubtasksBuilder: React.FC<TaskInitialSubtasksBuilderProps> = ({
  subtasks,
  showSubtaskForm,
  setShowSubtaskForm,
  newSubtaskTitle,
  setNewSubtaskTitle,
  newSubtaskAssignee,
  setNewSubtaskAssignee,
  newSubtaskHours,
  setNewSubtaskHours,
  newSubtaskDueDate,
  setNewSubtaskDueDate,
  availableEmployees,
  onAddSubtaskQuick,
  onUpdateSubtaskDueDateInline,
  onRemoveSubtask,
}) => {
  return (
    <div className="bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-[#2A7B76]" />
          Sous-tâches associées ({subtasks.length})
        </span>
        <button
          type="button"
          onClick={() => setShowSubtaskForm(!showSubtaskForm)}
          className="text-[11px] font-bold text-[#2A7B76] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>{showSubtaskForm ? 'Masquer' : '+ Ajouter des sous-tâches dès maintenant'}</span>
        </button>
      </div>

      {subtasks.length > 0 && (
        <div className="space-y-1.5">
          {subtasks.map((sub, i) => (
            <div key={sub.id || i} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-3 py-2 rounded-xl border border-stone-200 text-xs gap-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#2A7B76]"></span>
                <strong className="text-stone-800 truncate">{sub.title}</strong>
              </div>
              <div className="flex items-center gap-2 text-[10px] flex-wrap justify-end">
                <label className="flex items-center gap-1 bg-stone-50 border border-stone-200 px-1.5 py-0.5 rounded-md" title="Date d'échéance / fin propre à cette sous-tâche">
                  <span className="text-[9px] text-stone-500 font-semibold">Fin :</span>
                  <input
                    type="date"
                    value={sub.dueDate || ''}
                    onChange={(e) => onUpdateSubtaskDueDateInline(i, e.target.value)}
                    className="font-mono font-bold text-stone-800 bg-transparent outline-none cursor-pointer text-[10px]"
                  />
                </label>
                <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium">
                  {sub.assignedTo}
                </span>
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-mono font-bold">
                  {sub.estimatedHours}h
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveSubtask(i)}
                  className="text-stone-400 hover:text-rose-600 p-0.5 transition cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSubtaskForm && (
        <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2 animate-in fade-in">
          <input
            type="text"
            placeholder="Intitulé de la sous-tâche..."
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-[#2A7B76]"
          />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <select
              value={newSubtaskAssignee}
              onChange={(e) => setNewSubtaskAssignee(e.target.value)}
              className="px-2 py-1 rounded-lg border border-stone-200 bg-stone-50 text-[11px] font-medium"
            >
              <option value="Équipe">👥 Toute l'équipe</option>
              {availableEmployees.map((emp) => (
                <option key={emp.id} value={emp.name}>{emp.name}</option>
              ))}
            </select>
            <label className="flex items-center gap-1 px-2 py-1 rounded-lg border border-stone-200 bg-stone-50 text-[11px]" title="Date d'échéance propre de la sous-tâche">
              <span className="text-[10px] text-stone-500 font-semibold">Fin :</span>
              <input
                type="date"
                value={newSubtaskDueDate}
                onChange={(e) => setNewSubtaskDueDate(e.target.value)}
                className="w-full bg-transparent font-mono font-bold text-stone-800 text-[10px] outline-none"
              />
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={40}
                value={newSubtaskHours}
                onChange={(e) => setNewSubtaskHours(Number(e.target.value))}
                className="w-full px-2 py-1 rounded-lg border border-stone-200 bg-stone-50 text-[11px] font-mono font-bold text-center"
              />
              <span className="text-[10px] text-stone-500 font-bold">h</span>
            </div>
            <button
              type="button"
              onClick={onAddSubtaskQuick}
              className="px-3 py-1 bg-[#2A7B76] text-white rounded-lg text-xs font-bold hover:bg-[#20635F] cursor-pointer flex items-center justify-center gap-1 shadow-xs"
            >
              <Plus className="h-3 w-3" />
              <span>Ajouter</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
