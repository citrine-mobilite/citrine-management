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
  if (category === 'bloquant') return 'bg-rose-100 text-rose-800 border-rose-200';
  if (category === 'retard') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (category === 'materiel') return 'bg-purple-100 text-purple-800 border-purple-200';
  if (category === 'succes') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  return 'bg-blue-100 text-blue-800 border-blue-200';
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
    <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white">
      <div className="bg-[#164e4b] text-white px-4 py-2.5 font-bold text-xs flex items-center justify-between">
        <span>Bilan Fin de Journée</span>
      </div>
      <div className="divide-y divide-stone-200 p-4 space-y-4">
        <div>
          <strong className="block text-stone-800 text-xs font-bold mb-1.5">
            À reporter à demain ({dailyData.postponedTasks.length})
          </strong>
          {dailyData.postponedTasks.length > 0 ? (
            <ul className="list-disc pl-5 text-stone-700 font-medium space-y-0.5 text-xs">
              {dailyData.postponedTasks.map((t, idx) => (
                <li key={idx}>{t}</li>
              ))}
            </ul>
          ) : (
            <p className="text-emerald-700 font-semibold text-xs">
              Toutes les tâches du jour sont clôturées.
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-stone-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <strong className="text-stone-800 text-xs font-bold">
              Points à Signaler ({taskSheetNotes.length})
            </strong>

            <button
              type="button"
              onClick={() => onToggleAddingNote()}
              className="px-2.5 py-1 bg-[#2A7B76] hover:bg-[#20635F] text-white rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingNote ? 'Masquer' : 'Ajouter un point'}</span>
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

          {dailyData.managerComments.length > 0 && (
            <div className="space-y-2 bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="text-[11px] font-bold text-stone-700 block">
                Commentaires ({dailyData.managerComments.length})
              </span>
              <div className="space-y-1.5">
                {dailyData.managerComments.map((com) => (
                  <div
                    key={com.id}
                    className="p-2.5 rounded-lg border border-stone-200 bg-white text-xs space-y-1"
                  >
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-stone-500">
                      <strong className="text-stone-900">{com.author}</strong>
                      <span>·</span>
                      <span className="font-medium text-stone-700">{com.taskTitle}</span>
                      <span className="font-mono ml-auto">{com.time}</span>
                    </div>
                    <p className="text-stone-800">{com.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {taskSheetNotes.map((note) => (
              <div
                key={note.id}
                className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase border ${getCategoryBadge(
                        note.category
                      )}`}
                    >
                      {note.category}
                    </span>
                    <span className="font-mono text-[11px] text-stone-500">{note.time}</span>
                    <span className="text-[11px] text-stone-600">{note.targetAudience}</span>
                    {note.status === 'resolu' && (
                      <span className="text-[10px] font-bold text-emerald-700">· Résolu</span>
                    )}
                  </div>
                  <p className="text-stone-800 font-medium">{note.content}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() =>
                      updateTaskSheetNoteStatus(
                        note.id,
                        note.status === 'resolu' ? 'pris_en_compte' : 'resolu'
                      )
                    }
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      note.status === 'resolu'
                        ? 'bg-stone-200 text-stone-700 border-stone-300'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {note.status === 'resolu' ? 'Rouvrir' : 'Résolu'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveNote(note.id)}
                    className="p-1 text-stone-400 hover:text-rose-600 rounded transition cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {taskSheetNotes.length === 0 && (
              <div className="text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-xs flex items-center justify-between gap-2">
                <span>{dailyData.managerAlertPoint || 'Aucun point particulier consigné.'}</span>
                <button
                  type="button"
                  onClick={() => onToggleAddingNote(true)}
                  className="text-[#2A7B76] hover:underline font-bold text-[11px] shrink-0 cursor-pointer"
                >
                  + Signaler
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
