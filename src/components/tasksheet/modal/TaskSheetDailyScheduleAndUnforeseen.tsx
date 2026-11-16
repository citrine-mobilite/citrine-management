import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Employee } from '../../../types';
import { DailyTaskSheetData } from '../../../services/taskSheetService';

interface TaskSheetDailyScheduleAndUnforeseenProps {
  dailyData: DailyTaskSheetData;
  employee: Employee;
  isViewingSelf: boolean;
  isAddingUnforeseen: boolean;
  onToggleAddingUnforeseen: () => void;
  newUnforeseenTime: string;
  onChangeNewTime: (val: string) => void;
  newUnforeseenSubject: string;
  onChangeNewSubject: (val: string) => void;
  newUnforeseenLostMin: number;
  onChangeNewLostMin: (val: number) => void;
  onSubmitUnforeseen: (e: React.FormEvent) => void;
  onRemoveCustomUnforeseen: (id: string) => void;
}

export const TaskSheetDailyScheduleAndUnforeseen: React.FC<TaskSheetDailyScheduleAndUnforeseenProps> = ({
  dailyData,
  isViewingSelf,
  isAddingUnforeseen,
  onToggleAddingUnforeseen,
  newUnforeseenTime,
  onChangeNewTime,
  newUnforeseenSubject,
  onChangeNewSubject,
  newUnforeseenLostMin,
  onChangeNewLostMin,
  onSubmitUnforeseen,
  onRemoveCustomUnforeseen,
}) => {
  return (
    <>
      <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white">
        <div className="bg-[#164e4b] text-white px-4 py-2.5 font-bold text-xs flex items-center justify-between">
          <span>Plan Horaire (08:00 – 17:00)</span>
          <span className="text-[11px] text-emerald-200 font-mono">Pause 12:00 – 13:00</span>
        </div>
        <table className="w-full text-left text-xs tabular-nums">
          <thead className="bg-[#2A7B76] text-white font-bold text-[11px]">
            <tr>
              <th className="py-2 px-3 w-40">Heure</th>
              <th className="py-2 px-3">Activité</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {dailyData.scheduleSlots.map((s, idx) => {
              const isLunchBreak =
                s.isBreak || (s.timeRange.startsWith('12:00') && s.timeRange.includes('13:00'));
              const isIdleDay = s.activity.toLowerCase().includes("n'a rien fait");

              return (
                <tr
                  key={idx}
                  className={`transition ${
                    isIdleDay
                      ? 'bg-stone-50 text-stone-500'
                      : isLunchBreak
                      ? 'bg-amber-50/80 font-bold text-amber-950'
                      : 'bg-white hover:bg-stone-50/70'
                  }`}
                >
                  <td className="py-2 px-3 font-mono font-bold text-stone-800">{s.timeRange}</td>
                  <td
                    className={`py-2 px-3 font-semibold ${
                      isIdleDay
                        ? 'text-stone-500 italic'
                        : isLunchBreak
                        ? 'text-amber-800'
                        : 'text-stone-900'
                    }`}
                  >
                    {isLunchBreak ? 'Pause Déjeuner (12h00 – 13h00)' : s.activity}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white">
        <div className="bg-[#164e4b] text-white px-4 py-2.5 font-bold text-xs flex items-center justify-between">
          <span>Imprévus &amp; Blocages ({dailyData.unforeseenEvents.length})</span>
          {isViewingSelf && (
            <button
              type="button"
              onClick={onToggleAddingUnforeseen}
              className="px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-lg text-[11px] font-bold text-white transition cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>{isAddingUnforeseen ? 'Fermer' : 'Ajouter'}</span>
            </button>
          )}
        </div>

        {isViewingSelf && isAddingUnforeseen && (
          <form
            onSubmit={onSubmitUnforeseen}
            className="p-3 bg-amber-50/70 border-b border-amber-200 flex flex-wrap items-center gap-2 text-xs"
          >
            <div className="flex items-center gap-1">
              <span className="font-bold text-stone-600 text-[10px]">Heure :</span>
              <input
                type="text"
                value={newUnforeseenTime}
                onChange={(e) => onChangeNewTime(e.target.value)}
                placeholder="14:15"
                className="w-16 px-2 py-1 bg-white border border-stone-300 rounded-lg font-mono text-xs outline-none"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={newUnforeseenSubject}
                onChange={(e) => onChangeNewSubject(e.target.value)}
                placeholder="Objet de l'imprévu..."
                className="w-full px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-xs outline-none focus:border-[#2A7B76]"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="font-bold text-stone-600 text-[10px]">Durée :</span>
              <input
                type="number"
                value={newUnforeseenLostMin}
                onChange={(e) => onChangeNewLostMin(Number(e.target.value))}
                className="w-16 px-2 py-1 bg-white border border-stone-300 rounded-lg font-mono text-xs outline-none"
              />
              <span className="text-[10px] text-stone-500">min</span>
            </div>

            <button
              type="submit"
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Enregistrer</span>
            </button>
          </form>
        )}

        <table className="w-full text-left text-xs tabular-nums">
          <thead className="bg-[#2A7B76] text-white font-bold text-[11px]">
            <tr>
              <th className="py-2 px-3 w-24">Heure</th>
              <th className="py-2 px-3">Objet</th>
              <th className="py-2 px-3 w-28 text-center">Statut</th>
              <th className="py-2 px-3 text-right w-24">Durée</th>
              {isViewingSelf && <th className="py-2 px-2 text-center w-12">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {dailyData.unforeseenEvents.map((u, idx) => (
              <tr key={idx} className="bg-white hover:bg-stone-50 transition">
                <td className="py-2 px-3 font-mono font-bold text-stone-700">{u.time}</td>
                <td className="py-2 px-3 text-stone-800">
                  <span className="font-semibold text-stone-900 block">{u.subject}</span>
                  {u.sourceTask && (
                    <span className="text-[11px] text-stone-500">{u.sourceTask}</span>
                  )}
                </td>
                <td className="py-2 px-3 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      u.status === 'Résolu'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {u.status || 'Bloqué'}
                  </span>
                </td>
                <td className="py-2 px-3 text-right font-mono text-rose-600 font-bold">
                  {u.lostMinutes} min
                </td>
                {isViewingSelf && (
                  <td className="py-2 px-2 text-center">
                    {(u as any).id && (
                      <button
                        type="button"
                        onClick={() => onRemoveCustomUnforeseen((u as any).id || String(idx))}
                        className="text-stone-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {dailyData.unforeseenEvents.length === 0 && (
              <tr>
                <td
                  colSpan={isViewingSelf ? 5 : 4}
                  className="py-3 px-3 text-center text-stone-400 italic"
                >
                  Aucun imprévu signalé ce jour.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
