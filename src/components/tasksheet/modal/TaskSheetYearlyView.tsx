import React from 'react';
import { YearlyTaskSheetData } from '../../../services/taskSheetService';

interface TaskSheetYearlyViewProps {
  yearlyData: YearlyTaskSheetData;
}

export const TaskSheetYearlyView: React.FC<TaskSheetYearlyViewProps> = ({ yearlyData }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 border border-stone-200 rounded-2xl bg-white overflow-hidden">
        <div className="p-3.5">
          <span className="text-[11px] text-stone-500 font-semibold block">Présences Annuelles</span>
          <strong className="block text-xl font-bold font-serif text-[#164e4b] mt-0.5 tabular-nums">
            {yearlyData.totalDaysPresent}j / {yearlyData.totalWorkingDays}j
          </strong>
          {yearlyData.totalWeekendDaysWorked > 0 && (
            <span className="text-[11px] text-amber-700 font-semibold tabular-nums">
              dont +{yearlyData.totalWeekendDaysWorked}j WE
            </span>
          )}
        </div>
        <div className="p-3.5">
          <span className="text-[11px] text-stone-500 font-semibold block">Volume Horaire</span>
          <strong className="block text-xl font-bold font-serif text-stone-900 mt-0.5 tabular-nums">
            {yearlyData.totalHoursWorked}h
          </strong>
        </div>
        <div className="p-3.5">
          <span className="text-[11px] text-stone-500 font-semibold block">Tâches Achevées</span>
          <strong className="block text-xl font-bold font-serif text-[#2A7B76] mt-0.5 tabular-nums">
            {yearlyData.totalTasksCompleted}
          </strong>
        </div>
        <div className="p-3.5">
          <span className="text-[11px] text-stone-500 font-semibold block">Taux Réussite Moyen</span>
          <strong className="block text-xl font-bold font-serif text-emerald-700 mt-0.5 tabular-nums">
            {yearlyData.avgCompletionRate}%
          </strong>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white">
        <table className="w-full text-left text-xs tabular-nums">
          <thead className="bg-[#164e4b] text-white font-bold text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Mois</th>
              <th className="py-2.5 px-3 text-center">Jours Travaillés</th>
              <th className="py-2.5 px-3 text-right">Heures Cumulées</th>
              <th className="py-2.5 px-3 text-center">Tâches Réalisées</th>
              <th className="py-2.5 px-3 text-right">Taux de Rendement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium">
            {yearlyData.monthlyBreakdown.map((m, idx) => (
              <tr key={idx} className="hover:bg-stone-50/70">
                <td className="py-2.5 px-3 font-bold text-stone-900">{m.monthName}</td>
                <td className="py-2.5 px-3 text-center font-mono text-stone-700">
                  {m.daysWorked}j / {m.workingDays}j
                  {m.weekendDaysWorked > 0 ? (
                    <span className="ml-1 text-[10px] font-bold text-amber-700">(+{m.weekendDaysWorked} WE)</span>
                  ) : null}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">{m.hoursWorked}h</td>
                <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">{m.tasksCompleted}</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-[#164e4b]">{m.rendementRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
