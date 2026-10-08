import React from 'react';
import { LayoutGrid, ListOrdered, FolderPlus, Plus, Flag } from 'lucide-react';
import { TaskProject, Task } from '../../types';

interface TaskProjectBarProps {
  projects: TaskProject[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  activeView: 'kanban' | 'table';
  onChangeView: (view: 'kanban' | 'table') => void;
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
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-stone-200 shadow-2xs">
      {/* Horizontal project modules buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
        {projects.map((proj) => {
          const isActive = activeProjectId === proj.id;
          const count = proj.id === 'all'
            ? tasks.length
            : tasks.filter((t) => t.projectId === proj.id || (!t.projectId && proj.id === 'general')).length;

          return (
            <button
              key={proj.id}
              onClick={() => onSelectProject(proj.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-98 ${
                isActive
                  ? 'bg-[#2A7B76] text-white shadow-xs ring-2 ring-emerald-200/50'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
              }`}
            >
              <span>{proj.icon || '📁'}</span>
              <span>{proj.name}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  isActive ? 'bg-white text-[#2A7B76]' : 'bg-stone-200 text-stone-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        <button
          onClick={onOpenNewProject}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#2A7B76] hover:bg-emerald-50 border border-dashed border-[#2A7B76]/40 transition cursor-pointer whitespace-nowrap ml-1"
          title="Créer un nouveau projet d'entreprise"
        >
          <FolderPlus className="h-3.5 w-3.5" />
          <span>+ Nouveau Projet</span>
        </button>
      </div>

      {/* Views Toggle: [Kanban] vs [Tableau / Liste] */}
      <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl shrink-0 border border-stone-200/80 self-end md:self-auto">
        <button
          onClick={() => onChangeView('kanban')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeView === 'kanban'
              ? 'bg-white text-[#2A7B76] shadow-2xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          <span>Tableau Kanban</span>
        </button>
        <button
          onClick={() => onChangeView('table')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeView === 'table'
              ? 'bg-white text-[#2A7B76] shadow-2xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <ListOrdered className="h-3.5 w-3.5" />
          <span>Vue Tableau / Liste</span>
        </button>
      </div>
    </div>
  );
};
