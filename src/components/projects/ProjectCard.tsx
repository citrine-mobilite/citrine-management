import React from 'react';
import { ChevronRight, CheckCircle2, Clock, AlertOctagon, Circle, PauseCircle, Pencil } from 'lucide-react';
import { StrategicProject } from '../../types';
import {
  computeProjectProgress,
  formatShortFrenchDate,
  getNextMilestone,
  PROJECT_STATUS_META,
} from '../../services/projectService';

interface ProjectCardProps {
  project: StrategicProject;
  canManage: boolean;
  onSelect: (projectId: string) => void;
  onEdit: (project: StrategicProject) => void;
}

const ProjectStatusIcon: React.FC<{ status: StrategicProject['status'] }> = ({ status }) => {
  if (status === 'completed') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
  if (status === 'on_hold') return <PauseCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />;
  return <Clock className="h-3.5 w-3.5 text-[#2A7B76] shrink-0" />;
};

const MilestoneStatusIcon: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'done') return <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />;
  if (status === 'in_progress') return <Clock className="h-3 w-3 text-[#2A7B76] shrink-0" />;
  if (status === 'blocked') return <AlertOctagon className="h-3 w-3 text-rose-600 shrink-0" />;
  return <Circle className="h-3 w-3 text-stone-400 shrink-0" />;
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  canManage,
  onSelect,
  onEdit,
}) => {
  const { doneCount, totalCount, percent } = computeProjectProgress(project);
  const nextMilestone = getNextMilestone(project);
  const projStatusMeta = PROJECT_STATUS_META[project.status || 'active'];

  return (
    <div
      onClick={() => onSelect(project.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(project.id);
        }
      }}
      className="p-3 rounded-xl border border-stone-200 bg-white hover:border-[#2A7B76]/60 transition cursor-pointer flex flex-col justify-between gap-2 text-left focus-visible:outline-2 focus-visible:outline-[#2A7B76]"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-serif font-bold text-sm text-stone-900 truncate">{project.name}</h4>
          <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5 truncate">
            <ProjectStatusIcon status={project.status} />
            <span className={`font-semibold ${projStatusMeta.textClass}`}>{projStatusMeta.label}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums font-semibold text-stone-700">
              {percent}% ({doneCount}/{totalCount})
            </span>
          </div>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(project);
            }}
            className="p-1.5 text-stone-400 hover:text-[#2A7B76] hover:bg-stone-100 rounded-lg transition cursor-pointer shrink-0"
            title={`Modifier ${project.name}`}
            aria-label={`Modifier ${project.name}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            percent === 100 ? 'bg-emerald-600' : 'bg-[#2A7B76]'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between gap-2 text-[11px]">
        <div className="min-w-0 flex-1 flex items-center gap-1.5 truncate">
          {nextMilestone ? (
            <>
              <MilestoneStatusIcon status={nextMilestone.status} />
              <span className="text-stone-700 font-medium truncate">{nextMilestone.title}</span>
              {nextMilestone.targetDate && (
                <span className="font-mono tabular-nums text-stone-400 shrink-0">
                  · {formatShortFrenchDate(nextMilestone.targetDate)}
                </span>
              )}
            </>
          ) : (
            <span className="text-emerald-700 font-medium truncate">Tous les jalons terminés</span>
          )}
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-stone-400 shrink-0" />
      </div>
    </div>
  );
};
