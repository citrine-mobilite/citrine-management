import React from 'react';
import { FolderKanban, FolderPlus, Plus, Send } from 'lucide-react';
import { HumaanTaskCheck } from '../illustrations/HumaanIllustrations';

interface TaskHeaderBannerProps {
  onOpenNewProject: () => void;
  onOpenCreateTask: () => void;
  onOpenCreateSubtask?: () => void;
  onSendTaskSheet?: () => void;
}

export const TaskHeaderBanner: React.FC<TaskHeaderBannerProps> = ({
  onOpenNewProject,
  onOpenCreateTask,
  onOpenCreateSubtask,
  onSendTaskSheet,
}) => {
  return (
    <div className="bg-gradient-to-r from-indigo-900 via-[#2A7B76] to-emerald-900 rounded-3xl p-5 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
          <FolderKanban className="h-6 w-6 text-emerald-200 shrink-0" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-bold text-xl whitespace-nowrap">Gestion des Tâches</h2>
            <span className="text-[10px] font-bold bg-white/20 text-emerald-100 px-2 py-0.5 rounded-full border border-white/20">
              Style Asana Pro
            </span>
          </div>
        </div>
      </div>

      <div className="hidden lg:block shrink-0">
        <HumaanTaskCheck className="w-28 h-24 drop-shadow-md" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
        {onSendTaskSheet && (
          <button
            onClick={onSendTaskSheet}
            className="w-full md:w-auto justify-center bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-98 whitespace-nowrap shadow-md border border-emerald-400"
            title="Envoyer votre TaskSheet de la journée"
          >
            <Send className="h-3.5 w-3.5 text-white shrink-0" />
            <span>TaskSheet</span>
          </button>
        )}

        <button
          onClick={onOpenNewProject}
          className="w-full md:w-auto justify-center bg-white/15 hover:bg-white/25 text-white font-semibold px-3 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-white/25 active:scale-98 whitespace-nowrap"
          title="Créer un nouveau projet"
        >
          <FolderPlus className="h-3.5 w-3.5 text-emerald-200 shrink-0" />
          <span>Projet</span>
        </button>

        {onOpenCreateSubtask && (
          <button
            onClick={onOpenCreateSubtask}
            className="w-full md:w-auto justify-center bg-indigo-500/25 hover:bg-indigo-500/35 text-indigo-100 border border-indigo-400/30 font-bold px-3 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-98 whitespace-nowrap shadow-xs"
            title="Créer une sous-tâche détaillée"
          >
            <Plus className="h-3.5 w-3.5 text-indigo-300 shrink-0" />
            <span>Sous-Tâche</span>
          </button>
        )}

        <button
          onClick={onOpenCreateTask}
          className="col-span-2 sm:col-span-1 w-full md:w-auto justify-center bg-white text-[#2A7B76] hover:bg-emerald-50 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-md hover:shadow transition cursor-pointer active:scale-98 whitespace-nowrap"
          title="Créer une nouvelle tâche opérationnelle"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>Nouvelle Tâche</span>
        </button>
      </div>
    </div>
  );
};

export default TaskHeaderBanner;
