import React from 'react';
import { ArrowLeft, CheckSquare, Clock, Trophy, ShieldCheck, FileSpreadsheet, Calendar } from 'lucide-react';
import { Employee } from '../../../../types';
import { HumaanTeamCelebration } from '../../../illustrations/HumaanIllustrations';

interface EmployeeRendementHeaderProps {
  employee: Employee;
  assiduiteRate: number;
  metrics: {
    milestonesCount: number;
    completedMilestones: number;
    globalCombinedScore: number;
    taskRendementRate: number;
    completedTasks: number;
    totalTasks: number;
    completedSubtasks: number;
    totalSubtasks: number;
    estimatedHoursTotal: number;
  };
  onBack: () => void;
  onOpenTimesheet: (mode: 'day' | 'month' | 'year') => void;
}

export const EmployeeRendementHeader: React.FC<EmployeeRendementHeaderProps> = ({
  employee,
  assiduiteRate,
  metrics,
  onBack,
  onOpenTimesheet,
}) => (
  <>
    <div className="flex items-center justify-between">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-[#2A7B76] hover:text-white text-stone-700 rounded-xl font-bold text-xs transition cursor-pointer shadow-3xs"
        title="Retourner aux statistiques et à l'histogramme des collaborateurs"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Retour aux Statistiques</span>
      </button>

      <span className="text-xs font-mono font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-xl">
        Fiche Rendement &amp; Tâches Détaillée
      </span>
    </div>

    <div className="bg-gradient-to-r from-[#2A7B76] via-[#20635F] to-emerald-950 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-bold font-serif text-2xl shrink-0 shadow-inner">
          {employee.name.charAt(0)}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-bold text-xl md:text-2xl">{employee.name}</h2>
            {metrics.milestonesCount > 0 && (
              <span className="bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1 shadow-2xs">
                <Trophy className="h-3 w-3" />
                {metrics.completedMilestones}/{metrics.milestonesCount} jalons
              </span>
            )}
          </div>
          <p className="text-xs text-emerald-100/95">
            {employee.department || 'Général'} • {employee.position || 'Collaborateur'} • {employee.email}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden lg:block opacity-90 drop-shadow-sm">
          <HumaanTeamCelebration className="w-28 h-20" />
        </div>
        <button
          onClick={() => onOpenTimesheet('month')}
          className="px-4 py-2.5 bg-white text-[#2A7B76] hover:bg-emerald-50 rounded-2xl font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-98"
          title="Générer la feuille de tâches synthétique de ce collaborateur (Jour / Mois / Année)"
        >
          <FileSpreadsheet className="h-4 w-4 text-[#2A7B76]" />
          <span>Feuilles de Tâches</span>
        </button>
      </div>
    </div>

    <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-emerald-950 p-4 rounded-3xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-stone-700/60">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-2xl border border-emerald-400/30">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-serif font-bold text-sm text-white flex items-center gap-2">
            Génération de la Feuille de Tâches &amp; Rendement
            <span className="text-[10px] font-sans font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 px-2 py-0.2 rounded-full">
              Synthèse Citrine
            </span>
          </h4>
          <p className="text-xs text-stone-300">
            Synthèse complète entre l'assiduité et le rendement des tâches et sous-tâches selon la durée sélectionnée.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onOpenTimesheet('day')}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
        >
          <Calendar className="h-3.5 w-3.5 text-emerald-300" />
          <span>📅 Jour</span>
        </button>
        <button
          onClick={() => onOpenTimesheet('month')}
          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Calendar className="h-3.5 w-3.5 text-white" />
          <span>🗓️ Mois</span>
        </button>
        <button
          onClick={() => onOpenTimesheet('year')}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
        >
          <Trophy className="h-3.5 w-3.5 text-amber-300" />
          <span>🏆 Année</span>
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-3xs">
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Score Combiné RH</span>
        <div className="flex items-center gap-2 mt-1">
          <Trophy className="h-5 w-5 text-amber-600" />
          <span className="font-serif font-bold text-xl text-stone-900">{metrics.globalCombinedScore}%</span>
        </div>
        <span className="text-[10px] text-stone-400 mt-1 block">50% Assiduité + 50% Rendement</span>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-3xs">
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Assiduité Pointage</span>
        <div className="flex items-center gap-2 mt-1">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <span className="font-serif font-bold text-xl text-stone-900">{assiduiteRate}%</span>
        </div>
        <span className="text-[10px] text-stone-400 mt-1 block">Présence &amp; ponctualité</span>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-3xs">
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Rendement Dynamique</span>
        <div className="flex items-center gap-2 mt-1">
          <CheckSquare className="h-5 w-5 text-[#2A7B76]" />
          <span className="font-serif font-bold text-xl text-stone-900">{metrics.taskRendementRate}%</span>
        </div>
        <span className="text-[10px] text-stone-400 mt-1 block">Calculé sur tâches &amp; sous-tâches</span>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-3xs">
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Tâches &amp; Sous-tâches</span>
        <div className="flex items-center gap-2 mt-1">
          <Clock className="h-5 w-5 text-blue-600" />
          <span className="font-serif font-bold text-xl text-stone-900">
            {metrics.completedTasks}/{metrics.totalTasks}
          </span>
        </div>
        <span className="text-[10px] text-stone-400 mt-1 block">
          {metrics.completedSubtasks}/{metrics.totalSubtasks} sous-tâches ({metrics.estimatedHoursTotal}h)
        </span>
      </div>
    </div>
  </>
);
