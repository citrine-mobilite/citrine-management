import React from 'react';
import { CheckCircle2, ChevronRight, Clock, PauseCircle, Pencil, AlertOctagon } from 'lucide-react';
import { StrategicProject } from '../../types';
import {
  computeProjectProgress,
  formatShortFrenchDate,
  getNextMilestone,
  PROJECT_STATUS_META,
} from '../../services/projectService';

interface ProjectCompactTableProps {
  projects: StrategicProject[];
  canManage: boolean;
  onSelect: (projectId: string) => void;
  onEdit: (project: StrategicProject) => void;
}

const StatusIcon: React.FC<{ status: StrategicProject['status'] }> = ({ status }) => {
  if (status === 'completed') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
  if (status === 'on_hold') return <PauseCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />;
  return <Clock className="h-3.5 w-3.5 text-[#2A7B76] shrink-0" />;
};

export const ProjectCompactTable: React.FC<ProjectCompactTableProps> = ({
  projects,
  canManage,
  onSelect,
  onEdit,
}) => (
  <div className="border border-stone-200 rounded-xl overflow-hidden bg-white">
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold text-stone-500">
            <th className="py-2.5 px-3.5">Projet</th>
            <th className="py-2.5 px-3 whitespace-nowrap">Statut</th>
            <th className="py-2.5 px-3 whitespace-nowrap">Avancement</th>
            <th className="py-2.5 px-3">Prochain jalon</th>
            <th className="py-2.5 px-3 text-right whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 text-xs">
          {projects.map((project) => {
            const { doneCount, totalCount, percent } = computeProjectProgress(project);
            const nextMs = getNextMilestone(project);
            const statusMeta = PROJECT_STATUS_META[project.status || 'active'];
            const blockedCount = (project.milestones || []).filter((m) => m.status === 'blocked').length;

            return (
              <tr
                key={project.id}
                onClick={() => onSelect(project.id)}
                className="hover:bg-stone-50/90 transition-colors cursor-pointer group"
              >
                <td className="py-2.5 px-3.5 max-w-[260px]">
                  <div className="font-semibold text-stone-900 truncate">{project.name}</div>
                  {project.description && (
                    <div className="text-[11px] text-stone-500 truncate">{project.description}</div>
                  )}
                </td>

                <td className="py-2.5 px-3 whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5 font-medium">
                    <StatusIcon status={project.status} />
                    <span className={statusMeta.textClass}>{statusMeta.label}</span>
                  </div>
                  {blockedCount > 0 && (
                    <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                      <AlertOctagon className="h-3 w-3" />
                      {blockedCount}
                    </span>
                  )}
                </td>

                <td className="py-2.5 px-3 whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-20 h-1.5 bg-stone-100 rounded-full overflow-hidden shrink-0">
                      <div
                        className={`h-full rounded-full ${percent === 100 ? 'bg-emerald-600' : 'bg-[#2A7B76]'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="font-mono tabular-nums text-[11px] font-bold text-stone-800">
                      {percent}%
                    </span>
                    <span className="font-mono tabular-nums text-[11px] text-stone-400">
                      ({doneCount}/{totalCount})
                    </span>
                  </div>
                </td>

                <td className="py-2.5 px-3 max-w-[240px]">
                  {nextMs ? (
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-stone-800 font-medium truncate">{nextMs.title}</span>
                      {nextMs.targetDate && (
                        <>
                          <span className="text-stone-300" aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums text-[11px] text-stone-500 shrink-0">
                            {formatShortFrenchDate(nextMs.targetDate)}
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-emerald-700 font-medium">Tous terminés</span>
                  )}
                </td>

                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1">
                    {canManage && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(project);
                        }}
                        className="p-1.5 text-stone-400 hover:text-[#2A7B76] hover:bg-stone-100 rounded-lg transition cursor-pointer"
                        title={`Modifier ${project.name}`}
                        aria-label={`Modifier ${project.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(project.id);
                      }}
                      className="px-2 py-1 text-[11px] font-semibold text-[#2A7B76] hover:bg-emerald-50 rounded-lg inline-flex items-center gap-0.5 transition cursor-pointer"
                    >
                      <span>Jalons</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);
