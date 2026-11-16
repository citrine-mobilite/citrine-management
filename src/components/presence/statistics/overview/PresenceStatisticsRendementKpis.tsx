import React from 'react';
import { CheckSquare, Trophy, Clock, CalendarCheck2 } from 'lucide-react';
import { safeNum } from '../../../../utils/rendementTaskHelpers';

interface PresenceStatisticsRendementKpisProps {
  totalAssignedTasksPeriod: number;
  totalMilestonesPeriod: number;
  totalCompletedTasksPeriod: number;
  totalInProgressTasksPeriod: number;
  totalBlockedTasksPeriod: number;
  totalOverdueTasksPeriod: number;
  completedSubtasksCount: number;
  totalSubtasksCount: number;
  totalEffectiveHoursPeriod: number;
  totalEstimatedHoursPeriod: number;
  dynamicTeamRate: number;
  avgCombinedScorePeriod: number;
}

export const PresenceStatisticsRendementKpis: React.FC<PresenceStatisticsRendementKpisProps> = ({
  totalAssignedTasksPeriod,
  totalMilestonesPeriod,
  totalCompletedTasksPeriod,
  totalInProgressTasksPeriod,
  totalBlockedTasksPeriod,
  totalOverdueTasksPeriod,
  completedSubtasksCount,
  totalSubtasksCount,
  totalEffectiveHoursPeriod,
  totalEstimatedHoursPeriod,
  dynamicTeamRate,
  avgCombinedScorePeriod,
}) => {
  const safeTotalTasks = safeNum(totalAssignedTasksPeriod);
  const safeDoneTasks = safeNum(totalCompletedTasksPeriod);
  const safeTotalSub = safeNum(totalSubtasksCount);
  const safeDoneSub = safeNum(completedSubtasksCount);
  const subtaskRate = safeTotalSub > 0 ? Math.round((safeDoneSub / safeTotalSub) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex items-center gap-4">
        <div className="p-3 bg-emerald-50 text-[#2A7B76] rounded-2xl border border-emerald-100 shrink-0">
          <CheckSquare className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-semibold text-stone-500 block">
            Tâches sur la Période
          </span>
          <h3 className="text-xl font-bold font-serif text-stone-900 mt-0.5 tabular-nums">
            {safeTotalTasks}
          </h3>
          <span className="text-[11px] text-stone-500 font-medium tabular-nums">
            {safeNum(totalMilestonesPeriod)} jalon(s) · {safeNum(totalOverdueTasksPeriod)} en retard
          </span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 shrink-0">
          <CalendarCheck2 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-semibold text-stone-500 block">
            Avancement Tâches
          </span>
          <h3 className="text-xl font-bold font-serif text-stone-900 mt-0.5 tabular-nums">
            {safeDoneTasks} / {safeTotalTasks}
          </h3>
          <span className="text-[11px] text-stone-500 font-medium tabular-nums">
            {safeNum(totalInProgressTasksPeriod)} en cours · {safeNum(totalBlockedTasksPeriod)} bloquée(s)
          </span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex items-center gap-4">
        <div className="p-3 bg-stone-100 text-stone-700 rounded-2xl border border-stone-200 shrink-0">
          <Clock className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-semibold text-stone-500 block">
            Heures &amp; Sous-tâches
          </span>
          <h3 className="text-xl font-bold font-serif text-stone-900 mt-0.5 tabular-nums">
            {safeNum(totalEffectiveHoursPeriod)}h / {safeNum(totalEstimatedHoursPeriod)}h
          </h3>
          <span className="text-[11px] text-stone-500 font-medium tabular-nums">
            {safeDoneSub}/{safeTotalSub} sous-tâches ({subtaskRate}%)
          </span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex items-center gap-4">
        <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 shrink-0">
          <Trophy className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-semibold text-stone-500 block">
            Rendement &amp; Score RH
          </span>
          <h3 className="text-xl font-bold font-serif text-[#2A7B76] mt-0.5 tabular-nums">
            {safeNum(dynamicTeamRate)}%
          </h3>
          <span className="text-[11px] text-stone-500 font-medium tabular-nums">
            Score combiné moyen : <strong className="text-stone-800">{safeNum(avgCombinedScorePeriod)}%</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
