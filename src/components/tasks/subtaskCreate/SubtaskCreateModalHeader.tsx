import React from 'react';
import { X, CheckSquare, FolderKanban } from 'lucide-react';
import { Task, TaskProject } from '../../../types';
import { HumaanTaskCheck } from '../../illustrations/HumaanIllustrations';

interface SubtaskCreateModalHeaderProps {
  onClose: () => void;
  parentTask?: Task | null;
  availableTasks: Task[];
  selectedTaskId: string;
  setSelectedTaskId: (id: string) => void;
  matchedProject?: TaskProject;
}

export const SubtaskCreateModalHeader: React.FC<SubtaskCreateModalHeaderProps> = ({
  onClose,
  parentTask,
  availableTasks,
  selectedTaskId,
  setSelectedTaskId,
  matchedProject,
}) => {
  return (
    <div className="relative px-6 py-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-[#2A7B76]/10 border-b border-stone-200/60 shrink-0">
      <div className="absolute top-2 right-14 pointer-events-none opacity-40 hidden sm:block">
        <HumaanTaskCheck className="w-16 h-16" />
      </div>

      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2A7B76] text-white flex items-center justify-center shadow-md shadow-[#2A7B76]/20 shrink-0">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-900 tracking-tight">
              Nouvelle sous-tâche
            </h3>
            <p className="text-xs text-stone-500 font-medium">
              Évolution &amp; réalisation rattachée au job description de la tâche
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          type="button"
          className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 flex items-center justify-center transition cursor-pointer border border-stone-200/60"
          title="Fermer la fenêtre"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3.5 flex items-center gap-2 text-xs">
        <span className="text-stone-500 font-medium flex items-center gap-1.5 shrink-0">
          <FolderKanban className="h-3.5 w-3.5 text-[#2A7B76]" />
          Tâche parente :
        </span>
        {parentTask ? (
          <span className="font-bold text-stone-800 bg-white/80 px-2.5 py-1 rounded-xl border border-stone-200/80 truncate max-w-xs shadow-2xs">
            {parentTask.title}
          </span>
        ) : availableTasks.length > 0 ? (
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="bg-white/90 text-stone-800 font-bold rounded-xl px-2.5 py-1 border border-stone-200/80 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none cursor-pointer max-w-xs truncate shadow-2xs"
          >
            {availableTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        ) : (
          <span className="italic text-stone-400">Tâche active</span>
        )}

        {matchedProject && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#2A7B76] bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60 ml-auto">
            {matchedProject.icon || '📁'} {matchedProject.name}
          </span>
        )}
      </div>
    </div>
  );
};
