import React from 'react';
import { Check } from 'lucide-react';
import { TaskSheetNoteCategory, TaskSheetNoteUrgency } from '../../../services/taskSheetNotesService';

interface TaskSheetNoteFormProps {
  newNoteContent: string;
  onChangeNewContent: (val: string) => void;
  newNoteCategory: TaskSheetNoteCategory;
  onChangeNewCategory: (val: TaskSheetNoteCategory) => void;
  newNoteUrgency: TaskSheetNoteUrgency;
  onChangeNewUrgency: (val: TaskSheetNoteUrgency) => void;
  newNoteTarget: string;
  onChangeNewTarget: (val: string) => void;
  onSubmitNote: (e: React.FormEvent) => void;
}

const NOTE_PRESETS = [
  'Aucun blocage à signaler sur cette journée.',
  'En attente de validation client / manager.',
  'Panne de connexion réseau au bureau.',
  'Besoin de renfort sur les tâches prioritaires.',
  'Retard approvisionnement / pièce manquante.',
];

export const TaskSheetNoteForm: React.FC<TaskSheetNoteFormProps> = ({
  newNoteContent,
  onChangeNewContent,
  newNoteCategory,
  onChangeNewCategory,
  newNoteUrgency,
  onChangeNewUrgency,
  newNoteTarget,
  onChangeNewTarget,
  onSubmitNote,
}) => {
  return (
    <form onSubmit={onSubmitNote} className="mb-3 p-3 bg-stone-50 rounded-xl border border-stone-300 space-y-2.5 animate-in fade-in duration-150">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-stone-600">Catégorie :</span>
          <select
            value={newNoteCategory}
            onChange={(e) => onChangeNewCategory(e.target.value as any)}
            className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs outline-none"
          >
            <option value="bloquant">🔴 Bloquant (Urgent)</option>
            <option value="retard">🟠 Retard / Risque de délai</option>
            <option value="materiel">⚙️ Panne matérielle / Réseau</option>
            <option value="information">🔵 Information / Coordination</option>
            <option value="succes">🟢 Fait marquant / Avance</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-stone-600">Urgence :</span>
          <select
            value={newNoteUrgency}
            onChange={(e) => onChangeNewUrgency(e.target.value as any)}
            className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs outline-none"
          >
            <option value="normale">Normale</option>
            <option value="haute">Haute</option>
            <option value="critique">Critique</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-stone-600">Destinataire :</span>
          <select
            value={newNoteTarget}
            onChange={(e) => onChangeNewTarget(e.target.value)}
            className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs outline-none"
          >
            <option value="Manager Direct">Manager Direct</option>
            <option value="Direction RH">Direction RH</option>
            <option value="Direction Technique">Direction Technique</option>
            <option value="Tous les Responsables">Tous les Responsables</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 text-[10px]">
        <span className="text-stone-400 font-semibold">Suggestions rapides :</span>
        {NOTE_PRESETS.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onChangeNewContent(preset)}
            className="px-2 py-0.5 bg-white hover:bg-stone-200 text-stone-700 rounded-md border border-stone-200 transition cursor-pointer"
          >
            {preset}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <textarea
          rows={2}
          value={newNoteContent}
          onChange={(e) => onChangeNewContent(e.target.value)}
          placeholder="Décrivez précisément le point à signaler (fait bloquant, besoin de matériel, question au supérieur...)"
          className="flex-1 p-2 bg-white border border-stone-300 rounded-xl text-xs outline-none focus:border-[#2A7B76] resize-none"
          required
        />
        <button
          type="submit"
          className="px-4 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl transition cursor-pointer flex flex-col items-center justify-center gap-1 shrink-0"
        >
          <Check className="w-4 h-4" />
          <span>Enregistrer</span>
        </button>
      </div>
    </form>
  );
};
