import React from 'react';
import { MonthlyTimesheetData } from '../../../services/timesheetService';
import { sortSubtasksNewestFirst } from '../../../utils/subtaskFilterUtils';

interface TimesheetMonthlyViewProps {
  monthlyData: MonthlyTimesheetData;
}

export const TimesheetMonthlyView: React.FC<TimesheetMonthlyViewProps> = ({ monthlyData }) => {
  return (
    <div className="space-y-5">
      {/* 4 KPI Synthétiques du Mois */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center shadow-3xs">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Assiduité Globale</span>
          <strong className="block text-xl font-bold font-serif text-[#164e4b] mt-0.5">
            {monthlyData.totalDaysWorked} jours
          </strong>
          <span className="text-[10px] text-stone-500 font-mono">{monthlyData.totalHoursWorked}h cumulées</span>
        </div>

        <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center shadow-3xs">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Rendement Sous-Tâches</span>
          <strong className="block text-xl font-bold font-serif text-[#2A7B76] mt-0.5">
            {monthlyData.completionRate}%
          </strong>
          <span className="text-[10px] text-stone-500 font-medium">Calculé sur sous-tâches</span>
        </div>

        <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center shadow-3xs">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Sous-Tâches Validées</span>
          <strong className="block text-xl font-bold font-serif text-emerald-700 mt-0.5">
            {monthlyData.completedSubtasksCount || monthlyData.totalTasksCompleted} / {monthlyData.totalSubtasksCount || monthlyData.totalTasksAssigned}
          </strong>
          <span className="text-[10px] text-stone-500">Unités concrètes</span>
        </div>

        <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center shadow-3xs">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Missions Majeures</span>
          <strong className="block text-xl font-bold font-serif text-amber-600 mt-0.5">
            {(monthlyData.tasksList || []).filter(t => t.status === 'completed').length} / {(monthlyData.tasksList || []).length}
          </strong>
          <span className="text-[10px] text-stone-500">Tâches parentes finies</span>
        </div>
      </div>

      {/* RELEVÉ EXHAUSTIF DES TÂCHES & SOUS-TÂCHES DU MOIS */}
      <div className="rounded-2xl border border-stone-300 overflow-hidden shadow-3xs">
        <div className="bg-[#164e4b] text-white px-3.5 py-2.5 font-bold text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <span>RELEVÉ DÉTAILLÉ DU MOIS : TÂCHES &amp; SOUS-TÂCHES OPÉRATIONNELLES</span>
          </div>
          <span className="text-[10px] text-emerald-200 font-mono">
            {(monthlyData.tasksList || []).length} mission(s) assignée(s)
          </span>
        </div>

        <div className="divide-y divide-stone-200 bg-white">
          {(monthlyData.tasksList || []).map((t) => {
            const isTaskDone = t.status === 'completed';
            return (
              <div key={t.id} className="p-3.5 hover:bg-stone-50/60 transition space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                      isTaskDone
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : t.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-stone-100 text-stone-700 border border-stone-300'
                    }`}>
                      {isTaskDone ? '🏆 Tâche Terminée' : 'En cours'}
                    </span>
                    <h4 className="font-bold text-xs text-stone-900 truncate">
                      {t.title}
                    </h4>
                    {t.isMilestone && (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded text-[9px] font-bold">
                        Jalon Clé
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    <span className="text-[11px] font-mono text-stone-500">
                      Sous-tâches : <strong className="text-stone-800 font-bold">{t.completedSubtasks}/{t.totalSubtasks}</strong>
                    </span>
                    <div className="w-24 bg-stone-100 h-2 rounded-full overflow-hidden border border-stone-200">
                      <div
                        className={`h-full ${isTaskDone ? 'bg-emerald-500' : 'bg-[#2A7B76]'}`}
                        style={{ width: `${t.completionPercentage}%` }}
                      />
                    </div>
                    <span className="font-bold font-mono text-[11px] text-[#2A7B76]">
                      {t.completionPercentage}%
                    </span>
                  </div>
                </div>

                {t.subtasks && t.subtasks.length > 0 && (
                  <div className="pl-3 sm:pl-5 space-y-1.5 border-l-2 border-[#2A7B76]/30">
                    {sortSubtasksNewestFirst(t.subtasks, t.date).map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-2 text-xs py-1 px-2.5 rounded-lg bg-stone-50 border border-stone-200/60"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <span className={s.completed ? 'text-emerald-600 font-bold' : 'text-stone-400'}>
                            {s.completed ? '✓' : '○'}
                          </span>
                          <span className={`truncate ${s.completed ? 'line-through text-stone-400' : 'text-stone-800 font-medium'}`}>
                            {s.title}
                          </span>
                          {(s.tags || []).map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] px-1.5 py-0.2 rounded bg-teal-50 text-[#2A7B76] border border-teal-200 font-semibold"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                          s.completed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {s.completed ? 'Validée' : 'À faire'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {(monthlyData.tasksList || []).length === 0 && (
            <div className="p-8 text-center text-stone-400 italic text-xs">
              Aucune tâche enregistrée pour ce collaborateur sur ce mois.
            </div>
          )}
        </div>
      </div>

      {/* SYNTHÈSE JOURNALIÈRE D'ACTIVITÉ */}
      <div className="rounded-2xl border border-stone-300 overflow-hidden shadow-3xs">
        <div className="bg-[#2A7B76] text-white px-3.5 py-2 font-bold text-xs flex items-center justify-between">
          <span>SYNTHÈSE JOURNALIÈRE DU MOIS</span>
          <span className="text-[10px] text-emerald-100 font-mono">
            {monthlyData.totalDaysWorked} jours d'activité
          </span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 text-stone-600 font-bold text-[10px] uppercase border-b border-stone-200">
            <tr>
              <th className="py-2 px-3">Date</th>
              <th className="py-2 px-2 text-center">Jour</th>
              <th className="py-2 px-3 text-center">Statut Présence</th>
              <th className="py-2 px-3 text-right">Heures</th>
              <th className="py-2 px-3 text-center">Sous-Tâches Clôturées</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 font-medium">
            {monthlyData.dailyBreakdown.map((d, idx) => (
              <tr key={idx} className={d.hoursWorked > 0 || d.tasksDoneCount > 0 ? 'bg-white' : 'bg-stone-50 text-stone-400'}>
                <td className="py-1.5 px-3 font-mono">{d.date}</td>
                <td className="py-1.5 px-2 text-center uppercase font-bold text-[10px]">{d.dayName}</td>
                <td className="py-1.5 px-3 text-center">
                  {d.status !== '-' && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      d.status === 'Présent' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {d.status}
                    </span>
                  )}
                </td>
                <td className="py-1.5 px-3 text-right font-mono font-bold text-stone-700">
                  {d.hoursWorked > 0 ? `${d.hoursWorked}h` : '-'}
                </td>
                <td className="py-1.5 px-3 text-center font-bold font-mono">
                  {d.tasksDoneCount > 0 ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-[#2A7B76] border border-emerald-200 font-bold text-[10px]">
                      {d.tasksDoneCount} sous-tâche(s)
                    </span>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
