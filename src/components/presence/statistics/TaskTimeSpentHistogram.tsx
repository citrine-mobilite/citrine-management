import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Clock, BarChart2, LayoutList, Flame, Trophy } from 'lucide-react';
import { Employee, Task } from '../../../types';
import {
  buildSubtaskTimeHistogramData,
  SubtaskTimeHistogramEntry,
  round1,
} from '../../../utils/rendementTaskHelpers';

interface TaskTimeSpentHistogramProps {
  tasks: Task[];
  employee?: Employee;
  title?: string;
  maxItems?: number;
  showAssigneeInTooltip?: boolean;
  onSelectTask?: (entry: SubtaskTimeHistogramEntry) => void;
}

const STATUS_LABELS: Record<string, string> = {
  completed: 'Terminée',
  in_progress: 'En cours',
  en_cours: 'En cours',
  pending_validation: 'Validation',
  blocked: 'Bloquée',
  todo: 'À faire',
  idea: 'Idée',
};

export const TaskTimeSpentHistogram: React.FC<TaskTimeSpentHistogramProps> = ({
  tasks,
  employee,
  title = 'Temps Passé par Sous-Tâche',
  maxItems = 10,
  showAssigneeInTooltip = true,
  onSelectTask,
}) => {
  const [viewMode, setViewMode] = useState<'histogram' | 'list'>('histogram');
  const [showAll, setShowAll] = useState(false);

  const allEntries = useMemo(
    () => buildSubtaskTimeHistogramData(tasks, employee),
    [tasks, employee]
  );

  const displayedEntries = useMemo(() => {
    if (showAll) return allEntries;
    return allEntries.slice(0, maxItems);
  }, [allEntries, showAll, maxItems]);

  const summary = useMemo(() => {
    const totalEffective = round1(allEntries.reduce((acc, e) => acc + e.effectiveHours, 0));
    const totalActual = round1(allEntries.reduce((acc, e) => acc + e.actualHours, 0));
    const totalEstimated = round1(allEntries.reduce((acc, e) => acc + e.estimatedHours, 0));
    const avgEffective = allEntries.length > 0 ? round1(totalEffective / allEntries.length) : 0;
    const topItem = allEntries[0] || null;
    const maxScale = Math.max(
      ...displayedEntries.map((e) => Math.max(e.effectiveHours, e.estimatedHours)),
      1
    );
    return { totalEffective, totalActual, totalEstimated, avgEffective, topItem, maxScale };
  }, [allEntries, displayedEntries]);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-[#2A7B76] rounded-2xl border border-emerald-100 shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <h3 className="font-serif font-bold text-base text-stone-900">{title}</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
          {allEntries.length > maxItems && (
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl font-semibold transition cursor-pointer"
            >
              {showAll ? `Top ${maxItems}` : `Tout voir (${allEntries.length})`}
            </button>
          )}

          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => setViewMode('histogram')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'histogram'
                  ? 'bg-white text-[#2A7B76] shadow-3xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Histogramme</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-[#2A7B76] shadow-3xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span>Classement</span>
            </button>
          </div>
        </div>
      </div>

      {allEntries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-200/80 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <Flame className="h-3 w-3 text-amber-600" />
                Sous-Tâche #1 Plus Chronophage
              </span>
              <p className="text-xs font-bold text-stone-900 truncate mt-0.5" title={summary.topItem?.title}>
                {summary.topItem?.title || 'Aucune'}
              </p>
              {summary.topItem?.parentTaskTitle && (
                <p className="text-[10px] text-stone-500 truncate" title={summary.topItem.parentTaskTitle}>
                  ↳ {summary.topItem.parentTaskTitle}
                </p>
              )}
              <span className="text-[11px] font-semibold text-[#2A7B76] tabular-nums">
                {summary.topItem?.effectiveHours || 0}h passées / {summary.topItem?.estimatedHours || 0}h estimées
              </span>
            </div>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 shrink-0">
              <Trophy className="h-4 w-4" />
            </div>
          </div>

          <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                Temps Passé Total
              </span>
              <div className="text-lg font-bold text-stone-900 tabular-nums mt-0.5">
                {summary.totalEffective}h
              </div>
              <span className="text-[11px] text-stone-500 tabular-nums">
                Dont {summary.totalActual}h pointées · {summary.totalEstimated}h estimées
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                Moyenne &amp; Volume Atomique
              </span>
              <div className="text-lg font-bold text-stone-900 tabular-nums mt-0.5">
                {summary.avgEffective}h / sous-tâche
              </div>
              <span className="text-[11px] text-stone-500 tabular-nums">
                {allEntries.length} élément(s) analysé(s)
              </span>
            </div>
          </div>
        </div>
      )}

      {allEntries.length === 0 ? (
        <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-200/70 text-xs text-stone-500">
          Aucune sous-tâche ni tâche sur cette période pour calculer le temps passé.
        </div>
      ) : viewMode === 'histogram' ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500">
            <span>
              {onSelectTask
                ? 'Cliquez sur une barre pour consulter la mission parente ou le collaborateur.'
                : 'Survolez une barre pour afficher la mission parente, la date et le temps.'}
            </span>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-medium text-stone-700">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#2A7B76]" /> Temps passé (h)
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-stone-600">
                <span className="w-2.5 h-2.5 rounded-xs bg-stone-300" /> Charge estimée (h)
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayedEntries}
                margin={{ top: 10, right: 16, left: -12, bottom: 24 }}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                <XAxis
                  dataKey="shortTitle"
                  tick={{ fontSize: 10, fill: '#57534e' }}
                  axisLine={{ stroke: '#e7e5e4' }}
                  tickLine={false}
                  interval={0}
                  angle={displayedEntries.length > 5 ? -18 : 0}
                  textAnchor={displayedEntries.length > 5 ? 'end' : 'middle'}
                  height={displayedEntries.length > 5 ? 52 : 30}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#57534e' }}
                  axisLine={false}
                  tickLine={false}
                  unit="h"
                />
                <Tooltip
                  cursor={{ fill: '#f5f5f4', opacity: 0.6 }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const entry = payload[0]?.payload as SubtaskTimeHistogramEntry;
                    if (!entry) return null;
                    return (
                      <div className="bg-stone-900 text-white p-3 rounded-2xl shadow-xl text-xs max-w-xs space-y-1.5 border border-stone-800">
                        <div className="font-bold text-white leading-snug">{entry.title}</div>
                        {entry.parentTaskTitle && (
                          <div className="text-[11px] text-stone-300 leading-snug">
                            Mission : {entry.parentTaskTitle}
                          </div>
                        )}
                        {showAssigneeInTooltip && (
                          <div className="text-[11px] text-emerald-300 font-medium">
                            Assignée à : {entry.assignee}
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 border-t border-stone-800 text-[11px] tabular-nums">
                          {entry.dateLabel && (
                            <>
                              <span className="text-stone-400">Date / Échéance :</span>
                              <span className="font-mono text-stone-200 text-right">{entry.dateLabel}</span>
                            </>
                          )}
                          <span className="text-stone-400">Temps passé :</span>
                          <span className="font-bold text-emerald-400 text-right">{entry.effectiveHours}h</span>
                          <span className="text-stone-400">Temps pointé :</span>
                          <span className="font-semibold text-stone-200 text-right">{entry.actualHours}h</span>
                          <span className="text-stone-400">Charge estimée :</span>
                          <span className="font-semibold text-stone-300 text-right">{entry.estimatedHours}h</span>
                          <span className="text-stone-400">Avancement :</span>
                          <span className="font-semibold text-amber-300 text-right">{entry.progress}%</span>
                          <span className="text-stone-400">Statut :</span>
                          <span className="text-right text-stone-200">
                            {STATUS_LABELS[entry.status] || entry.status}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="effectiveHours"
                  name="Temps passé (h)"
                  radius={[6, 6, 0, 0]}
                  cursor={onSelectTask ? 'pointer' : 'default'}
                  onClick={(data: any) => {
                    if (onSelectTask && data?.payload) {
                      onSelectTask(data.payload as SubtaskTimeHistogramEntry);
                    }
                  }}
                >
                  {displayedEntries.map((entry, idx) => (
                    <Cell
                      key={entry.entryId}
                      fill={idx === 0 ? '#164E4B' : '#2A7B76'}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="estimatedHours"
                  name="Charge estimée (h)"
                  fill="#d6d3d1"
                  radius={[6, 6, 0, 0]}
                  cursor={onSelectTask ? 'pointer' : 'default'}
                  onClick={(data: any) => {
                    if (onSelectTask && data?.payload) {
                      onSelectTask(data.payload as SubtaskTimeHistogramEntry);
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayedEntries.map((entry, index) => {
            const barWidth = Math.max(
              4,
              Math.min(100, Math.round((entry.effectiveHours / summary.maxScale) * 100))
            );
            const estWidth = Math.max(
              4,
              Math.min(100, Math.round((entry.estimatedHours / summary.maxScale) * 100))
            );

            return (
              <div
                key={entry.entryId}
                onClick={() => onSelectTask?.(entry)}
                className={`p-3.5 rounded-2xl border border-stone-200/90 bg-stone-50/50 space-y-2 transition ${
                  onSelectTask ? 'cursor-pointer hover:border-[#2A7B76] hover:bg-emerald-50/20' : ''
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-[11px] text-stone-500 w-6 shrink-0 tabular-nums">
                        #{index + 1}
                      </span>
                      <span className="font-bold text-stone-900 truncate">{entry.title}</span>
                      {showAssigneeInTooltip && (
                        <span className="text-[11px] text-stone-500 hidden sm:inline shrink-0">
                          · {entry.assignee}
                        </span>
                      )}
                    </div>
                    {(entry.parentTaskTitle || entry.dateLabel) && (
                      <div className="pl-8 text-[11px] text-stone-500 truncate">
                        {entry.parentTaskTitle ? `↳ ${entry.parentTaskTitle}` : ''}
                        {entry.parentTaskTitle && entry.dateLabel ? ' · ' : ''}
                        {entry.dateLabel ? <span className="font-mono">{entry.dateLabel}</span> : null}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 tabular-nums text-[11px] shrink-0">
                    <span className="text-stone-500">
                      {STATUS_LABELS[entry.status] || entry.status} ({entry.progress}%)
                    </span>
                    <span className="font-bold text-[#2A7B76]">
                      {entry.effectiveHours}h passées
                    </span>
                    <span className="text-stone-400">/ {entry.estimatedHours}h est.</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="w-full h-2 bg-stone-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2A7B76] rounded-full transition-all duration-300"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className="w-full h-1 bg-stone-200/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-stone-400 rounded-full transition-all duration-300"
                      style={{ width: `${estWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TaskTimeSpentHistogram;
