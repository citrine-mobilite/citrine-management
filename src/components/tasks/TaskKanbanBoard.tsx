import React from 'react';
import { 
  Plus, 
  GripVertical, 
  User, 
  Lightbulb, 
  Clock, 
  AlertCircle, 
  ShieldAlert, 
  CheckCircle,
  Flag
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '../../types';

interface TaskKanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onSelectTask: (task: Task) => void;
  onOpenCreateModal: (defaultStatus: TaskStatus) => void;
  getPriorityBadge: (p: TaskPriority) => React.ReactNode;
}

export const KANBAN_COLUMNS: Array<{
  id: TaskStatus;
  title: string;
  bgSoft: string;
  borderSoft: string;
  textSoft: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'idea', title: '💡 Idée', bgSoft: 'bg-purple-50/70', borderSoft: 'border-purple-200/80', textSoft: 'text-purple-700', icon: Lightbulb },
  { id: 'todo', title: '📌 À faire', bgSoft: 'bg-stone-50/80', borderSoft: 'border-stone-200/80', textSoft: 'text-stone-700', icon: Clock },
  { id: 'in_progress', title: '⚡ En cours', bgSoft: 'bg-amber-50/70', borderSoft: 'border-amber-200/80', textSoft: 'text-amber-700', icon: AlertCircle },
  { id: 'pending_validation', title: '⏳ En attente validation', bgSoft: 'bg-blue-50/70', borderSoft: 'border-blue-200/80', textSoft: 'text-blue-700', icon: Clock },
  { id: 'blocked', title: '🚨 Bloquée', bgSoft: 'bg-rose-50/70', borderSoft: 'border-rose-200/80', textSoft: 'text-rose-700', icon: ShieldAlert },
  { id: 'completed', title: '✅ Terminée', bgSoft: 'bg-emerald-50/70', borderSoft: 'border-emerald-200/80', textSoft: 'text-emerald-700', icon: CheckCircle },
];

export const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  tasks,
  onStatusChange,
  onSelectTask,
  onOpenCreateModal,
  getPriorityBadge,
}) => {
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    onStatusChange(taskId, targetStatus);
  };

  return (
    <div className="w-full overflow-x-auto pb-4 pt-1">
      {/* Strict horizontal line - no wrap */}
      <div className="flex flex-row gap-4 items-start min-w-max">
        {KANBAN_COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => (t.status || 'todo') === col.id);
          const ColIcon = col.icon;
          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`w-80 min-w-[320px] shrink-0 ${col.bgSoft} rounded-3xl p-4 border ${col.borderSoft} flex flex-col min-h-[580px] shadow-2xs transition select-none`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200/60">
                <div className="flex items-center gap-2">
                  <ColIcon className={`h-4 w-4 ${col.textSoft}`} />
                  <h3 className={`font-serif font-bold text-xs ${col.textSoft}`}>{col.title}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold bg-white text-stone-700 px-2 py-0.5 rounded-lg border border-stone-200 shadow-2xs font-mono">
                    {colTasks.length}
                  </span>
                  <button
                    onClick={() => onOpenCreateModal(col.id)}
                    className="p-1 hover:bg-white/80 rounded-lg text-stone-400 hover:text-stone-800 transition cursor-pointer"
                    title="Ajouter une tâche dans cette colonne"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Cards list inside column */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[700px] pr-0.5">
                {colTasks.length === 0 ? (
                  <div className="text-center py-16 text-stone-400 text-[11px] border-2 border-dashed border-stone-200/70 rounded-2xl flex flex-col items-center justify-center gap-1">
                    <span>Glisser-déposer ici</span>
                    <span className="text-[10px] text-stone-300">ou cliquer sur + pour ajouter</span>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => onSelectTask(task)}
                      className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-md hover:border-[#2A7B76]/50 transition space-y-2.5 cursor-pointer group relative"
                    >
                      {/* Top badge line */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <GripVertical className="h-3.5 w-3.5 text-stone-300 shrink-0 cursor-grab group-hover:text-stone-500" />
                          <h4 className="font-bold text-xs text-stone-900 group-hover:text-[#2A7B76] transition line-clamp-2">
                            {task.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {getPriorityBadge(task.priority)}
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-stone-500 line-clamp-2">{task.description}</p>
                      )}

                      {/* Subtasks progress */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="text-[10px] text-stone-500 flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-lg border border-stone-200/50">
                          <span>📋</span>
                          <span>
                            {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} sous-tâches
                          </span>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400">
                        <div className="flex items-center gap-1 text-stone-600 font-medium">
                          <User className="h-3 w-3 text-stone-400" />
                          <span className="truncate max-w-[120px]">{task.assignedTo || 'Équipe'}</span>
                        </div>
                        <span className="font-mono text-stone-500 font-semibold">{task.date}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
