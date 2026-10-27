import React from 'react';
import { FolderKanban, FolderPlus, Plus, Trophy, Sparkles, Send } from 'lucide-react';

interface TaskHeaderBannerProps {
  onOpenNewProject: () => void;
  onOpenCreateTask: () => void;
  onOpenCreateMilestone?: () => void;
  onOpenCreateSubtask?: () => void;
  onSendTimesheet?: () => void;
}

export const TaskHeaderBanner: React.FC<TaskHeaderBannerProps> = ({
  onOpenNewProject,
  onOpenCreateTask,
  onOpenCreateMilestone,
  onOpenCreateSubtask,
  onSendTimesheet,
}) => {
  return (
    <div className="bg-gradient-to-r from-indigo-900 via-[#2A7B76] to-emerald-900 rounded-3xl p-5 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
          <FolderKanban className="h-6 w-6 text-emerald-200 shrink-0" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-bold text-xl whitespace-nowrap">Tâches & Jalons Stratégiques</h2>
            <span className="text-[10px] font-bold bg-white/20 text-emerald-100 px-2 py-0.5 rounded-full border border-white/20">
              Style Asana Pro
            </span>
          </div>
          <p className="text-xs text-emerald-100/90 hidden sm:block">
            Organisation des projets d'entreprise, décomposition en sous-tâches et pilotage du rendement capacitaire.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 w-full md:w-auto">
        {/* Envoyer ma fiche de temps */}
        {onSendTimesheet && (
          <button
            onClick={onSendTimesheet}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-2 rounded-2xl text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-98 whitespace-nowrap shadow-md border border-emerald-400"
            title="Envoyer votre fiche de temps de la journée"
          >
            <Send className="h-3.5 w-3.5 text-white" />
            <span>Envoyer ma fiche de temps</span>
          </button>
        )}

        {/* Nouveau Projet */}
        <button
          onClick={onOpenNewProject}
          className="bg-white/15 hover:bg-white/25 text-white font-semibold px-3 py-2 rounded-2xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-white/25 active:scale-98 whitespace-nowrap"
          title="Créer un nouveau projet ou module d'entreprise"
        >
          <FolderPlus className="h-3.5 w-3.5 text-emerald-200" />
          <span>Projet</span>
        </button>

        {/* Nouveau Jalon */}
        {onOpenCreateMilestone && (
          <button
            onClick={onOpenCreateMilestone}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold px-3 py-2 rounded-2xl text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-98 whitespace-nowrap shadow-xs"
            title="Définir un jalon stratégique majeur avec date cible et livrable clé"
          >
            <Trophy className="h-3.5 w-3.5 text-amber-300" />
            <span>Nouveau Jalon</span>
          </button>
        )}

        {/* Nouvelle Sous-Tâche */}
        {onOpenCreateSubtask && (
          <button
            onClick={onOpenCreateSubtask}
            className="bg-indigo-500/25 hover:bg-indigo-500/35 text-indigo-100 border border-indigo-400/30 font-bold px-3 py-2 rounded-2xl text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-98 whitespace-nowrap shadow-xs"
            title="Créer une sous-tâche détaillée avec le procédé haute précision Asana"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
            <span>Sous-Tâche Pro</span>
          </button>
        )}

        {/* Nouvelle Tâche */}
        <button
          onClick={onOpenCreateTask}
          className="bg-white text-[#2A7B76] hover:bg-emerald-50 font-bold px-3.5 py-2 rounded-2xl text-xs flex items-center gap-1.5 shadow-md hover:shadow transition cursor-pointer active:scale-98 whitespace-nowrap"
          title="Créer une nouvelle tâche opérationnelle"
        >
          <Plus className="h-4 w-4" />
          <span>Nouvelle Tâche</span>
        </button>
      </div>
    </div>
  );
};

export default TaskHeaderBanner;
