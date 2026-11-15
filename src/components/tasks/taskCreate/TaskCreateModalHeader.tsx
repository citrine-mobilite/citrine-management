import React from 'react';
import { X, CheckSquare, Trophy } from 'lucide-react';

interface TaskCreateModalHeaderProps {
  isMilestone: boolean;
  onClose: () => void;
}

export const TaskCreateModalHeader: React.FC<TaskCreateModalHeaderProps> = ({ isMilestone, onClose }) => {
  return (
    <div className="bg-gradient-to-r from-[#2A7B76] via-[#20635F] to-emerald-900 p-5 text-white shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
            {isMilestone ? (
              <Trophy className="h-5 w-5 text-amber-300" />
            ) : (
              <CheckSquare className="h-5 w-5 text-emerald-200" />
            )}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-emerald-100">
              {isMilestone ? 'Jalon Stratégique (Milestone)' : 'Tâche Opérationnelle'}
            </span>
            <h3 className="font-serif font-bold text-lg sm:text-xl text-white mt-0.5">
              {isMilestone ? 'Définir un Nouveau Jalon Clé' : 'Créer une Nouvelle Tâche'}
            </h3>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          title="Fermer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
