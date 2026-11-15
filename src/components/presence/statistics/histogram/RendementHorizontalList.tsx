import React from 'react';
import { Trophy, FileSpreadsheet } from 'lucide-react';
import { Employee } from '../../../../types';
import { EmployeeRendementMetrics } from '../../../../utils/rendementCalculator';

interface RendementHorizontalListProps {
  processedList: EmployeeRendementMetrics[];
  maxHours: number;
  onSelectEmployee: (employee: Employee) => void;
  onOpenTimesheet?: (employee: Employee, mode?: 'day' | 'month' | 'year') => void;
  getBarColor: (rate: number) => string;
  getBarBg: (rate: number) => string;
}

export const RendementHorizontalList: React.FC<RendementHorizontalListProps> = ({
  processedList,
  maxHours,
  onSelectEmployee,
  onOpenTimesheet,
  getBarColor,
  getBarBg,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-600 justify-end">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600"></span>
          <span>Rendement Tâches & Sous-tâches (%)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-indigo-500"></span>
          <span>Charge Hebdomadaire (h)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Jalons Stratégiques Liés</span>
        </span>
      </div>

      <div className="space-y-3">
        {processedList.map((m) => {
          const rate = m.taskRendementRate;
          const hoursPercentage = Math.min(Math.round((m.estimatedHoursTotal / maxHours) * 100), 100);

          return (
            <div
              key={m.employee.id}
              className="p-3.5 bg-stone-50/80 hover:bg-emerald-50/30 rounded-2xl border border-stone-200/90 hover:border-[#2A7B76] transition space-y-2 group shadow-2xs hover:shadow-md"
            >
              <div className="flex items-center justify-between text-xs">
                <div
                  onClick={() => onSelectEmployee(m.employee)}
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-white border border-stone-200 text-[#2A7B76] font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs group-hover:bg-[#2A7B76] group-hover:text-white transition">
                    {m.employee.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <strong className="font-bold text-stone-900 group-hover:text-[#2A7B76] transition truncate">
                        {m.employee.name}
                      </strong>
                      {m.milestonesCount > 0 && (
                        <span className="bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded-md text-[9px] font-bold flex items-center gap-0.5">
                          <Trophy className="h-2.5 w-2.5" />
                          {m.completedMilestones}/{m.milestonesCount} jalons
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-500 block truncate">
                      {m.employee.department || 'Général'} • {m.completedTasks}/{m.totalTasks} tâches ({m.completedSubtasks}/{m.totalSubtasks} sous-tâches)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-stone-400 block font-medium">Charge</span>
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg text-xs">
                      {m.estimatedHoursTotal}h
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-stone-400 block font-medium">Rendement</span>
                    <span className={`font-mono font-bold px-2.5 py-0.5 rounded-lg text-xs ${getBarBg(rate)}`}>
                      {rate}%
                    </span>
                  </div>

                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-stone-400 block font-medium">Score Combiné</span>
                    <span className="font-mono font-bold text-stone-800 bg-white border border-stone-200 px-2 py-0.5 rounded-lg text-xs">
                      {m.globalCombinedScore}%
                    </span>
                  </div>

                  {onOpenTimesheet && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTimesheet(m.employee, 'month');
                      }}
                      className="px-2.5 py-1.5 bg-white hover:bg-emerald-600 hover:text-white text-stone-700 border border-stone-200 hover:border-emerald-600 font-bold text-[11px] rounded-xl flex items-center gap-1 shadow-3xs transition cursor-pointer"
                      title="Générer automatiquement la feuille de tâches de ce collaborateur"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-[#2A7B76] group-hover:text-white" />
                      <span className="hidden md:inline">Feuille de Tâches</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 pt-0.5">
                <div className="w-full bg-stone-200/80 h-3 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${getBarColor(rate)} transition-all duration-500`}
                    style={{ width: `${Math.max(rate, 4)}%` }}
                  />
                </div>

                <div className="w-full bg-stone-200/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                    style={{ width: `${Math.max(hoursPercentage, 4)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
