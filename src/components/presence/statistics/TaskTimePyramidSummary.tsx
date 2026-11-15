import React from 'react';
import { Clock, Flame, TrendingUp, Trophy, Zap } from 'lucide-react';
import { TaskWithMetrics } from './TaskTimePyramidRow';

interface TaskTimePyramidSummaryProps {
  totalHours: number;
  averageHours: number;
  topTask?: TaskWithMetrics;
  quickestTask?: TaskWithMetrics;
}

export const TaskTimePyramidSummary: React.FC<TaskTimePyramidSummaryProps> = ({
  totalHours,
  averageHours,
  topTask,
  quickestTask,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-200/80 flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Charge Totale Cumulée
          </span>
          <div className="text-lg font-bold font-mono text-stone-900">{totalHours}h</div>
        </div>
        <div className="p-2 bg-emerald-50 text-[#2A7B76] rounded-xl border border-emerald-100">
          <Clock className="h-4 w-4" />
        </div>
      </div>

      <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-200/80 flex items-center justify-between">
        <div className="space-y-0.5 min-w-0 pr-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-600" />
            Sommet (Plus Chronophage)
          </span>
          <div className="text-xs font-bold text-stone-900 truncate" title={topTask?.title}>
            {topTask?.title || 'Aucune'}
          </div>
          <span className="text-[11px] font-mono text-emerald-700 font-bold">
            {topTask?.estimatedHours || 0}h (
            {totalHours > 0 ? Math.round(((topTask?.estimatedHours || 0) / totalHours) * 100) : 0}%)
          </span>
        </div>
        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
          <Trophy className="h-4 w-4" />
        </div>
      </div>

      <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-200/80 flex items-center justify-between">
        <div className="space-y-0.5 min-w-0 pr-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1">
            <Zap className="w-3 h-3 text-teal-600" />
            Base (Plus Rapide)
          </span>
          <div className="text-xs font-bold text-stone-900 truncate" title={quickestTask?.title}>
            {quickestTask?.title || 'Aucune'}
          </div>
          <span className="text-[11px] font-mono text-teal-700 font-bold">
            {quickestTask?.estimatedHours || 0}h (Moyenne : {averageHours}h)
          </span>
        </div>
        <div className="p-2 bg-teal-50 text-teal-600 rounded-xl border border-teal-100 shrink-0">
          <TrendingUp className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};
