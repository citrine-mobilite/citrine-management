import React from 'react';
import { ArrowLeft, CheckSquare, Clock, Trophy, ShieldCheck, Calendar, FileSpreadsheet } from 'lucide-react';
import { Employee } from '../../../../types';
import { EmployeeRendementMetrics, safeNum } from '../../../../utils/rendementTaskHelpers';
import { HumaanTeamCelebration } from '../../../illustrations/HumaanIllustrations';

interface EmployeeRendementHeaderProps {
  employee: Employee;
  assiduiteRate: number;
  metrics: EmployeeRendementMetrics;
  onBack: () => void;
  onOpenTaskSheet: (mode: 'day' | 'month' | 'year') => void;
}

export const EmployeeRendementHeader: React.FC<EmployeeRendementHeaderProps> = ({
  employee,
  assiduiteRate,
  metrics,
  onBack,
  onOpenTaskSheet,
}) => {
  const safeAssiduite = safeNum(assiduiteRate, 100);
  const subtaskPct =
    metrics.totalSubtasks > 0
      ? Math.round((safeNum(metrics.completedSubtasks) / safeNum(metrics.totalSubtasks, 1)) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-[#2A7B76] hover:text-white text-stone-700 rounded-xl font-bold text-xs transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour aux Statistiques</span>
        </button>

        <span className="text-xs font-medium text-stone-500 bg-stone-100 px-3 py-1 rounded-xl">
          Fiche Rendement &amp; Temps Passé
        </span>
      </div>

      <div className="bg-gradient-to-r from-[#2A7B76] via-[#20635F] to-emerald-950 rounded-3xl p-6 text-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-bold font-serif text-2xl shrink-0">
            {employee.name.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif font-bold text-xl md:text-2xl">{employee.name}</h2>
              {metrics.milestonesCount > 0 && (
                <span className="bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded-md text-[10px] inline-flex items-center gap-1 tabular-nums">
                  <Trophy className="h-3 w-3" />
                  {metrics.completedMilestones}/{metrics.milestonesCount} jalons
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-100/95">
              {employee.department || 'Général'} · {employee.position || employee.roleType || 'Collaborateur'} · {employee.email}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="hidden xl:block opacity-90 mr-2">
            <HumaanTeamCelebration className="w-24 h-16" />
          </div>
          <span className="text-[11px] font-semibold text-emerald-100 flex items-center gap-1.5 mr-1">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            TaskSheet :
          </span>
          <button
            type="button"
            onClick={() => onOpenTaskSheet('day')}
            className="px-3 py-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5 text-emerald-200" />
            <span>Jour</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenTaskSheet('month')}
            className="px-3 py-2 bg-white text-[#2A7B76] hover:bg-emerald-50 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Mois</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenTaskSheet('year')}
            className="px-3 py-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Trophy className="h-3.5 w-3.5 text-amber-300" />
            <span>Année</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-500">Score Combiné RH</span>
          <div className="flex items-center gap-2 mt-1">
            <Trophy className="h-5 w-5 text-amber-600" />
            <span className="font-serif font-bold text-xl text-stone-900 tabular-nums">
              {safeNum(metrics.globalCombinedScore)}%
            </span>
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block tabular-nums">
            50% Assiduité + 50% Rendement
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-500">Assiduité Pointage</span>
          <div className="flex items-center gap-2 mt-1">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span className="font-serif font-bold text-xl text-stone-900 tabular-nums">
              {safeAssiduite}%
            </span>
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">Présence &amp; ponctualité</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-500">Rendement Dynamique</span>
          <div className="flex items-center gap-2 mt-1">
            <CheckSquare className="h-5 w-5 text-[#2A7B76]" />
            <span className="font-serif font-bold text-xl text-stone-900 tabular-nums">
              {safeNum(metrics.taskRendementRate)}%
            </span>
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block tabular-nums">
            {safeNum(metrics.completedTasks)}/{safeNum(metrics.totalTasks)} tâches · {safeNum(metrics.inProgressTasks)} en cours · {safeNum(metrics.blockedTasks)} bloq.
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-500">Temps Passé &amp; Sous-tâches</span>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="font-serif font-bold text-xl text-stone-900 tabular-nums">
              {safeNum(metrics.effectiveHoursSpent)}h / {safeNum(metrics.estimatedHoursTotal)}h
            </span>
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block tabular-nums">
            {safeNum(metrics.completedSubtasks)}/{safeNum(metrics.totalSubtasks)} sous-tâches ({subtaskPct}%)
          </span>
        </div>
      </div>
    </div>
  );
};
