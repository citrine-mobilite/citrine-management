import React from 'react';
import { Calendar, Clock, Trash2 } from 'lucide-react';
import { Task } from '../../types';

interface TaskCardItemProps {
  task: Task;
  onDelete: (id: string) => void;
}

export const TaskCardItem: React.FC<TaskCardItemProps> = ({ task, onDelete }) => {
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getPriorityStyle(
              task.priority
            )}`}
          >
            {task.priority}
          </span>
          <span className="text-[10px] text-stone-400 font-mono">
            {task.date} {task.time}
          </span>
        </div>

        <h4 className="font-bold text-xs text-stone-900 line-clamp-1">{task.title}</h4>
        {task.description && <p className="text-[11px] text-stone-500 line-clamp-2">{task.description}</p>}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-stone-100 shrink-0">
        <span className="text-[10px] font-bold text-[#2A7B76] capitalize">Statut : {task.status}</span>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
