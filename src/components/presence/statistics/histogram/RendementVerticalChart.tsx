import React from 'react';
import { Trophy } from 'lucide-react';
import { Employee } from '../../../../types';
import { EmployeeRendementMetrics } from '../../../../utils/rendementCalculator';
import { safeNum } from '../../../../utils/rendementTaskHelpers';

interface RendementVerticalChartProps {
  processedList: EmployeeRendementMetrics[];
  teamAvgRate: number;
  hoveredMetric: EmployeeRendementMetrics | null;
  setHoveredMetric: (m: EmployeeRendementMetrics | null) => void;
  onSelectEmployee: (employee: Employee) => void;
  getBarColor: (rate: number) => string;
  getBarBg: (rate: number) => string;
}

export const RendementVerticalChart: React.FC<RendementVerticalChartProps> = ({
  processedList,
  teamAvgRate,
  hoveredMetric,
  setHoveredMetric,
  onSelectEmployee,
  getBarColor,
  getBarBg,
}) => {
  const safeAvgRate = safeNum(teamAvgRate);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-stone-500 text-[11px]">
          Cliquez sur un bâton pour ouvrir la fiche détaillée de rendement et l&apos;histogramme de temps par tâche.
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-600">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-emerald-500 to-teal-600" />
            <span>Excellent (≥ 80%)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-[#2A7B76] to-teal-700" />
            <span>Satisfaisant (50% - 79%)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-amber-400 to-amber-600" />
            <span>En progression (&lt; 50%)</span>
          </span>
          <span className="flex items-center gap-1.5 tabular-nums">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-emerald-500" />
            <span>Moyenne Équipe ({safeAvgRate}%)</span>
          </span>
        </div>
      </div>

      {processedList.length === 0 ? (
        <div className="text-center py-16 text-stone-400 italic text-xs">
          Aucun collaborateur trouvé pour ce filtre.
        </div>
      ) : (
        <div className="relative pt-6 pb-2 pl-6">
          <div className="relative h-64 border-b border-stone-200">
            {[100, 75, 50, 25, 0].map((level) => (
              <div
                key={level}
                className="absolute w-full flex items-center border-b border-stone-100"
                style={{ bottom: `${level}%` }}
              >
                <span className="absolute -left-8 text-[10px] font-mono text-stone-400 font-medium tabular-nums">
                  {level}%
                </span>
              </div>
            ))}

            {safeAvgRate > 0 && (
              <div
                className="absolute w-full z-10 pointer-events-none flex items-center"
                style={{ bottom: `${safeAvgRate}%` }}
              >
                <div className="w-full border-b-2 border-dashed border-teal-500/60" />
                <span className="absolute right-0 -top-3.5 bg-teal-50 text-[#2A7B76] border border-teal-200 text-[9px] font-bold px-1.5 py-0.5 rounded tabular-nums">
                  Moyenne : {safeAvgRate}%
                </span>
              </div>
            )}

            <div className="h-full flex items-end justify-around gap-2 px-2 overflow-x-auto">
              {processedList.map((m) => {
                const rate = safeNum(m.taskRendementRate);
                const heightPercent = Math.max(rate, 6);
                const isHovered = hoveredMetric?.employee.id === m.employee.id;

                return (
                  <div
                    key={m.employee.id}
                    onMouseEnter={() => setHoveredMetric(m)}
                    onMouseLeave={() => setHoveredMetric(null)}
                    onClick={() => onSelectEmployee(m.employee)}
                    className="flex-1 min-w-[50px] max-w-[80px] h-full flex flex-col justify-end items-center group cursor-pointer relative"
                    title={`Cliquez pour ouvrir la fiche de détail et feuille de tâches de ${m.employee.name}`}
                  >
                    <div className={`mb-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold tabular-nums transition-transform group-hover:scale-105 ${getBarBg(rate)}`}>
                      {rate}%
                    </div>

                    <div className="w-full relative flex items-end justify-center">
                      <div
                        className={`w-full rounded-t-xl bg-gradient-to-t ${getBarColor(rate)} transition-all duration-500 group-hover:brightness-105 border-t border-x`}
                        style={{ height: `${(heightPercent / 100) * 220}px` }}
                      >
                        {m.milestonesCount > 0 && (
                          <div className="w-full flex justify-center pt-1">
                            <span className="bg-amber-400 text-amber-950 rounded-full p-0.5" title={`${m.completedMilestones}/${m.milestonesCount} jalons atteints`}>
                              <Trophy className="h-2.5 w-2.5" />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isHovered && (
                      <div className="absolute bottom-full mb-8 z-30 w-60 bg-stone-900 text-white p-3 rounded-2xl shadow-xl text-left pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                        <div className="font-bold text-xs flex items-center justify-between border-b border-stone-800 pb-1.5 mb-2">
                          <span className="truncate">{m.employee.name}</span>
                          <span className="text-emerald-400 font-mono text-xs tabular-nums">{rate}%</span>
                        </div>
                        <div className="space-y-1 text-[11px] text-stone-300 tabular-nums">
                          <div className="flex justify-between">
                            <span className="text-stone-400">Tâches :</span>
                            <span className="font-mono font-semibold">{safeNum(m.completedTasks)} / {safeNum(m.totalTasks)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-400">Sous-tâches :</span>
                            <span className="font-mono font-semibold">{safeNum(m.completedSubtasks)} / {safeNum(m.totalSubtasks)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-400">Temps passé / Est. :</span>
                            <span className="font-mono font-semibold text-emerald-300">
                              {safeNum(m.effectiveHoursSpent)}h / {safeNum(m.estimatedHoursTotal)}h
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-400">Assiduité :</span>
                            <span className="font-mono font-semibold text-stone-200">{safeNum(m.assiduiteRate, 100)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-400">Score combiné RH :</span>
                            <span className="font-mono font-semibold text-amber-300">{safeNum(m.globalCombinedScore)}%</span>
                          </div>
                        </div>
                        <div className="mt-2 pt-1 border-t border-stone-800 text-[10px] text-stone-400 text-center">
                          Cliquer pour ouvrir la fiche
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-around gap-2 px-2 pt-2 text-center">
            {processedList.map((m) => (
              <div
                key={m.employee.id}
                onClick={() => onSelectEmployee(m.employee)}
                className="flex-1 min-w-[50px] max-w-[80px] flex flex-col items-center group cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-stone-100 group-hover:bg-[#2A7B76] group-hover:text-white text-[#2A7B76] font-bold text-[10px] flex items-center justify-center border border-stone-200 transition">
                  {m.employee.name.charAt(0)}
                </div>
                <span className="text-[10px] font-bold text-stone-700 group-hover:text-[#2A7B76] transition truncate w-full mt-1">
                  {m.employee.name.split(' ')[0]}
                </span>
                <span className="text-[9px] text-stone-500 truncate w-full tabular-nums">
                  {safeNum(m.effectiveHoursSpent)}h / {safeNum(m.estimatedHoursTotal)}h
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
