import React from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { Task } from '../../../types';

export interface TaskWithDuration extends Task {
  estimatedHours: number;
}

export const RendementTaskDurationChart: React.FC<{
  sortedTasks: TaskWithDuration[];
  maxHours: number;
}> = ({ sortedTasks, maxHours }) => {
  return (
    <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif font-bold text-sm text-stone-900">
            Diagramme de Temps Passé par Tâche (Classé du plus long au plus court)
          </h3>
          <p className="text-[11px] text-stone-500">
            Estimation du temps de travail (heures) basée sur la complexité et les sous-tâches.
          </p>
        </div>
        <span className="text-xs font-bold text-[#2A7B76] bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
          {sortedTasks.length} Tâche(s) active(s)
        </span>
      </div>

      <div className="space-y-3 pt-2">
        {sortedTasks.map((task) => {
          const percentage = Math.round((task.estimatedHours / maxHours) * 100);
          const isCompleted = task.status === 'completed';
          return (
            <div key={task.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800 truncate max-w-md flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {task.title}
                </span>
                <span className="font-mono font-medium text-stone-600">
                  {task.estimatedHours}h estimées ({task.priority})
                </span>
              </div>

              <div className="w-full bg-stone-200 h-3 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCompleted ? 'bg-emerald-600' : 'bg-[#2A7B76]'
                  }`}
                  style={{ width: `${Math.max(percentage, 8)}%` }}
                />
              </div>
            </div>
          );
        })}
        {sortedTasks.length === 0 && (
          <p className="text-center py-6 text-stone-400 italic text-xs">
            Aucune tâche assignée à ce collaborateur.
          </p>
        )}
      </div>
    </div>
  );
};

interface RendementTaskAccordionListProps {
  sortedTasks: TaskWithDuration[];
  expandedTaskId: string | null;
  setExpandedTaskId: (id: string | null) => void;
  newSubtaskTitles: { [taskId: string]: string };
  setNewSubtaskTitles: React.Dispatch<React.SetStateAction<{ [taskId: string]: string }>>;
  onToggleSubtask: (task: Task, subtaskId: string) => void;
  onAddSubtask: (task: Task) => void;
  onDeleteSubtask: (task: Task, subtaskId: string) => void;
}

export const RendementTaskAccordionList: React.FC<RendementTaskAccordionListProps> = ({
  sortedTasks,
  expandedTaskId,
  setExpandedTaskId,
  newSubtaskTitles,
  setNewSubtaskTitles,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
}) => {
  return (
    <div className="space-y-3">
      <h3 className="font-serif font-bold text-sm text-stone-900">
        Détail des Tâches & Gestion des Sous-Tâches
      </h3>

      <div className="space-y-3">
        {sortedTasks.map((task) => {
          const isExpanded = expandedTaskId === task.id;
          const subtasks = task.subtasks || [];
          const completedSub = subtasks.filter((s) => s.completed).length;

          return (
            <div key={task.id} className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden transition">
              <div
                onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      task.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {task.status === 'completed' ? '✓' : '••'}
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-stone-900 truncate">{task.title}</h4>
                    <p className="text-[11px] text-stone-500 truncate">
                      {task.description || 'Aucune description'} • Sous-tâches : {completedSub}/{subtasks.length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-[11px] font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-lg">
                    {task.estimatedHours}h
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 bg-stone-50/80 border-t border-stone-200 space-y-3">
                  <div className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    Sous-tâches de la tâche ({subtasks.length})
                  </div>

                  <div className="space-y-2">
                    {subtasks.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-stone-200 shadow-3xs"
                      >
                        <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={sub.completed}
                            onChange={() => onToggleSubtask(task, sub.id)}
                            className="w-4 h-4 rounded border-stone-300 text-[#2A7B76] cursor-pointer"
                            title="Marquer comme complété"
                          />
                          <span
                            className={`text-xs truncate ${
                              sub.completed ? 'line-through text-stone-400 font-medium' : 'text-stone-800 font-bold'
                            }`}
                          >
                            {sub.title}
                          </span>
                        </label>

                        <button
                          onClick={() => onDeleteSubtask(task, sub.id)}
                          className="p-1 text-stone-400 hover:text-red-600 transition cursor-pointer ml-2"
                          title="Supprimer cette sous-tâche"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {subtasks.length === 0 && (
                      <p className="text-xs text-stone-400 italic">Aucune sous-tâche pour le moment.</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newSubtaskTitles[task.id] || ''}
                      onChange={(e) => setNewSubtaskTitles({ ...newSubtaskTitles, [task.id]: e.target.value })}
                      placeholder="Ajouter une nouvelle sous-tâche..."
                      className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
                      title="Titre de la nouvelle sous-tâche"
                    />
                    <button
                      onClick={() => onAddSubtask(task)}
                      className="px-3 py-1.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 shadow-xs"
                      title="Ajouter la sous-tâche"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Ajouter</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
