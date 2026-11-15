import React from 'react';
import { YearlyTaskSheetData } from '../../../services/taskSheetService';

interface TaskSheetYearlyViewProps {
  yearlyData: YearlyTaskSheetData;
}

export const TaskSheetYearlyView: React.FC<TaskSheetYearlyViewProps> = ({ yearlyData }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
          <span className="text-[10px] text-stone-400 font-bold uppercase">Présences Annuelles</span>
          <strong className="block text-xl font-bold font-serif text-[#164e4b] mt-0.5">
            {yearlyData.totalDaysPresent} jours
          </strong>
        </div>
        <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
          <span className="text-[10px] text-stone-400 font-bold uppercase">Volume Horaire</span>
          <strong className="block text-xl font-bold font-serif text-indigo-700 mt-0.5">
            {yearlyData.totalHoursWorked}h
          </strong>
        </div>
        <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
          <span className="text-[10px] text-stone-400 font-bold uppercase">Taux Réussite Moyen</span>
          <strong className="block text-xl font-bold font-serif text-emerald-700 mt-0.5">
            {yearlyData.avgCompletionRate}%
          </strong>
        </div>
      </div>

      <div className="rounded-xl border border-stone-300 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#164e4b] text-white font-bold text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Mois</th>
              <th className="py-2.5 px-3 text-center">Jours Travaillés</th>
              <th className="py-2.5 px-3 text-right">Heures Cumulées</th>
              <th className="py-2.5 px-3 text-center">Tâches Réalisées</th>
              <th className="py-2.5 px-3 text-center">Taux de Rendement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 font-medium">
            {yearlyData.monthlyBreakdown.map((m, idx) => (
              <tr key={idx} className="hover:bg-stone-50">
                <td className="py-2 px-3 font-bold text-stone-800">{m.monthName}</td>
                <td className="py-2 px-3 text-center font-mono">{m.daysWorked} j</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700">{m.hoursWorked}h</td>
                <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700">{m.tasksCompleted}</td>
                <td className="py-2 px-3 text-center font-mono font-bold">{m.rendementRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
