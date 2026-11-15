import React from 'react';
import { LayoutGrid, ListOrdered, FolderPlus, Trophy, FolderKanban } from 'lucide-react';
import { TaskProject, Task } from '../../types';

interface TaskProjectBarProps {
  projects: TaskProject[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  activeView: 'kanban' | 'table' | 'rendement';
  onChangeView: (view: 'kanban' | 'table' | 'rendement') => void;
  tasks: Task[];
  onOpenNewProject: () => void;
}

export const TaskProjectBar: React.FC<TaskProjectBarProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  activeView,
  onChangeView,
  tasks,
  onOpenNewProject,
}) => {
  const getProjectCount = (projId: string) =>
    projId === 'all'
      ? tasks.length
      : tasks.filter((t) => t.projectId === projId || (!t.projectId && projId === 'general')).length;

  const quickTabs = React.useMemo(() => {
    const base = projects.slice(0, 4);
    if (activeProjectId && !base.some((p) => p.id === activeProjectId)) {
      const selected = projects.find((p) => p.id === activeProjectId);
      if (selected) return [...base.slice(0, 3), selected];
    }
    return base;
  }, [projects, activeProjectId]);

  const hasOverflowProjects = projects.length > 4;

  return (
    <div className="flex flex-col gap-3 bg-white p-3.5 rounded-2xl border border-stone-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200/70">
            {quickTabs.map((proj) => {
              const isActive = activeProjectId === proj.id;
              const count = getProjectCount(proj.id);

              return (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => onSelectProject(proj.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#2A7B76] text-white'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/70'
                  }`}
                >
                  <span className="truncate max-w-[140px]">{proj.name}</span>
                  <span
                    className={`font-mono tabular-nums text-[11px] ${
                      isActive ? 'text-emerald-100' : 'text-stone-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {hasOverflowProjects && (
            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5">
              <FolderKanban className="h-3.5 w-3.5 text-[#2A7B76] shrink-0" />
              <select
                value={activeProjectId}
                onChange={(e) => onSelectProject(e.target.value)}
                className="bg-transparent text-xs font-semibold text-stone-800 outline-none cursor-pointer max-w-[190px]"
                aria-label="Sélectionner un projet parmi tous les dossiers"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({getProjectCount(p.id)})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenNewProject}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#2A7B76] hover:bg-emerald-50 border border-stone-200 transition cursor-pointer whitespace-nowrap shrink-0"
          title="Créer un nouveau projet"
        >
          <FolderPlus className="h-3.5 w-3.5" />
          <span>Nouveau projet</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-stone-100">
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl shrink-0 border border-stone-200/80 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onChangeView('kanban')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeView === 'kanban'
                ? 'bg-white text-[#2A7B76]'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Kanban</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeView('table')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeView === 'table'
                ? 'bg-white text-[#2A7B76]'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ListOrdered className="h-3.5 w-3.5" />
            <span>Tableau / Liste</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeView('rendement')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeView === 'rendement'
                ? 'bg-white text-[#2A7B76]'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Trophy className="h-3.5 w-3.5 text-amber-600" />
            <span>Rendement &amp; Charge</span>
          </button>
        </div>

        <span className="text-[11px] text-stone-500 hidden sm:inline font-mono tabular-nums">
          {projects.filter((p) => p.id !== 'all').length} projet(s) actif(s)
        </span>
      </div>
    </div>
  );
};
