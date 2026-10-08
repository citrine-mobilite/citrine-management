import React from 'react';
import { Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Task } from '../../types';

interface TaskStatsCardsProps {
  tasks: Task[];
}

export const TaskStatsCards: React.FC<TaskStatsCardsProps> = ({ tasks }) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const blocked = tasks.filter((t) => t.status === 'blocked').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Total Tâches</span>
          <Calendar className="h-4 w-4 text-[#2A7B76]" />
        </div>
        <p className="text-xl font-bold text-stone-900 mt-1">{total}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">En Cours</span>
          <Clock className="h-4 w-4 text-amber-600" />
        </div>
        <p className="text-xl font-bold text-amber-700 mt-1">{inProgress}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Terminées</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </div>
        <p className="text-xl font-bold text-emerald-700 mt-1">{completed}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Bloquées / Incidents</span>
          <AlertTriangle className="h-4 w-4 text-rose-600" />
        </div>
        <p className="text-xl font-bold text-rose-700 mt-1">{blocked}</p>
      </div>
    </div>
  );
};
