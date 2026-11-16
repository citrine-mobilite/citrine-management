import React from 'react';
import { Trash2 } from 'lucide-react';
import { Subtask } from '../../../types';
import {
  formatSubtaskRelativeDate,
  SubtaskFilterPeriod,
} from '../../../utils/subtaskFilterUtils';
import { SubtaskFilterBar } from '../shared/SubtaskFilterBar';

interface SubtaskDetailNestedListProps {
  displayedSubtasks: Subtask[];
  hiddenCount: number;
  totalCount: number;
  subtaskFilterPeriod: SubtaskFilterPeriod;
  setSubtaskFilterPeriod: (p: SubtaskFilterPeriod) => void;
  subtaskFilterDate: string;
  setSubtaskFilterDate: (d: string) => void;
  subtaskRangeStart: string;
  setSubtaskRangeStart: (d: string) => void;
  subtaskRangeEnd: string;
  setSubtaskRangeEnd: (d: string) => void;
  activeRangeLabel?: string;
  draftDueDate: string;
  newSubtaskTitle: string;
  setNewSubtaskTitle: (v: string) => void;
  onAddSubtask: () => void;
  onOpenRichSubtaskModal?: () => void;
  onToggleSubtask: (subId: string) => void;
  onSelectNestedSubtask: (sub: Subtask) => void;
  onDeleteSubtask: (subId: string) => void;
}

export const SubtaskDetailNestedList: React.FC<SubtaskDetailNestedListProps> = ({
  displayedSubtasks,
  hiddenCount,
  totalCount,
  subtaskFilterPeriod,
  setSubtaskFilterPeriod,
  subtaskFilterDate,
  setSubtaskFilterDate,
  subtaskRangeStart,
  setSubtaskRangeStart,
  subtaskRangeEnd,
  setSubtaskRangeEnd,
  activeRangeLabel,
  draftDueDate,
  newSubtaskTitle,
  setNewSubtaskTitle,
  onAddSubtask,
  onOpenRichSubtaskModal,
  onToggleSubtask,
  onSelectNestedSubtask,
  onDeleteSubtask,
}) => {
  return (
    <div className="space-y-2.5 bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
      <div className="flex flex-col gap-2 pb-2 border-b border-stone-200/60">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
            <span>Sous-tâches subordonnées</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-700 font-semibold">
              {displayedSubtasks.length}/{totalCount}
            </span>
            {activeRangeLabel && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-stone-600 border border-stone-200">
                {activeRangeLabel}
              </span>
            )}
          </h4>

          {onOpenRichSubtaskModal && (
            <button
              type="button"
              onClick={onOpenRichSubtaskModal}
              className="text-[11px] font-bold text-[#2A7B76] hover:underline cursor-pointer"
            >
              + Formulaire complet
            </button>
          )}
        </div>

        <SubtaskFilterBar
          period={subtaskFilterPeriod}
          onChangePeriod={setSubtaskFilterPeriod}
          specificDate={subtaskFilterDate}
          onChangeSpecificDate={setSubtaskFilterDate}
          rangeStart={subtaskRangeStart}
          onChangeRangeStart={setSubtaskRangeStart}
          rangeEnd={subtaskRangeEnd}
          onChangeRangeEnd={setSubtaskRangeEnd}
          totalCount={totalCount}
        />
      </div>

      {subtaskFilterPeriod !== 'all' && hiddenCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1.5 text-[10px] text-amber-900 flex items-center justify-between gap-1">
          <span>
            💡 {hiddenCount} sous-tâche(s) hors période masquée(s) (semaine en cours par défaut).
          </span>
          <button
            type="button"
            onClick={() => setSubtaskFilterPeriod('all')}
            className="font-bold underline cursor-pointer shrink-0"
          >
            Afficher tout
          </button>
        </div>
      )}

      <div className="space-y-1.5">
        {displayedSubtasks.length === 0 ? (
          <div className="text-center py-4 bg-white rounded-xl border border-dashed border-stone-200 text-stone-400 text-xs">
            {totalCount > 0
              ? `Aucune sous-tâche sur cette période (${totalCount} au total).`
              : 'Aucune sous-tâche subordonnée.'}
          </div>
        ) : (
          displayedSubtasks.map((sub) => {
            const relDate = formatSubtaskRelativeDate(sub, draftDueDate);
            return (
              <div
                key={sub.id}
                className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-stone-200 gap-2"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={sub.completed}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleSubtask(sub.id);
                    }}
                    className="w-4 h-4 rounded border-stone-300 text-[#2A7B76] cursor-pointer shrink-0"
                  />
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectNestedSubtask(sub);
                    }}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-xs block truncate hover:underline ${
                          sub.completed ? 'line-through text-stone-400' : 'text-stone-800 font-bold'
                        }`}
                      >
                        {sub.title}
                      </span>
                      <span className="text-[9px] font-mono px-1 rounded bg-stone-100 text-stone-500">
                        📅 {relDate}
                      </span>
                      {sub.priority && (
                        <span className="text-[9px] px-1 rounded bg-stone-100 text-stone-600 font-semibold uppercase">
                          {sub.priority}
                        </span>
                      )}
                      {(sub.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] px-1.5 py-0.2 rounded bg-teal-50 text-[#2A7B76] border border-teal-200 font-semibold"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  {(sub.status === 'blocked' ||
                    sub.isBlocked ||
                    (sub.incidents && sub.incidents.length > 0)) && (
                    <span className="px-1.5 py-0.5 rounded-md font-bold text-[9px] bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-0.5 shrink-0">
                      <span>🚨</span>
                      <span>Bloquée</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectNestedSubtask(sub);
                    }}
                    className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    Ouvrir ⚙️
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSubtask(sub.id);
                    }}
                    className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="text"
          placeholder="Ajouter une sous-tâche..."
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAddSubtask();
            }
          }}
          className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2A7B76]"
        />
        <button
          type="button"
          onClick={onAddSubtask}
          className="px-3 py-1.5 bg-[#2A7B76] text-white rounded-xl text-xs font-bold hover:bg-[#23635f] cursor-pointer"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
};
