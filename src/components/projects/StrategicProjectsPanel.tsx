import React, { useMemo } from 'react';
import { Flag, CheckCircle2, Clock, AlertOctagon, Layers } from 'lucide-react';
import { AppUser, Employee, StrategicProject } from '../../types';
import { computeProjectProgress } from '../../services/projectService';
import { ProjectMilestonesWidget } from './ProjectMilestonesWidget';

interface StrategicProjectsPanelProps {
  projects: StrategicProject[];
  onUpdateProjects?: (updated: StrategicProject[]) => void;
  currentUser: AppUser | null;
  employees: Employee[];
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function StrategicProjectsPanel({
  projects = [],
  onUpdateProjects,
  currentUser,
  employees = [],
  showToast,
}: StrategicProjectsPanelProps) {
  const stats = useMemo(() => {
    const total = projects.length;
    const completed = projects.filter((p) => p.status === 'completed').length;
    const active = projects.filter((p) => p.status === 'active').length;

    let doneMilestones = 0;
    let totalMilestones = 0;
    let blockedMilestones = 0;
    let progressSum = 0;

    projects.forEach((p) => {
      const { doneCount, totalCount, percent } = computeProjectProgress(p);
      doneMilestones += doneCount;
      totalMilestones += totalCount;
      progressSum += percent;
      blockedMilestones += (p.milestones || []).filter((m) => m.status === 'blocked').length;
    });

    const avgProgress = total > 0 ? Math.round(progressSum / total) : 0;

    return {
      total,
      active,
      completed,
      avgProgress,
      doneMilestones,
      totalMilestones,
      blockedMilestones,
    };
  }, [projects]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2A7B76] via-[#216762] to-[#164844] rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl border border-white/15">
              <Flag className="h-5 w-5 text-[#F3D079]" />
            </div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-white">
              Gestion de Projets &amp; Jalons Stratégiques
            </h2>
          </div>
          <p className="text-xs text-emerald-100/90">
            Suivez l'avancement global de chaque projet et les prochains jalons clés indépendamment des tâches quotidiennes.
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[11px] text-emerald-200 block">Avancement moyen</span>
          <span className="font-mono tabular-nums font-bold text-2xl text-white">
            {stats.avgProgress}%
          </span>
        </div>
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-stone-500 block">Projets suivis</span>
            <span className="font-mono tabular-nums text-xl font-bold text-stone-900">{stats.total}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-stone-100 text-stone-700">
            <Layers className="h-4 w-4" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-stone-500 block">En cours</span>
            <span className="font-mono tabular-nums text-xl font-bold text-[#2A7B76]">{stats.active}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-teal-50 text-[#2A7B76]">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-stone-500 block">Jalons franchis</span>
            <span className="font-mono tabular-nums text-xl font-bold text-emerald-700">
              {stats.doneMilestones}/{stats.totalMilestones}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-stone-500 block">Jalons bloqués</span>
            <span className={`font-mono tabular-nums text-xl font-bold ${stats.blockedMilestones > 0 ? 'text-rose-700' : 'text-stone-700'}`}>
              {stats.blockedMilestones}
            </span>
          </div>
          <div className={`p-2.5 rounded-xl ${stats.blockedMilestones > 0 ? 'bg-rose-50 text-rose-700' : 'bg-stone-100 text-stone-500'}`}>
            <AlertOctagon className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Main Projects & Milestones Directory */}
      <ProjectMilestonesWidget
        projects={projects}
        onUpdateProjects={onUpdateProjects}
        currentUser={currentUser}
        employees={employees}
        showToast={showToast}
        defaultFilter="all"
      />
    </div>
  );
}
