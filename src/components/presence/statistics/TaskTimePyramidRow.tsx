import React from 'react';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Task, TaskStatus } from '../../../types';

export interface TaskWithMetrics extends Task {
  estimatedHours: number;
  dynamicProgress: number;
}

export const getTaskStatusBadge = (status: TaskStatus) => {
  switch (status) {
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> Terminée
        </span>
      );
    case 'in_progress':
    case 'en_cours':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <Clock className="w-3 h-3" /> En cours
        </span>
      );
    case 'pending_validation':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
          En attente
        </span>
      );
    case 'blocked':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertCircle className="w-3 h-3" /> Bloquée
        </span>
      );
    case 'todo':
    case 'idea':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
          À faire
        </span>
      );
  }
};

export const getPyramidTierStyle = (hours: number, maxHours: number) => {
  const ratio = hours / maxHours;
  if (ratio >= 0.75) {
    return {
      wingGradient: 'from-emerald-600 via-[#2A7B76] to-emerald-600',
      textColor: 'text-[#2A7B76]',
      label: 'Charge Lourde / Projet Clé',
    };
  }
  if (ratio >= 0.4) {
    return {
      wingGradient: 'from-teal-600 via-[#20635F] to-teal-600',
      textColor: 'text-teal-700',
      label: 'Charge Médiane',
    };
  }
  return {
    wingGradient: 'from-slate-500 via-stone-600 to-slate-500',
    textColor: 'text-stone-600',
    label: 'Tâche Rapide / Micro-action',
  };
};

interface TaskTimePyramidRowProps {
  task: TaskWithMetrics;
  index: number;
  totalHours: number;
  maxHours: number;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

export const TaskTimePyramidRow: React.FC<TaskTimePyramidRowProps> = ({
  task,
  index,
  totalHours,
  maxHours,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
}) => {
  const hours = task.estimatedHours;
  const percentageOfTotal = totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0;
  const wingWidth = Math.max(12, Math.round((hours / maxHours) * 95));
  const tierStyle = getPyramidTierStyle(hours, maxHours);

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
        isHovered
          ? 'bg-emerald-50/40 border-[#2A7B76] shadow-sm transform scale-[1.008]'
          : 'bg-white hover:bg-stone-50/70 border-stone-200/80 shadow-3xs'
      }`}
      title="Cliquer pour afficher la tâche et ses sous-tâches détaillées"
    >
      <div className="flex items-center justify-between text-xs mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0 max-w-sm sm:max-w-md">
          <span
            className={`w-5 h-5 rounded-lg flex items-center justify-center font-mono font-bold text-[10px] shrink-0 ${
              index === 0
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : index === 1
                ? 'bg-stone-200 text-stone-800'
                : index === 2
                ? 'bg-amber-50 text-amber-800'
                : 'bg-stone-100 text-stone-500'
            }`}
          >
            #{index + 1}
          </span>

          <strong className="text-stone-900 font-bold truncate block">{task.title}</strong>

          {task.isMilestone && (
            <span className="bg-amber-100 text-amber-950 border border-amber-300 px-1.5 py-0.2 rounded-md text-[9px] font-bold shrink-0">
              Jalon
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {getTaskStatusBadge(task.status)}
          <span className="font-mono font-bold text-xs text-stone-900 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-lg">
            {hours}h
          </span>
          <span className="text-[10px] font-mono text-stone-400 hidden sm:inline">
            ({percentageOfTotal}% du temps)
          </span>
        </div>
      </div>

      <div className="relative flex items-center justify-center h-5 w-full bg-stone-100/70 rounded-xl overflow-hidden px-2">
        <div className="absolute inset-y-0 left-1/2 w-0.5 bg-stone-300/80 z-10" />

        <div className="w-1/2 flex justify-end pr-0.5">
          <div
            className={`h-3 rounded-l-lg bg-gradient-to-l ${tierStyle.wingGradient} transition-all duration-500 shadow-2xs`}
            style={{ width: `${wingWidth}%` }}
          />
        </div>

        <div className="w-1/2 flex justify-start pl-0.5">
          <div
            className={`h-3 rounded-r-lg bg-gradient-to-r ${tierStyle.wingGradient} transition-all duration-500 shadow-2xs`}
            style={{ width: `${wingWidth}%` }}
          />
        </div>

        <span className="absolute z-20 text-[9px] font-mono font-bold text-white bg-black/40 px-2 py-0.2 rounded-full backdrop-blur-xs">
          {task.dynamicProgress}% achevé
        </span>
      </div>

      <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1.5 px-0.5">
        <span>
          {task.subtasks && task.subtasks.length > 0
            ? `${task.subtasks.filter((s) => s.completed || s.status === 'completed').length}/${task.subtasks.length} sous-tâche(s)`
            : 'Tâche unitaire'}
        </span>
        <span className="font-medium text-stone-500">
          Progression réelle : <strong className="text-stone-700 font-bold">{task.dynamicProgress}%</strong>
        </span>
      </div>
    </div>
  );
};
