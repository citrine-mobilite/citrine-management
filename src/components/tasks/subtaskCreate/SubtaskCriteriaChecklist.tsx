import React from 'react';
import { CheckCircle2, ListChecks, Plus, Trash2 } from 'lucide-react';

interface SubtaskCriteriaChecklistProps {
  criteria: string[];
  newCriterion: string;
  setNewCriterion: (v: string) => void;
  onAddCriterion: () => void;
  onRemoveCriterion: (idx: number) => void;
}

export const SubtaskCriteriaChecklist: React.FC<SubtaskCriteriaChecklistProps> = ({
  criteria,
  newCriterion,
  setNewCriterion,
  onAddCriterion,
  onRemoveCriterion,
}) => {
  return (
    <div className="space-y-2 p-3.5 rounded-2xl bg-stone-50/60 border border-stone-200/80">
      <label className="font-bold text-stone-700 text-xs flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <ListChecks className="h-3.5 w-3.5 text-[#2A7B76]" />
          Critères de validation
        </span>
        <span className="text-[10px] text-stone-500 font-semibold">
          {criteria.length} critère{criteria.length > 1 ? 's' : ''}
        </span>
      </label>

      {criteria.length > 0 && (
        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
          {criteria.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-stone-200 text-xs shadow-3xs group hover:border-emerald-200 transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#2A7B76] shrink-0" />
                <span className="text-stone-800 truncate font-medium">{item}</span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveCriterion(idx)}
                className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer transition rounded-lg hover:bg-rose-50"
                title="Supprimer ce critère"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <input
          type="text"
          placeholder="Ajouter un critère (ex: Relecture effectuée, Fichier annexé)..."
          value={newCriterion}
          onChange={(e) => setNewCriterion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAddCriterion();
            }
          }}
          className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs outline-none focus:border-[#2A7B76] focus:ring-1 focus:ring-[#2A7B76] shadow-2xs"
        />
        <button
          type="button"
          onClick={onAddCriterion}
          className="px-3 py-2 bg-[#2A7B76]/10 hover:bg-[#2A7B76] text-[#2A7B76] hover:text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Ajouter</span>
        </button>
      </div>
    </div>
  );
};
