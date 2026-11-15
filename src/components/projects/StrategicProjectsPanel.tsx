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
    return { total, active, avgProgress, doneMilestones, totalMilestones, blockedMilestones };
  }, [projects]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-serif font-bold text-xl text-stone-900 flex items-center gap-2">
            <Flag className="h-5 w-5 text-[#2A7B76] shrink-0" />
            <span>Portefeuille Projets &amp; Jalons Stratégiques</span>
          </h2>
          <p className="text-xs text-stone-500">
            Pilotage synthétique de chaque projet et de ses jalons clés. Basculez librement entre vue liste dense et grille compacte.
          </p>
        </div>

        <div className="sm:text-right shrink-0 border-t sm:border-t-0 sm:border-l border-stone-200 pt-3 sm:pt-0 sm:pl-5">
          <span className="text-[11px] font-medium text-stone-500 block">Avancement moyen global</span>
          <span className="font-mono tabular-nums font-bold text-2xl text-[#2A7B76]">
            {stats.avgProgress}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-stone-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-medium text-stone-500 block">Projets suivis</span>
            <span className="font-mono tabular-nums text-lg font-bold text-stone-900">{stats.total}</span>
          </div>
          <Layers className="h-4 w-4 text-stone-400 shrink-0" />
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-medium text-stone-500 block">Projets actifs</span>
            <span className="font-mono tabular-nums text-lg font-bold text-[#2A7B76]">{stats.active}</span>
          </div>
          <Clock className="h-4 w-4 text-[#2A7B76] shrink-0" />
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-medium text-stone-500 block">Jalons franchis</span>
            <span className="font-mono tabular-nums text-lg font-bold text-emerald-700">
              {stats.doneMilestones}/{stats.totalMilestones}
            </span>
          </div>
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-medium text-stone-500 block">Jalons bloqués</span>
            <span className={`font-mono tabular-nums text-lg font-bold ${stats.blockedMilestones > 0 ? 'text-rose-700' : 'text-stone-700'}`}>
              {stats.blockedMilestones}
            </span>
          </div>
          <AlertOctagon className={`h-4 w-4 shrink-0 ${stats.blockedMilestones > 0 ? 'text-rose-600' : 'text-stone-400'}`} />
        </div>
      </div>

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
