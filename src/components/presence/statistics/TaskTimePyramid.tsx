import React, { useState, useMemo } from 'react';
import { Layers, TrendingUp } from 'lucide-react';
import { TaskTimePyramidRow, TaskWithMetrics } from './TaskTimePyramidRow';
import { TaskTimePyramidSummary } from './TaskTimePyramidSummary';

interface TaskTimePyramidProps {
  tasks: TaskWithMetrics[];
  onSelectTask?: (taskId: string) => void;
}

export const TaskTimePyramid: React.FC<TaskTimePyramidProps> = ({
  tasks,
  onSelectTask,
}) => {
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  const sortedByDuration = useMemo(() => {
    return [...tasks].sort((a, b) => b.estimatedHours - a.estimatedHours);
  }, [tasks]);

  const totalHours = useMemo(() => {
    return sortedByDuration.reduce((acc, t) => acc + t.estimatedHours, 0);
  }, [sortedByDuration]);

  const maxHours = useMemo(() => {
    return Math.max(...sortedByDuration.map((t) => t.estimatedHours), 1);
  }, [sortedByDuration]);

  const averageHours = useMemo(() => {
    if (sortedByDuration.length === 0) return 0;
    return Math.round((totalHours / sortedByDuration.length) * 10) / 10;
  }, [sortedByDuration, totalHours]);

  const topTask = sortedByDuration[0];
  const quickestTask = sortedByDuration[sortedByDuration.length - 1];

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-gradient-to-br from-[#2A7B76] to-emerald-800 text-white rounded-2xl shadow-sm">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-base text-stone-900">
                Pyramide du Temps Passé & Distribution des Charges
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-[#2A7B76] border border-emerald-200">
                Style Pyramide des Âges
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Tâches ordonnées de celle qui a demandé le plus de temps à celle qui en a demandé le moins.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono font-bold text-stone-600 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
            {sortedByDuration.length} tâche(s) au total
          </span>
        </div>
      </div>

      <TaskTimePyramidSummary
        totalHours={totalHours}
        averageHours={averageHours}
        topTask={topTask}
        quickestTask={quickestTask}
      />

      <div className="flex flex-wrap items-center justify-between text-[11px] text-stone-500 px-2 py-1 bg-stone-50 rounded-xl border border-stone-200/60">
        <span className="flex items-center gap-1.5 font-medium">
          <TrendingUp className="w-3.5 h-3.5 text-[#2A7B76]" />
          <span>Axe vertical central : Les ailes s'étendent proportionnellement au temps passé (en heures)</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-semibold text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Charge Forte
          </span>
          <span className="flex items-center gap-1 font-semibold text-teal-700">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" /> Moyenne
          </span>
          <span className="flex items-center gap-1 font-semibold text-stone-600">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-400 inline-block" /> Rapide
          </span>
        </div>
      </div>

      <div className="space-y-2.5 pt-2">
        {sortedByDuration.map((task, index) => (
          <TaskTimePyramidRow
            key={task.id}
            task={task}
            index={index}
            totalHours={totalHours}
            maxHours={maxHours}
            isHovered={hoveredTaskId === task.id}
            onMouseEnter={() => setHoveredTaskId(task.id)}
            onMouseLeave={() => setHoveredTaskId(null)}
            onClick={() => onSelectTask?.(task.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskTimePyramid;
