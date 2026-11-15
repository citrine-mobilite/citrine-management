import React from 'react';
import { CheckSquare, Trophy, ArrowRight, Eye, FileSpreadsheet } from 'lucide-react';
import { Employee } from '../../../../types';
import { EmployeeRendementMetrics } from '../../../../utils/rendementCalculator';
import EmployeeRendementHistogram from '../EmployeeRendementHistogram';
import { PresenceStatisticsRendementKpis } from './PresenceStatisticsRendementKpis';

interface PresenceStatisticsRendementTabProps {
  filteredMetricsList: EmployeeRendementMetrics[];
  dynamicTeamRate: number;
  totalSubtasksCount: number;
  completedSubtasksCount: number;
  totalAssignedTasksPeriod: number;
  totalCompletedTasksPeriod: number;
  totalInProgressTasksPeriod: number;
  totalMilestonesPeriod: number;
  onSelectRendementEmployee: (emp: Employee) => void;
  onOpenTaskSheetModal: (emp: Employee, mode: 'day' | 'month' | 'year') => void;
  onSelectEmployee?: (id: string) => void;
}

export const PresenceStatisticsRendementTab: React.FC<PresenceStatisticsRendementTabProps> = ({
  filteredMetricsList,
  dynamicTeamRate,
  totalSubtasksCount,
  completedSubtasksCount,
  totalAssignedTasksPeriod,
  totalCompletedTasksPeriod,
  totalInProgressTasksPeriod,
  totalMilestonesPeriod,
  onSelectRendementEmployee,
  onOpenTaskSheetModal,
  onSelectEmployee,
}) => {
  return (
    <div className="space-y-6">
      <PresenceStatisticsRendementKpis
        totalAssignedTasksPeriod={totalAssignedTasksPeriod}
        totalMilestonesPeriod={totalMilestonesPeriod}
        totalCompletedTasksPeriod={totalCompletedTasksPeriod}
        totalInProgressTasksPeriod={totalInProgressTasksPeriod}
        completedSubtasksCount={completedSubtasksCount}
        totalSubtasksCount={totalSubtasksCount}
        dynamicTeamRate={dynamicTeamRate}
      />

      <EmployeeRendementHistogram
        metricsList={filteredMetricsList}
        onSelectEmployee={onSelectRendementEmployee}
        onOpenTaskSheet={onOpenTaskSheetModal}
      />

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-stone-50/50">
          <h3 className="font-serif font-bold text-xs text-stone-900 flex items-center gap-1.5">
            <CheckSquare className="h-4 w-4 text-[#2A7B76]" />
            Rendement des Tâches & Assiduité par Collaborateur ({filteredMetricsList.length})
          </h3>
          <span className="text-[11px] text-stone-500 italic">
            Cliquez sur une ligne pour ouvrir la fiche de détail ou générer la TaskSheet.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 uppercase font-bold text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Collaborateur</th>
                <th className="py-3 px-4">Département</th>
                <th className="py-3 px-4 text-center">Score Assiduité</th>
                <th className="py-3 px-4 text-center">Tâches & Sous-tâches</th>
                <th className="py-3 px-4 text-center">Rendement Dynamique</th>
                <th className="py-3 px-4 text-center">Score Combiné RH</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredMetricsList.map((m) => (
                <tr
                  key={m.employee.id}
                  onClick={() => onSelectRendementEmployee(m.employee)}
                  className="hover:bg-emerald-50/40 transition cursor-pointer group"
                  title="Cliquer pour ouvrir la page dédiée de rendement et de temps passé"
                >
                  <td className="py-3 px-4 font-bold text-stone-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#2A7B76]/10 text-[#2A7B76] font-bold flex items-center justify-center text-xs shrink-0 group-hover:bg-[#2A7B76] group-hover:text-white transition">
                      {m.employee.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <span className="truncate block">{m.employee.name}</span>
                      {m.milestonesCount > 0 && (
                        <span className="text-[9px] text-amber-700 font-bold flex items-center gap-0.5">
                          <Trophy className="h-2.5 w-2.5" />
                          {m.completedMilestones}/{m.milestonesCount} jalons
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-stone-600">{m.employee.department || 'Général'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {m.assiduiteRate}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-medium text-stone-700">
                    {m.hasActivity ? (
                      <div>
                        <span>{m.completedTasks} / {m.totalTasks} tâches</span>
                        <span className="text-[10px] text-stone-400 block">
                          ({m.completedSubtasks}/{m.totalSubtasks} sous-tâches)
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex flex-col items-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          N&apos;a rien fait
                        </span>
                        <span className="text-[9px] text-stone-400 mt-0.5">Aucune activité</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {m.hasActivity ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 bg-stone-100 h-2 rounded-full overflow-hidden border border-stone-200/50">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              m.taskRendementRate >= 80
                                ? 'bg-emerald-500'
                                : m.taskRendementRate >= 50
                                ? 'bg-[#2A7B76]'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.max(m.taskRendementRate, 4)}%` }}
                          />
                        </div>
                        <span className="font-bold text-stone-800 font-mono text-[11px]">{m.taskRendementRate}%</span>
                      </div>
                    ) : (
                      <span className="font-bold text-rose-600 font-mono text-[11px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        0%
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-extrabold ${
                        m.globalCombinedScore >= 80
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.globalCombinedScore >= 50
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {m.globalCombinedScore}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenTaskSheetModal(m.employee, 'month')}
                        className="px-2 py-1 bg-white hover:bg-emerald-600 hover:text-white text-stone-700 border border-stone-200 hover:border-emerald-600 rounded-lg transition inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer shadow-3xs"
                        title="Générer automatiquement la TaskSheet de ce collaborateur (Jour/Mois/Année)"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5 text-[#2A7B76]" />
                        <span className="hidden lg:inline">TaskSheet</span>
                      </button>
                      <button
                        onClick={() => onSelectRendementEmployee(m.employee)}
                        className="p-1.5 bg-emerald-50 hover:bg-[#2A7B76] hover:text-white text-[#2A7B76] rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                        title="Ouvrir la page de détail du rendement et des sous-tâches"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {onSelectEmployee && (
                        <button
                          onClick={() => onSelectEmployee(m.employee.id)}
                          className="p-1.5 bg-stone-100 hover:bg-[#2A7B76] hover:text-white text-stone-600 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                          title="Voir le profil détaillé du collaborateur"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMetricsList.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-stone-400 italic">
                    Aucun collaborateur trouvé pour cette recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
