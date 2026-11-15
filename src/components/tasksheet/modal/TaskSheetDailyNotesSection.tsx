import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DailyTaskSheetData } from '../../../services/taskSheetService';
import {
  TaskSheetNote,
  TaskSheetNoteCategory,
  TaskSheetNoteUrgency,
  updateTaskSheetNoteStatus,
} from '../../../services/taskSheetNotesService';
import { TaskSheetNoteForm } from './TaskSheetNoteForm';

interface TaskSheetDailyNotesSectionProps {
  dailyData: DailyTaskSheetData;
  taskSheetNotes: TaskSheetNote[];
  isAddingNote: boolean;
  onToggleAddingNote: (force?: boolean) => void;
  newNoteContent: string;
  onChangeNewContent: (val: string) => void;
  newNoteCategory: TaskSheetNoteCategory;
  onChangeNewCategory: (val: TaskSheetNoteCategory) => void;
  newNoteUrgency: TaskSheetNoteUrgency;
  onChangeNewUrgency: (val: TaskSheetNoteUrgency) => void;
  newNoteTarget: string;
  onChangeNewTarget: (val: string) => void;
  onSubmitNote: (e: React.FormEvent) => void;
  onRemoveNote: (id: string) => void;
}

function getCategoryBadge(category: TaskSheetNoteCategory): string {
  if (category === 'bloquant') return 'bg-rose-100 text-rose-800 border-rose-300';
  if (category === 'retard') return 'bg-amber-100 text-amber-800 border-amber-300';
  if (category === 'materiel') return 'bg-purple-100 text-purple-800 border-purple-300';
  if (category === 'succes') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  return 'bg-blue-100 text-blue-800 border-blue-300';
}

export const TaskSheetDailyNotesSection: React.FC<TaskSheetDailyNotesSectionProps> = ({
  dailyData,
  taskSheetNotes,
  isAddingNote,
  onToggleAddingNote,
  newNoteContent,
  onChangeNewContent,
  newNoteCategory,
  onChangeNewCategory,
  newNoteUrgency,
  onChangeNewUrgency,
  newNoteTarget,
  onChangeNewTarget,
  onSubmitNote,
  onRemoveNote,
}) => {
  return (
    <div className="rounded-xl border border-stone-300 overflow-hidden">
      <div className="bg-[#164e4b] text-white px-3 py-2 font-bold text-xs flex items-center gap-1.5">
        <span>☑️</span>
        <span>BILAN FIN DE JOURNÉE (2 min)</span>
      </div>
      <div className="divide-y divide-stone-200 bg-white p-3 space-y-3">
        <div>
          <strong className="block text-stone-700 text-xs font-bold mb-1">À reporter à demain :</strong>
          {dailyData.postponedTasks.length > 0 ? (
            <ul className="list-disc pl-5 text-blue-700 font-medium space-y-0.5">
              {dailyData.postponedTasks.map((t, idx) => (
                <li key={idx}>{t}</li>
              ))}
            </ul>
          ) : (
            <p className="text-emerald-700 font-semibold">Toutes les sous-tâches du jour ont été clôturées avec succès !</p>
          )}
        </div>

        <div className="pt-3 border-t border-stone-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <strong className="text-stone-800 text-xs font-bold flex items-center gap-1.5">
                <span className="text-rose-600">🚩</span>
                <span>Points à Signaler au Manager &amp; Direction</span>
              </strong>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2A7B76]/10 text-[#2A7B76]">
                {taskSheetNotes.length} consigné(s)
              </span>
            </div>

            <button
              type="button"
              onClick={() => onToggleAddingNote()}
              className="px-2.5 py-1 bg-[#2A7B76] hover:bg-[#20635F] text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 self-start sm:self-auto cursor-pointer shadow-3xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingNote ? 'Masquer le formulaire' : '+ Ajouter un point à signaler'}</span>
            </button>
          </div>

          {isAddingNote && (
            <TaskSheetNoteForm
              newNoteContent={newNoteContent}
              onChangeNewContent={onChangeNewContent}
              newNoteCategory={newNoteCategory}
              onChangeNewCategory={onChangeNewCategory}
              newNoteUrgency={newNoteUrgency}
              onChangeNewUrgency={onChangeNewUrgency}
              newNoteTarget={newNoteTarget}
              onChangeNewTarget={onChangeNewTarget}
              onSubmitNote={onSubmitNote}
            />
          )}

          <div className="mb-3 space-y-2 bg-stone-50/90 p-3 rounded-2xl border border-stone-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <span>💬</span>
                <span>Commentaires sur les tâches ({dailyData.managerComments.length})</span>
              </span>
              <span className="text-[10px] text-[#2A7B76] font-semibold bg-[#2A7B76]/10 px-2 py-0.5 rounded-full">
                Compte-rendu opérationnel
              </span>
            </div>

            {dailyData.managerComments.length > 0 ? (
              <div className="space-y-1.5">
                {dailyData.managerComments.map((com) => (
                  <div key={com.id} className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 text-xs flex items-start gap-2.5">
                    <span className="text-base shrink-0">💬</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                        <strong className="text-stone-900 font-bold">{com.author}</strong>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-200 text-blue-900 uppercase">
                          {com.isSubtask ? 'Sous-tâche' : 'Tâche'}
                        </span>
                        <span className="font-semibold text-stone-600 truncate max-w-[200px]">{com.taskTitle}</span>
                        <span className="text-stone-400 font-mono ml-auto">{com.time}</span>
                      </div>
                      <p className="text-[11px] text-stone-800 mt-1 font-medium leading-relaxed bg-white p-2 rounded-lg border border-blue-100">
                        "{com.text}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-stone-400 italic py-1">
                Aucun commentaire rédigé sur les tâches aujourd'hui.
              </p>
            )}
          </div>

          <div className="space-y-2">
            {taskSheetNotes.map((note) => (
              <div key={note.id} className="p-2.5 bg-stone-50 hover:bg-stone-100/80 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase border ${getCategoryBadge(note.category)}`}>
                      {note.category}
                    </span>
                    <span className="font-mono text-[10px] text-stone-500 font-bold">{note.time}</span>
                    <span className="text-[10px] font-semibold text-stone-600 bg-white px-2 py-0.5 rounded border border-stone-200">
                      Destinataire : {note.targetAudience}
                    </span>
                    {note.status === 'resolu' && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        ✓ Résolu
                      </span>
                    )}
                  </div>
                  <p className="text-stone-800 font-medium leading-relaxed">{note.content}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => updateTaskSheetNoteStatus(note.id, note.status === 'resolu' ? 'pris_en_compte' : 'resolu')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      note.status === 'resolu' ? 'bg-stone-200 text-stone-700 border-stone-300' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                    title="Marquer comme résolu ou en cours"
                  >
                    {note.status === 'resolu' ? 'Rouvrir' : 'Marquer Résolu'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveNote(note.id)}
                    className="p-1 text-stone-400 hover:text-rose-600 rounded transition cursor-pointer"
                    title="Supprimer ce point à signaler"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {taskSheetNotes.length === 0 && (
              <div className="text-stone-700 bg-stone-50/80 p-2.5 rounded-lg border border-dashed border-stone-300 text-xs flex items-center justify-between gap-2">
                <span>{dailyData.managerAlertPoint || 'Aucun point particulier consigné pour cette journée.'}</span>
                <button
                  type="button"
                  onClick={() => onToggleAddingNote(true)}
                  className="text-[#2A7B76] hover:underline font-bold text-[11px] shrink-0 cursor-pointer"
                >
                  + Signaler un point
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
