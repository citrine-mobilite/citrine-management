import React from 'react';
import { BarChart3, AlertTriangle } from 'lucide-react';
import { STANDARD_WEEKLY_CAPACITY, WorkloadStatRow } from './rendementAnalyticsUtils';

interface AnalyticsWorkloadTabProps {
  workloadStats: WorkloadStatRow[];
  displayedWorkload: WorkloadStatRow[];
  capacityFilter: 'all' | 'overloaded' | 'available' | 'optimal';
  setCapacityFilter: (f: 'all' | 'overloaded' | 'available' | 'optimal') => void;
  overloadedCount: number;
  optimalCount: number;
  availableCount: number;
}

export const AnalyticsWorkloadTab: React.FC<AnalyticsWorkloadTabProps> = ({
  workloadStats,
  displayedWorkload,
  capacityFilter,
  setCapacityFilter,
  overloadedCount,
  optimalCount,
  availableCount,
}) => {
  return (
    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#2A7B76]" />
            Équilibrage de la Charge de Travail (Workload Capacity)
          </h3>
          <p className="text-xs text-stone-500">
            Visualisation des heures estimées par collaborateur par rapport à la capacité max hebdomadaire (35h).
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setCapacityFilter('all')}
            className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
              capacityFilter === 'all' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Tous ({workloadStats.length})
          </button>
          <button
            onClick={() => setCapacityFilter('overloaded')}
            className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
              capacityFilter === 'overloaded'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            <span>🚨 Surchargés</span>
            <span className="font-mono">({overloadedCount})</span>
          </button>
          <button
            onClick={() => setCapacityFilter('optimal')}
            className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
              capacityFilter === 'optimal'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            <span>🟢 Optimal</span>
            <span className="font-mono">({optimalCount})</span>
          </button>
          <button
            onClick={() => setCapacityFilter('available')}
            className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
              capacityFilter === 'available'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            <span>🔵 Disponible</span>
            <span className="font-mono">({availableCount})</span>
          </button>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        {displayedWorkload.map((row) => {
          const isOverloaded = row.capacityStatus === 'overloaded';
          const isAvailable = row.capacityStatus === 'available';
          const percentage = Math.min(row.saturationPercentage, 160);

          return (
            <div
              key={row.employee.id}
              className={`p-4 rounded-2xl border transition space-y-2.5 ${
                isOverloaded
                  ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                  : isAvailable
                  ? 'bg-blue-50/30 border-blue-100 hover:border-blue-200'
                  : 'bg-stone-50/70 border-stone-200/90 hover:border-stone-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isOverloaded ? 'bg-rose-600 text-white' : 'bg-[#2A7B76] text-white'
                    }`}
                  >
                    {row.employee.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-stone-900 font-bold text-sm">{row.employee.name}</strong>
                      {isOverloaded && (
                        <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Surcharge Risque Retard
                        </span>
                      )}
                      {isAvailable && (
                        <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          Disponible pour nouvelles tâches
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-stone-500">
                      {row.employee.department || 'Général'} • {row.employee.position || 'Collaborateur'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div className="hidden sm:block">
                    <span className="text-[10px] text-stone-400 block">Tâches / Sous-tâches</span>
                    <strong className="text-stone-800 font-mono">
                      {row.totalTasks}T / {row.totalSubtasks}ST
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 block">Charge Hebdo</span>
                    <strong className={`font-mono text-sm ${isOverloaded ? 'text-rose-700' : 'text-[#2A7B76]'}`}>
                      {row.totalHours}h / {STANDARD_WEEKLY_CAPACITY}h
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 block">Rendement Global</span>
                    <strong className="text-emerald-700 font-mono text-sm">{row.completionRate}%</strong>
                  </div>
                </div>
              </div>

              <div className="relative pt-1">
                <div className="w-full bg-stone-200 h-3 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOverloaded
                        ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                        : isAvailable
                        ? 'bg-gradient-to-r from-blue-400 to-cyan-500'
                        : 'bg-gradient-to-r from-emerald-500 to-[#2A7B76]'
                    }`}
                    style={{ width: `${Math.max(percentage, 6)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono pt-1">
                  <span>0h</span>
                  <span className="text-stone-600 font-bold">Capacité normale (35h)</span>
                  <span className={isOverloaded ? 'text-rose-600 font-bold' : ''}>
                    {row.saturationPercentage}% de charge
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {displayedWorkload.length === 0 && (
          <div className="text-center py-12 text-stone-400 italic text-xs">
            Aucun collaborateur ne correspond à ce critère de capacité.
          </div>
        )}
      </div>
    </div>
  );
};
