import React from 'react';
import { FolderKanban, FolderPlus, Plus } from 'lucide-react';

interface TaskHeaderBannerProps {
  onOpenNewProject: () => void;
  onOpenCreateTask: () => void;
  onOpenCreateMilestone?: () => void;
}

export const TaskHeaderBanner: React.FC<TaskHeaderBannerProps> = ({
  onOpenNewProject,
  onOpenCreateTask,
}) => {
  return (
    <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 rounded-3xl p-5 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2.5">
        <FolderKanban className="h-6 w-6 text-emerald-200 shrink-0" />
        <div>
          <h2 className="font-serif font-bold text-xl whitespace-nowrap">Projets & Tâches</h2>
          <p className="text-xs text-emerald-100 hidden sm:block">Organisation des projets d'entreprise et suivi opérationnel des tâches</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
        {/* Nouveau Projet */}
        <button
          onClick={onOpenNewProject}
          className="bg-white/15 hover:bg-white/25 text-white font-semibold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition cursor-pointer border border-white/25 active:scale-98"
        >
          <FolderPlus className="h-4 w-4 text-emerald-200" />
          <span>Nouveau Projet</span>
        </button>

        {/* Nouvelle Tâche */}
        <button
          onClick={onOpenCreateTask}
          className="bg-white text-[#2A7B76] hover:bg-emerald-50 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-sm hover:shadow transition cursor-pointer active:scale-98"
        >
          <Plus className="h-4 w-4" />
          <span>Nouvelle Tâche</span>
        </button>
      </div>
    </div>
  );
};
