import React from 'react';
import {
  Trophy,
  CheckSquare,
  BarChart3,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Layers,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { TaskProject } from '../../../types';
import { STANDARD_WEEKLY_CAPACITY } from './rendementAnalyticsUtils';

interface AnalyticsBannerAndKpisProps {
  isRestricted: boolean;
  globalCompletionRate: number;
  overloadedCount: number;
  activeTab: 'workload' | 'milestones' | 'velocity';
  setActiveTab: (tab: 'workload' | 'milestones' | 'velocity') => void;
  milestonesCount: number;
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  projects: TaskProject[];
  totalTasks: number;
  completedTasks: number;
  totalSubtasks: number;
  completedSubtasks: number;
  onTimeRate: number;
  subtasksCompletionRate: number;
  avgMilestoneProgress: number;
  completedMilestones: number;
}

export const AnalyticsBannerAndKpis: React.FC<AnalyticsBannerAndKpisProps> = ({
  isRestricted,
  globalCompletionRate,
  overloadedCount,
  activeTab,
  setActiveTab,
  milestonesCount,
  selectedProjectId,
  setSelectedProjectId,
  projects,
  totalTasks,
  completedTasks,
  totalSubtasks,
  completedSubtasks,
  onTimeRate,
  subtasksCompletionRate,
  avgMilestoneProgress,
  completedMilestones,
}) => {
  return (
    <>
      <div className="bg-gradient-to-r from-indigo-950 via-[#2A7B76] to-emerald-950 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-white/5 blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
              <Flame className="h-6 w-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Asana Paid Tier • Portefeuille & Capacité
                </span>
                <span className="text-[10px] text-emerald-200 font-mono">
                  Base standard : {STANDARD_WEEKLY_CAPACITY}h / semaine
                </span>
              </div>
              <h2 className="font-serif font-bold text-xl md:text-2xl text-white mt-1">
                {isRestricted
                  ? 'Mon Rendement & Ma Charge de Travail'
                  : 'Pilotage Avancé du Rendement & Équilibrage des Capacités'}
              </h2>
            </div>
          </div>
          <p className="text-xs text-indigo-100/90 pl-1 max-w-3xl leading-relaxed">
            {isRestricted
              ? 'Suivi personnel de votre charge horaire, accomplissement de vos tâches et progression de vos sous-tâches.'
              : 'Surveillance de la vélocité opérationnelle, répartition de la charge (Workload Balancing), décomposition fine des sous-tâches et progression des jalons stratégiques.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 z-10">
          <div className="flex items-center gap-2.5 bg-black/25 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <div>
              <span className="text-[10px] text-emerald-200 block font-medium">Santé Globale des Tâches</span>
              <strong className="text-white text-sm font-mono">{globalCompletionRate}% terminées</strong>
            </div>
          </div>
          {overloadedCount > 0 && (
            <div className="flex items-center gap-2 bg-rose-500/20 backdrop-blur-md px-4 py-1.5 rounded-2xl border border-rose-400/30 text-rose-200 text-xs font-bold">
              <AlertTriangle className="h-4 w-4 text-rose-300" />
              <span>{overloadedCount} collaborateur(s) en surcharge</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('workload')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'workload'
                ? 'bg-[#2A7B76] text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Capacité hebdomadaire et charge de travail par collaborateur"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Charge de Travail (Workload)</span>
          </button>

          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'milestones'
                ? 'bg-[#2A7B76] text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Portefeuille des jalons majeurs et livrables stratégiques"
          >
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            <span>Portefeuille Jalons ({milestonesCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('velocity')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'velocity'
                ? 'bg-[#2A7B76] text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Vélocité, taux de respect des délais et granularité des sous-tâches"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Vélocité & Sous-tâches</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-stone-400" />
          <span className="text-[11px] font-bold text-stone-600">Projet :</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 font-bold text-stone-800 text-xs focus:bg-white outline-none cursor-pointer"
          >
            <option value="all">📁 Tous les projets d'entreprise</option>
            {projects
              .filter((p) => p.id !== 'all')
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon || '📁'} {p.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Tâches & Sous-tâches</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-xl font-bold font-serif text-stone-900">{totalTasks}</h3>
              <span className="text-xs text-stone-500 font-mono">({totalSubtasks} sous-tâches)</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold block">
              {completedTasks + completedSubtasks} unités achevées
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Respect des Échéances</span>
            <h3 className="text-xl font-bold font-serif text-stone-900 mt-0.5">{onTimeRate}%</h3>
            <span className="text-[10px] text-stone-500 font-medium block">Livrées dans les temps impartis</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100">
            <CheckSquare className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Rendement Sous-Tâches</span>
            <h3 className="text-xl font-bold font-serif text-stone-900 mt-0.5">{subtasksCompletionRate}%</h3>
            <span className="text-[10px] text-stone-500 font-medium block">
              {completedSubtasks} / {totalSubtasks} points clôturés
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl border border-purple-100">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Jalons Stratégiques</span>
            <h3 className="text-xl font-bold font-serif text-stone-900 mt-0.5">{avgMilestoneProgress}%</h3>
            <span className="text-[10px] text-purple-700 font-semibold block">
              {completedMilestones} / {milestonesCount} jalons validés
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
