import React from 'react';
import { Bell } from 'lucide-react';
import { YearlyTaskSheetData } from '../../../services/taskSheetService';

interface TaskSheetYearlyViewProps {
  yearlyData: YearlyTaskSheetData;
}

export const TaskSheetYearlyView: React.FC<TaskSheetYearlyViewProps> = ({ yearlyData }) => {
  const ptsSummary = yearlyData.importantPointsSummary || {
    totalPoints: yearlyData.remindersSummary?.totalOccurrences ?? 0,
    alertsCount: 0,
    remindersCount: yearlyData.remindersSummary?.totalOccurrences ?? 0,
    movementsCount: 0,
    resolvedCount: yearlyData.remindersSummary?.resolvedCount ?? 0,
    overdueCount: yearlyData.remindersSummary?.overdueCount ?? 0,
    totalMinutes: Math.round((yearlyData.remindersSummary?.totalHours ?? 0) * 60),
    totalHours: yearlyData.remindersSummary?.totalHours ?? 0,
    recentItems: [],
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 border border-stone-200 rounded-2xl bg-white overflow-hidden">
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
          <span className="text-[11px] text-stone-500 font-semibold block">Jalons &amp; Pt. Imp.</span>
          <strong className="block text-xl font-bold font-serif text-amber-700 mt-0.5 tabular-nums">
            {yearlyData.milestonesSummary?.completed ?? 0}/{yearlyData.milestonesSummary?.total ?? 0} jalons
          </strong>
          <span className="text-[11px] text-stone-500 tabular-nums">
            {ptsSummary.totalPoints} pt(s) imp. ({ptsSummary.totalHours}h)
          </span>
        </div>
        <div className="p-3.5">
          <span className="text-[11px] text-stone-500 font-semibold block">Taux Réussite Moyen</span>
          <strong className="block text-xl font-bold font-serif text-emerald-700 mt-0.5 tabular-nums">
            {yearlyData.avgCompletionRate}%
          </strong>
        </div>
      </div>

      {ptsSummary.totalPoints > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-amber-950 inline-flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-amber-700" />
            Points Importants {yearlyData.year} (Hors tâches) :
          </span>
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-amber-900 tabular-nums">
            <span>{ptsSummary.alertsCount} alerte(s)</span>
            <span>· {ptsSummary.remindersCount} rappel(s)</span>
            <span>· {ptsSummary.movementsCount} petit(s) mouv.</span>
            <span className="font-bold">Total : {ptsSummary.totalPoints} ({ptsSummary.totalHours}h)</span>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white">
        <table className="w-full text-left text-xs tabular-nums">
          <thead className="bg-[#164e4b] text-white font-bold text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Mois</th>
              <th className="py-2.5 px-3 text-center">Jours Travaillés</th>
              <th className="py-2.5 px-3 text-right">Heures Cumulées</th>
              <th className="py-2.5 px-3 text-center">Tâches Réalisées</th>
              <th className="py-2.5 px-3 text-center">Pt. Imp.</th>
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
                <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700">
                  {m.importantPointsCount ?? m.remindersCount ?? 0}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-[#164e4b]">{m.rendementRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
