import React from 'react';
import { Trophy, ArrowRight, Eye, FileSpreadsheet, Users } from 'lucide-react';
import { Employee, Task } from '../../../../types';
import { EmployeeRendementMetrics } from '../../../../utils/rendementCalculator';
import { isTaskAssignedToEmployee, safeNum, SubtaskTimeHistogramEntry } from '../../../../utils/rendementTaskHelpers';
import { EmployeeStatRow } from '../statisticsCalculations';
import EmployeeRendementHistogram from '../EmployeeRendementHistogram';
import { TaskTimeSpentHistogram } from '../TaskTimeSpentHistogram';
import { PresenceStatisticsRendementKpis } from './PresenceStatisticsRendementKpis';

interface PresenceStatisticsRendementTabProps {
  filteredMetricsList: EmployeeRendementMetrics[];
  statRowByEmployeeId: Map<string, EmployeeStatRow>;
  periodTasksForHistogram: Task[];
  dynamicTeamRate: number;
  avgCombinedScorePeriod: number;
  totalSubtasksCount: number;
  completedSubtasksCount: number;
  totalAssignedTasksPeriod: number;
  totalCompletedTasksPeriod: number;
  totalInProgressTasksPeriod: number;
  totalBlockedTasksPeriod: number;
  totalOverdueTasksPeriod: number;
  totalMilestonesPeriod: number;
  totalEffectiveHoursPeriod: number;
  totalEstimatedHoursPeriod: number;
  onSelectRendementEmployee: (emp: Employee) => void;
  onOpenTaskSheetModal: (emp: Employee, mode: 'day' | 'month' | 'year') => void;
  onSelectEmployee?: (id: string) => void;
}

const CAPACITY_LABELS: Record<'overloaded' | 'optimal' | 'available', { text: string; color: string }> = {
  overloaded: { text: 'Surcharge', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  optimal: { text: 'Optimal', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  available: { text: 'Disponible', color: 'text-blue-700 bg-blue-50 border-blue-200' },
};

export const PresenceStatisticsRendementTab: React.FC<PresenceStatisticsRendementTabProps> = ({
  filteredMetricsList,
  statRowByEmployeeId,
  periodTasksForHistogram,
  dynamicTeamRate,
  avgCombinedScorePeriod,
  totalSubtasksCount,
  completedSubtasksCount,
  totalAssignedTasksPeriod,
  totalCompletedTasksPeriod,
  totalInProgressTasksPeriod,
  totalBlockedTasksPeriod,
  totalOverdueTasksPeriod,
  totalMilestonesPeriod,
  totalEffectiveHoursPeriod,
  totalEstimatedHoursPeriod,
  onSelectRendementEmployee,
  onOpenTaskSheetModal,
  onSelectEmployee,
}) => {
  const handleSelectTaskFromHistogram = (entry: SubtaskTimeHistogramEntry) => {
    const matched = filteredMetricsList.find((m) => isTaskAssignedToEmployee(entry.task, m.employee));
    if (matched) {
      onSelectRendementEmployee(matched.employee);
    }
  };

  return (
    <div className="space-y-6">
      <PresenceStatisticsRendementKpis
        totalAssignedTasksPeriod={totalAssignedTasksPeriod}
        totalMilestonesPeriod={totalMilestonesPeriod}
        totalCompletedTasksPeriod={totalCompletedTasksPeriod}
        totalInProgressTasksPeriod={totalInProgressTasksPeriod}
        totalBlockedTasksPeriod={totalBlockedTasksPeriod}
        totalOverdueTasksPeriod={totalOverdueTasksPeriod}
        completedSubtasksCount={completedSubtasksCount}
        totalSubtasksCount={totalSubtasksCount}
        totalEffectiveHoursPeriod={totalEffectiveHoursPeriod}
        totalEstimatedHoursPeriod={totalEstimatedHoursPeriod}
        dynamicTeamRate={dynamicTeamRate}
        avgCombinedScorePeriod={avgCombinedScorePeriod}
      />

      <TaskTimeSpentHistogram
        tasks={periodTasksForHistogram}
        title="Temps Passé par Sous-Tâche (Top Chronophages)"
        maxItems={12}
        showAssigneeInTooltip
        onSelectTask={handleSelectTaskFromHistogram}
      />

      <EmployeeRendementHistogram
        metricsList={filteredMetricsList}
        onSelectEmployee={onSelectRendementEmployee}
        onOpenTaskSheet={onOpenTaskSheetModal}
      />

      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between gap-2 bg-stone-50/50">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#2A7B76]" />
            <h3 className="font-serif font-bold text-sm text-stone-900">
              Détail par Collaborateur ({filteredMetricsList.length})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 uppercase font-bold text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Collaborateur</th>
                <th className="py-3 px-3 text-center">Présence &amp; Assiduité</th>
                <th className="py-3 px-3 text-center">Tâches &amp; Statuts</th>
                <th className="py-3 px-3 text-center">Sous-tâches &amp; Jalons</th>
                <th className="py-3 px-3 text-center">Heures &amp; Tâche #1</th>
                <th className="py-3 px-3 text-center">Rendement</th>
                <th className="py-3 px-3 text-center">Score RH</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 tabular-nums">
              {filteredMetricsList.map((m) => {
                const pRow = statRowByEmployeeId.get(String(m.employee.id));
                const presentDays = pRow ? safeNum(pRow.presentDays) : 0;
                const lateDays = pRow ? safeNum(pRow.lateDays) : 0;
                const absentDays = pRow ? safeNum(pRow.absentDays) : 0;
                const ponctualiteRate = pRow ? safeNum(pRow.ponctualiteRate, 100) : 100;
                const presenceRate = pRow ? safeNum(pRow.presenceRate, 100) : 100;
                const workedHours = pRow ? safeNum(pRow.workedHoursTotal, 0) : 0;
                const subtaskPct =
                  m.totalSubtasks > 0 ? Math.round((m.completedSubtasks / m.totalSubtasks) * 100) : 0;
                const cap = CAPACITY_LABELS[m.capacityStatus];

                return (
                  <tr
                    key={m.employee.id}
                    onClick={() => onSelectRendementEmployee(m.employee)}
                    className="hover:bg-emerald-50/35 transition cursor-pointer group"
                    title="Cliquer pour ouvrir la page dédiée de rendement et de temps passé"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#2A7B76]/10 text-[#2A7B76] font-bold flex items-center justify-center text-xs shrink-0 group-hover:bg-[#2A7B76] group-hover:text-white transition">
                          {m.employee.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-stone-900 truncate block">{m.employee.name}</span>
                          <span className="text-[11px] text-stone-500 block truncate">
                            {m.employee.department || 'Général'} · {m.employee.position || m.employee.roleType || 'Employé'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <div className="font-bold text-stone-900">{safeNum(m.assiduiteRate, 100)}% assiduité</div>
                      <div className="text-[10px] text-stone-500">
                        Prés. {presenceRate}% · Ponct. {ponctualiteRate}%
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {presentDays}p · {lateDays} ret · {absentDays} abs · {workedHours}h point.
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <div className="font-bold text-stone-900">
                        {safeNum(m.completedTasks)} / {safeNum(m.totalTasks)} faites
                      </div>
                      <div className="text-[10px] text-stone-500">
                        {safeNum(m.inProgressTasks)} en cours · {safeNum(m.todoTasks)} à faire
                      </div>
                      <div className="text-[10px]">
                        <span className={m.blockedTasks > 0 ? 'text-rose-600 font-semibold' : 'text-stone-400'}>
                          {safeNum(m.blockedTasks)} bloq.
                        </span>{' '}
                        ·{' '}
                        <span className={m.overdueTasks > 0 ? 'text-amber-700 font-semibold' : 'text-stone-400'}>
                          {safeNum(m.overdueTasks)} retard
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <div className="font-semibold text-stone-800">
                        {safeNum(m.completedSubtasks)} / {safeNum(m.totalSubtasks)} ({subtaskPct}%)
                      </div>
                      {m.milestonesCount > 0 ? (
                        <div className="text-[10px] text-amber-700 font-semibold inline-flex items-center gap-1 mt-0.5">
                          <Trophy className="h-3 w-3" />
                          {m.completedMilestones}/{m.milestonesCount} jalons
                        </div>
                      ) : (
                        <div className="text-[10px] text-stone-400">0 jalon</div>
                      )}
                      <div className="text-[10px] text-stone-400">Prog. moy. {safeNum(m.avgTaskProgress)}%</div>
                    </td>

                    <td className="py-3.5 px-3 text-center max-w-[190px]">
                      <div className="font-bold text-stone-900">
                        {safeNum(m.effectiveHoursSpent)}h / {safeNum(m.estimatedHoursTotal)}h
                      </div>
                      <div className="mt-0.5">
                        <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded border ${cap.color}`}>
                          {cap.text}
                        </span>
                      </div>
                      {m.topTimeTaskTitle && (
                        <div className="text-[10px] text-stone-500 truncate mt-0.5" title={m.topTimeTaskTitle}>
                          #1: {m.topTimeTaskTitle} ({m.topTimeTaskHours}h)
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-bold text-stone-900 text-xs">{safeNum(m.taskRendementRate)}%</span>
                        <div className="w-20 bg-stone-100 h-1.5 rounded-full overflow-hidden border border-stone-200/70">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              m.taskRendementRate >= 80
                                ? 'bg-emerald-500'
                                : m.taskRendementRate >= 50
                                ? 'bg-[#2A7B76]'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.max(safeNum(m.taskRendementRate), 4)}%` }}
                          />
                        </div>
                        {!m.hasActivity && (
                          <span className="text-[10px] text-rose-600 font-semibold">Aucune activité</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-extrabold ${
                          m.globalCombinedScore >= 80
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.globalCombinedScore >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {safeNum(m.globalCombinedScore)}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenTaskSheetModal(m.employee, 'month')}
                          className="px-2 py-1 bg-white hover:bg-emerald-600 hover:text-white text-stone-700 border border-stone-200 hover:border-emerald-600 rounded-lg transition inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                          title="Générer la TaskSheet de ce collaborateur (Jour/Mois/Année)"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5 text-[#2A7B76]" />
                          <span className="hidden xl:inline">TaskSheet</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectRendementEmployee(m.employee)}
                          className="p-1.5 bg-emerald-50 hover:bg-[#2A7B76] hover:text-white text-[#2A7B76] rounded-lg transition inline-flex items-center cursor-pointer"
                          title="Ouvrir la page de détail du rendement et des sous-tâches"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {onSelectEmployee && (
                          <button
                            type="button"
                            onClick={() => onSelectEmployee(m.employee.id)}
                            className="p-1.5 bg-stone-100 hover:bg-[#2A7B76] hover:text-white text-stone-600 rounded-lg transition inline-flex items-center cursor-pointer"
                            title="Voir la fiche complète du collaborateur"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredMetricsList.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-stone-400 italic">
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
