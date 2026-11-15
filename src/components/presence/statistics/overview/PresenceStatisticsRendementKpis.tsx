import React from 'react';
import { CheckSquare, Trophy, Clock, CalendarCheck2 } from 'lucide-react';

interface PresenceStatisticsRendementKpisProps {
  totalAssignedTasksPeriod: number;
  totalMilestonesPeriod: number;
  totalCompletedTasksPeriod: number;
  totalInProgressTasksPeriod: number;
  completedSubtasksCount: number;
  totalSubtasksCount: number;
  dynamicTeamRate: number;
}

export const PresenceStatisticsRendementKpis: React.FC<PresenceStatisticsRendementKpisProps> = ({
  totalAssignedTasksPeriod,
  totalMilestonesPeriod,
  totalCompletedTasksPeriod,
  totalInProgressTasksPeriod,
  completedSubtasksCount,
  totalSubtasksCount,
  dynamicTeamRate,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-4">
        <div className="p-3 bg-emerald-50 text-[#2A7B76] rounded-2xl border border-emerald-100">
          <CheckSquare className="h-6 w-6" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Tâches sur la Période</span>
          <h3 className="text-xl font-bold font-serif text-stone-900 mt-0.5">{totalAssignedTasksPeriod}</h3>
          <span className="text-[10px] text-stone-400 font-medium">
            Dont {totalMilestonesPeriod} jalon(s) stratégique(s)
          </span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100">
          <CalendarCheck2 className="h-6 w-6" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Tâches Clôturées</span>
          <h3 className="text-xl font-bold font-serif text-stone-900 mt-0.5">
            {totalCompletedTasksPeriod} / {totalAssignedTasksPeriod}
          </h3>
          <span className="text-[10px] text-stone-400 font-medium">
            {totalInProgressTasksPeriod} en cours sur la période
          </span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-4">
        <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl border border-purple-100">
          <Clock className="h-6 w-6" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Sous-Tâches Détaillées</span>
          <h3 className="text-xl font-bold font-serif text-stone-900 mt-0.5">
            {completedSubtasksCount} / {totalSubtasksCount}
          </h3>
          <span className="text-[10px] text-stone-400 font-medium">
            {totalSubtasksCount > 0 ? Math.round((completedSubtasksCount / totalSubtasksCount) * 100) : 0}% de sous-tâches faites
          </span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-4">
        <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100">
          <Trophy className="h-6 w-6" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Rendement Global Équipe</span>
          <h3 className="text-xl font-bold font-serif text-stone-900 mt-0.5">
            <span>{dynamicTeamRate}%</span>
          </h3>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded-md">
            Calcul dynamique continu
          </span>
        </div>
      </div>
    </div>
  );
};
