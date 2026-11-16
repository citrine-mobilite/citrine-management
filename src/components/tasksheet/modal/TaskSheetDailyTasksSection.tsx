import React from 'react';
import { Clock, Trophy, ShieldCheck } from 'lucide-react';
import { DailyTaskSheetData } from '../../../services/taskSheetService';

interface TaskSheetDailyTasksSectionProps {
  dailyData: DailyTaskSheetData;
}

export const TaskSheetDailyTasksSection: React.FC<TaskSheetDailyTasksSectionProps> = ({ dailyData }) => {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 border border-stone-200 rounded-2xl bg-white overflow-hidden">
        <div className="p-3">
          <span className="text-[11px] font-semibold text-stone-500 block">Assiduité</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <strong className="text-stone-900 text-xs font-bold">
              {dailyData.presenceIncidents && dailyData.presenceIncidents.length > 0
                ? 'Avec remarques'
                : 'Conforme (100%)'}
            </strong>
          </div>
        </div>

        <div className="p-3">
          <span className="text-[11px] font-semibold text-stone-500 block">Rendement Jour</span>
          <div className="flex items-center gap-1.5 mt-0.5 tabular-nums">
            <Clock className="w-4 h-4 text-[#2A7B76] shrink-0" />
            <strong className="text-stone-900 text-sm font-bold">
              {dailyData.completedTasks}/{dailyData.totalTasks} ({dailyData.ratePercentage}%)
            </strong>
          </div>
        </div>

        <div className="p-3">
          <span className="text-[11px] font-semibold text-stone-500 block">Priorités Majeures</span>
          <div className="flex items-center gap-1.5 mt-0.5 tabular-nums">
            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
            <strong className="text-stone-900 text-sm font-bold">
              {dailyData.topPriorities.filter((p) => p.status === 'Fait').length}/{dailyData.topPriorities.length}
            </strong>
          </div>
        </div>

        <div className="p-3">
          <span className="text-[11px] font-semibold text-stone-500 block">Charge Planifiée</span>
          <strong
            className={`text-sm font-bold block mt-0.5 tabular-nums ${
              dailyData.capacity.capacityStatus === 'overloaded' ? 'text-rose-700' : 'text-[#164e4b]'
            }`}
          >
            {Math.round(dailyData.capacity.plannedMinutes / 60)}h / 12h max
          </strong>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white">
        <div className="bg-[#164e4b] text-white px-4 py-2.5 font-bold text-xs flex items-center justify-between">
          <span>Priorités du Jour</span>
          <span className="text-[11px] text-emerald-200 font-mono tabular-nums">
            {dailyData.topPriorities.length}
          </span>
        </div>
        <div className="divide-y divide-stone-200">
          {dailyData.topPriorities.map((p, idx) => (
            <div key={p.id || idx} className="p-2.5 flex items-center justify-between bg-white text-xs hover:bg-stone-50 transition">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-bold text-stone-400 w-4 text-center tabular-nums">{idx + 1}.</span>
                <span className="font-bold text-stone-900 truncate">{p.title}</span>
                {p.isMilestone && (
                  <span className="text-[10px] font-bold text-amber-700 shrink-0">· Jalon</span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-stone-500 uppercase font-mono font-semibold">{p.priority}</span>
                <span
                  className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                    p.status === 'Fait' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {p.status}
                </span>
              </div>
            </div>
          ))}
          {dailyData.topPriorities.length === 0 && (
            <div className="p-3 text-center text-stone-400 italic bg-stone-50 text-xs">
              Aucune priorité enregistrée pour cette journée.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white">
        <div className="bg-[#164e4b] text-white px-4 py-2.5 font-bold text-xs flex items-center justify-between">
          <span>Tâches du Jour</span>
          <span className="text-[11px] text-emerald-200 font-mono tabular-nums">
            {dailyData.completedTasks}/{dailyData.totalTasks} ({dailyData.ratePercentage}%)
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-[#2A7B76] text-white font-bold text-[11px]">
              <tr>
                <th className="py-2 px-3">Sous-Tâche</th>
                <th className="py-2 px-3">Mission Parente</th>
                <th className="py-2 px-2 text-center w-12">Prio</th>
                <th className="py-2 px-3 text-right w-24">Estimé</th>
                <th className="py-2 px-3 text-center w-24">Échéance</th>
                <th className="py-2 px-3 text-center w-24">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {dailyData.tasks.map((t, idx) => (
                <tr key={idx} className="hover:bg-stone-50 transition">
                  <td className="py-2 px-3 font-semibold text-stone-900">{t.title}</td>
                  <td className="py-2 px-3 text-stone-600">
                    <span className="truncate block max-w-xs">{t.parentTaskTitle}</span>
                  </td>
                  <td
                    className={`py-2 px-2 text-center font-bold text-[11px] ${
                      t.priorityLabel === 'P1'
                        ? 'text-rose-600'
                        : t.priorityLabel === 'P2'
                        ? 'text-blue-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {t.priorityLabel}
                  </td>
                  <td className="py-2 px-3 text-right font-mono">{t.estimatedMinutes} min</td>
                  <td className="py-2 px-3 text-center font-mono text-[11px] text-stone-500">{t.dueDate}</td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        t.status === 'Fait' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {dailyData.tasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-stone-400 italic bg-stone-50">
                    Aucune sous-tâche en cours ni terminée ce jour.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-[#164e4b] text-white font-bold text-xs">
              <tr>
                <td colSpan={2} className="py-2 px-3">Total</td>
                <td className="py-2 px-2 text-center">{dailyData.totalTasks}</td>
                <td className="py-2 px-3 text-right">{dailyData.completedTasks} fait</td>
                <td className="py-2 px-3 text-center">{dailyData.ratePercentage}%</td>
                <td className="py-2 px-3 text-center">{dailyData.postponedCount} à suivre</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
};
