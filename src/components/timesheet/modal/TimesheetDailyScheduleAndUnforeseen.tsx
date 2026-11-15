import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Employee } from '../../../types';
import { DailyTimesheetData } from '../../../services/timesheetService';

interface TimesheetDailyScheduleAndUnforeseenProps {
  dailyData: DailyTimesheetData;
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

export const TimesheetDailyScheduleAndUnforeseen: React.FC<TimesheetDailyScheduleAndUnforeseenProps> = ({
  dailyData,
  employee,
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
      {/* 3. PLAN HORAIRE DYNAMIQUE */}
      <div className="rounded-xl border border-stone-300 overflow-hidden">
        <div className="bg-[#164e4b] text-white px-3 py-2 font-bold text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span>🕒</span>
            <span>PLAN HORAIRE (08:00 – 17:00) — Pause déjeuner obligatoire 12h00 – 13h00</span>
          </div>
          <span className="text-[10px] bg-amber-400/30 text-amber-100 border border-amber-300/40 px-2 py-0.5 rounded-full font-mono">
            12:00 – 13:00 : Pause Déjeuner
          </span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[#2A7B76] text-white font-bold text-[11px]">
            <tr>
              <th className="py-2 px-3 w-40">Heure</th>
              <th className="py-2 px-3">Ce que je fais sur ce créneau</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {dailyData.scheduleSlots.map((s, idx) => {
              const isLunchBreak = s.isBreak || (s.timeRange.startsWith('12:00') && s.timeRange.includes('13:00'));

              return (
                <tr
                  key={idx}
                  className={`transition ${
                    isLunchBreak
                      ? 'bg-amber-50/90 font-bold text-amber-950 border-y border-amber-200'
                      : 'bg-white hover:bg-stone-50/70'
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-stone-800">
                    {s.timeRange}
                  </td>
                  <td className={`py-2.5 px-3 font-bold ${isLunchBreak ? 'text-amber-800' : 'text-blue-800'}`}>
                    {isLunchBreak ? '🍽️ Pause Déjeuner Officielle (12h00 – 13h00)' : s.activity}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 4. IMPRÉVUS SURVENUS AUJOURD'HUI */}
      <div className="rounded-xl border border-stone-300 overflow-hidden space-y-0">
        <div className="bg-[#164e4b] text-white px-3 py-2 font-bold text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span>⚡</span>
            <span>IMPRÉVUS SURVENUS AUJOURD'HUI ({dailyData.unforeseenEvents.length})</span>
            <span className="text-[10px] text-emerald-200 font-normal">
              — issus des blocages signalés par {employee.name}
            </span>
          </div>
          {isViewingSelf ? (
            <button
              type="button"
              onClick={onToggleAddingUnforeseen}
              className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-bold text-white transition cursor-pointer flex items-center gap-1"
              title="Ajouter un imprévu complémentaire"
            >
              <Plus className="w-3 h-3" />
              <span>{isAddingUnforeseen ? 'Fermer' : '+ Ajouter un Imprévu'}</span>
            </button>
          ) : (
            <span className="text-[10px] text-emerald-200/90 font-medium italic">
              Signalés par l'employé sur ses tâches
            </span>
          )}
        </div>

        {isViewingSelf && isAddingUnforeseen && (
          <form onSubmit={onSubmitUnforeseen} className="p-3 bg-amber-50/70 border-b border-amber-200 flex flex-wrap items-center gap-2 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-1">
              <span className="font-bold text-stone-600 text-[10px]">Heure :</span>
              <input
                type="text"
                value={newUnforeseenTime}
                onChange={(e) => onChangeNewTime(e.target.value)}
                placeholder="ex: 14:15"
                className="w-16 px-2 py-1 bg-white border border-stone-300 rounded-lg font-mono text-xs outline-none"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={newUnforeseenSubject}
                onChange={(e) => onChangeNewSubject(e.target.value)}
                placeholder="Quoi ? (ex: Panne réseau, coupure de courant, urgence client...)"
                className="w-full px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-xs outline-none focus:border-[#2A7B76]"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="font-bold text-stone-600 text-[10px]">Temps perdu :</span>
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
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1 shadow-3xs"
            >
              <Plus className="w-3 h-3" />
              <span>Enregistrer l'imprévu</span>
            </button>
          </form>
        )}

        <table className="w-full text-left text-xs">
          <thead className="bg-[#2A7B76] text-white font-bold text-[11px]">
            <tr>
              <th className="py-2 px-3 w-28">Heure</th>
              <th className="py-2 px-3">Origine &amp; Sujet de l'imprévu (Blocage opérationnel)</th>
              <th className="py-2 px-3 w-28 text-center">Statut</th>
              <th className="py-2 px-3 text-right w-28">Temps impact</th>
              {isViewingSelf && <th className="py-2 px-2 text-center w-12">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {dailyData.unforeseenEvents.map((u, idx) => (
              <tr key={idx} className="bg-white hover:bg-stone-50 transition">
                <td className="py-2 px-3 font-mono font-bold text-stone-700">{u.time}</td>
                <td className="py-2 px-3 text-stone-800">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-stone-900 block">{u.subject}</span>
                    {u.sourceTask && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-stone-500 font-medium bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200">
                        <span>Tâche source :</span>
                        <strong className="text-stone-700">{u.sourceTask}</strong>
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2 px-3 text-center">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    u.status === 'Résolu'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {u.status || 'Bloqué'}
                  </span>
                </td>
                <td className="py-2 px-3 text-right font-mono text-rose-600 font-bold">{u.lostMinutes} min</td>
                {isViewingSelf && (
                  <td className="py-2 px-2 text-center">
                    {(u as any).id && (
                      <button
                        type="button"
                        onClick={() => onRemoveCustomUnforeseen((u as any).id || String(idx))}
                        className="text-stone-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition"
                        title="Supprimer cet imprévu"
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
                <td colSpan={isViewingSelf ? 5 : 4} className="py-3 px-3 text-center text-stone-400 italic">
                  Aucun blocage ni imprévu opérationnel signalé par le collaborateur sur cette journée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
