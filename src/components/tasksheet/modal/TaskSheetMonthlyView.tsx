import React, { useMemo, useState } from 'react';
import { CalendarDays, ListFilter } from 'lucide-react';
import { MonthlyTaskSheetData } from '../../../services/taskSheetService';

interface TaskSheetMonthlyViewProps {
  monthlyData: MonthlyTaskSheetData;
}

const WEEKDAY_HEADERS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getStatusCodeAndStyle(status: string, isWeekend: boolean) {
  if (status === 'Présent' || status === 'Mission') {
    return {
      code: status === 'Mission' ? 'M' : 'P',
      cellClass: 'bg-emerald-50/90 border-emerald-200 text-emerald-950',
      badgeClass: 'text-emerald-700 bg-emerald-100',
    };
  }
  if (status === 'En retard') {
    return {
      code: 'R',
      cellClass: 'bg-amber-50/90 border-amber-200 text-amber-950',
      badgeClass: 'text-amber-800 bg-amber-100',
    };
  }
  if (status === 'Absent') {
    return {
      code: 'A',
      cellClass: 'bg-rose-50/90 border-rose-200 text-rose-950',
      badgeClass: 'text-rose-800 bg-rose-100',
    };
  }
  if (isWeekend) {
    return {
      code: 'WE',
      cellClass: 'bg-stone-50/60 border-stone-200/60 text-stone-400',
      badgeClass: 'text-stone-400 bg-stone-100',
    };
  }
  return {
    code: '-',
    cellClass: 'bg-white border-stone-200 text-stone-500',
    badgeClass: 'text-stone-500 bg-stone-100',
  };
}

export const TaskSheetMonthlyView: React.FC<TaskSheetMonthlyViewProps> = ({ monthlyData }) => {
  const [presenceView, setPresenceView] = useState<'calendar' | 'full_table'>('calendar');

  const summary = useMemo(() => {
    const days = monthlyData.dailyBreakdown || [];
    const presentCount =
      monthlyData.presentDays ??
      days.filter((d) => d.status === 'Présent' || d.status === 'Mission').length;
    const lateCount =
      monthlyData.lateDays ?? days.filter((d) => d.status === 'En retard').length;
    const absentCount =
      monthlyData.absentDays ?? days.filter((d) => d.status === 'Absent').length;
    const activeDays = days.filter(
      (d) => d.status !== '-' || d.hoursWorked > 0 || d.tasksDoneCount > 0
    );
    const totalTasksDoneInDays = days.reduce((acc, d) => acc + (d.tasksDoneCount || 0), 0);

    let leadingEmptySlots = 0;
    if (days.length > 0) {
      const firstDate = new Date(days[0].date + 'T12:00:00');
      const jsDay = firstDate.getDay(); // 0=Sun..6=Sat
      leadingEmptySlots = jsDay === 0 ? 6 : jsDay - 1;
    }

    const completedParentCount = (monthlyData.tasksList || []).filter(
      (t) => t.status === 'completed'
    ).length;

    return {
      presentCount,
      lateCount,
      absentCount,
      activeDays,
      totalTasksDoneInDays,
      leadingEmptySlots,
      completedParentCount,
    };
  }, [monthlyData]);

  const subtasksDone = monthlyData.completedSubtasksCount || monthlyData.totalTasksCompleted;
  const subtasksTotal = monthlyData.totalSubtasksCount || monthlyData.totalTasksAssigned;
  const displayedDailyRows =
    presenceView === 'calendar' ? summary.activeDays : monthlyData.dailyBreakdown;

  return (
    <div className="space-y-5">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 border border-stone-200 rounded-2xl bg-white overflow-hidden">
        <div className="p-3.5">
          <span className="text-[11px] font-semibold text-stone-500 block">Assiduité &amp; Volume</span>
          <strong className="block text-xl font-bold font-serif text-[#164e4b] mt-0.5 tabular-nums">
            {monthlyData.totalDaysWorked}j/{monthlyData.workingDaysInMonth}j · {monthlyData.totalHoursWorked}h
          </strong>
          <span className="text-[11px] text-stone-500 tabular-nums">
            {summary.presentCount} P · {summary.lateCount} R · {summary.absentCount} A
            {monthlyData.weekendDaysWorked > 0 ? ` · +${monthlyData.weekendDaysWorked}j WE` : ''}
          </span>
        </div>

        <div className="p-3.5">
          <span className="text-[11px] font-semibold text-stone-500 block">Rendement Sous-Tâches</span>
          <strong className="block text-xl font-bold font-serif text-[#2A7B76] mt-0.5 tabular-nums">
            {monthlyData.completionRate}%
          </strong>
          <span className="text-[11px] text-stone-500 tabular-nums">
            {subtasksDone}/{subtasksTotal} validées
          </span>
        </div>

        <div className="p-3.5">
          <span className="text-[11px] font-semibold text-stone-500 block">Sous-Tâches Clôturées</span>
          <strong className="block text-xl font-bold font-serif text-emerald-700 mt-0.5 tabular-nums">
            {subtasksDone} / {subtasksTotal}
          </strong>
          <span className="text-[11px] text-stone-500 tabular-nums">
            {summary.totalTasksDoneInDays} clôturée(s) datées
          </span>
        </div>

        <div className="p-3.5">
          <span className="text-[11px] font-semibold text-stone-500 block">Missions Achevé(es)</span>
          <strong className="block text-xl font-bold font-serif text-amber-700 mt-0.5 tabular-nums">
            {summary.completedParentCount} / {(monthlyData.tasksList || []).length}
          </strong>
          <span className="text-[11px] text-stone-500 tabular-nums">
            {(monthlyData.tasksList || []).filter((t) => t.isMilestone).length} jalon(s)
          </span>
        </div>
      </div>

      {/* Synthèse Journalière des Présences — Optimal Calendar + Active Ledger */}
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
        <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-serif font-bold text-sm text-stone-900">
            Synthèse des Présences &amp; Activité du Mois
          </h4>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-3 text-[11px] text-stone-600 mr-2">
              <span className="inline-flex items-center gap-1">
                <span className="px-1.5 py-0.2 rounded font-bold bg-emerald-100 text-emerald-800">P</span>
                Présent
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800">R</span>
                Retard
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="px-1.5 py-0.2 rounded font-bold bg-rose-100 text-rose-800">A</span>
                Absent
              </span>
            </div>

            <div className="flex items-center bg-stone-200/70 p-0.5 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setPresenceView('calendar')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  presenceView === 'calendar'
                    ? 'bg-white text-[#164e4b] shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Calendrier &amp; Actifs</span>
              </button>
              <button
                type="button"
                onClick={() => setPresenceView('full_table')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  presenceView === 'full_table'
                    ? 'bg-white text-[#164e4b] shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ListFilter className="h-3.5 w-3.5" />
                <span>Journal complet ({monthlyData.workingDaysInMonth}j ouvrés)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 7-column Calendar Matrix (always rendered in calendar mode) */}
        {presenceView === 'calendar' && (
          <div className="p-3.5 border-b border-stone-200 bg-white">
            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
              {WEEKDAY_HEADERS.map((wd) => (
                <div
                  key={wd}
                  className="text-center text-[10px] font-bold text-stone-500 py-1 uppercase tracking-wider"
                >
                  {wd}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: summary.leadingEmptySlots }).map((_, emptyIdx) => (
                <div key={`empty-${emptyIdx}`} className="h-14 rounded-xl bg-stone-50/40" />
              ))}

              {monthlyData.dailyBreakdown.map((d) => {
                const dayNum = d.date.slice(8, 10);
                const dateObj = new Date(d.date + 'T12:00:00');
                const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                const style = getStatusCodeAndStyle(d.status, isWeekend);

                return (
                  <div
                    key={d.date}
                    className={`min-h-[56px] p-1.5 rounded-xl border flex flex-col justify-between tabular-nums ${style.cellClass}`}
                    title={`${d.date} (${d.dayName}) · ${d.status !== '-' ? d.status : 'Aucun pointage'}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold">{dayNum}</span>
                      <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${style.badgeClass}`}>
                        {style.code}
                      </span>
                    </div>

                    <div className="text-[9px] leading-tight space-y-0.5">
                      {d.arrivalTime !== '-' ? (
                        <div className="font-mono font-semibold truncate">
                          {d.arrivalTime}
                          {d.departureTime !== '-' ? `-${d.departureTime}` : ''}
                        </div>
                      ) : d.hoursWorked > 0 ? (
                        <div className="font-mono font-semibold">{d.hoursWorked}h</div>
                      ) : null}
                      {d.tasksDoneCount > 0 && (
                        <div className="font-bold text-[#164e4b]">
                          {d.tasksDoneCount} t.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* High-density Daily Table (Active days by default, or full month toggle) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-stone-50 text-stone-600 font-bold text-[10px] uppercase border-b border-stone-200">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-2 text-center">Jour</th>
                <th className="py-2.5 px-3 text-center">Arrivée</th>
                <th className="py-2.5 px-3 text-center">Départ</th>
                <th className="py-2.5 px-3 text-right">Heures</th>
                <th className="py-2.5 px-3 text-center">Statut</th>
                <th className="py-2.5 px-3 text-right">Sous-tâches</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {displayedDailyRows.map((d) => (
                <tr
                  key={d.date}
                  className={
                    d.hoursWorked > 0 || d.tasksDoneCount > 0
                      ? 'bg-white hover:bg-stone-50/70'
                      : 'bg-stone-50/40 text-stone-400'
                  }
                >
                  <td className="py-2 px-3 font-mono text-stone-800">{d.date}</td>
                  <td className="py-2 px-2 text-center uppercase font-bold text-[10px]">
                    <span>{d.dayName}</span>
                    {d.isWeekend && (d.hoursWorked > 0 || d.tasksDoneCount > 0 || d.status !== '-') && (
                      <span className="ml-1 px-1 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px]">WE</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-stone-700">
                    {d.arrivalTime}
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-stone-700">
                    {d.departureTime}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-stone-800">
                    {d.hoursWorked > 0 ? `${d.hoursWorked}h` : '-'}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {d.status !== '-' ? (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          d.status === 'Présent' || d.status === 'Mission'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : d.status === 'En retard'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {d.status}
                      </span>
                    ) : (
                      <span className="text-stone-300">-</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-[#164e4b]">
                    {d.tasksDoneCount > 0 ? `${d.tasksDoneCount}` : '-'}
                  </td>
                </tr>
              ))}

              {displayedDailyRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-stone-400 italic">
                    Aucun pointage ni activité enregistrée pour ce mois.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-stone-50 border-t border-stone-200 font-bold text-xs text-stone-800">
              <tr>
                <td colSpan={4} className="py-2.5 px-3">
                  Total du mois ({monthlyData.totalDaysWorked}j / {monthlyData.workingDaysInMonth}j ouvrés
                  {monthlyData.weekendDaysWorked > 0 ? ` · dont ${monthlyData.weekendDaysWorked}j WE` : ''})
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-[#164e4b]">
                  {monthlyData.totalHoursWorked}h
                </td>
                <td className="py-2.5 px-3 text-center text-[11px] font-medium text-stone-600">
                  {summary.presentCount} P · {summary.lateCount} R · {summary.absentCount} A
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-[#164e4b]">
                  {summary.totalTasksDoneInDays}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Relevé des Tâches & Sous-Tâches du Mois */}
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
        <div className="bg-[#164e4b] text-white px-4 py-2.5 font-bold text-xs flex items-center justify-between">
          <span>Tâches &amp; Sous-Tâches du Mois</span>
          <span className="text-[11px] text-emerald-200 font-mono tabular-nums">
            {(monthlyData.tasksList || []).length} mission(s)
          </span>
        </div>

        <div className="divide-y divide-stone-200">
          {(monthlyData.tasksList || []).map((t) => {
            const isTaskDone = t.status === 'completed';
            return (
              <div key={t.id} className="p-3.5 hover:bg-stone-50/50 transition space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        isTaskDone
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : t.status === 'blocked'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {isTaskDone ? 'Terminée' : t.status === 'blocked' ? 'Bloquée' : 'En cours'}
                    </span>
                    <h4 className="font-bold text-xs text-stone-900 truncate">{t.title}</h4>
                    {t.isMilestone && (
                      <span className="text-[10px] font-bold text-amber-700">· Jalon</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs tabular-nums">
                    <span className="text-[11px] font-mono text-stone-500">
                      {t.completedSubtasks}/{t.totalSubtasks}
                    </span>
                    <div className="w-24 bg-stone-100 h-2 rounded-full overflow-hidden border border-stone-200">
                      <div
                        className={`h-full ${isTaskDone ? 'bg-emerald-500' : 'bg-[#2A7B76]'}`}
                        style={{ width: `${t.completionPercentage}%` }}
                      />
                    </div>
                    <span className="font-bold font-mono text-[11px] text-[#2A7B76] w-9 text-right">
                      {t.completionPercentage}%
                    </span>
                  </div>
                </div>

                {t.subtasks && t.subtasks.length > 0 && (
                  <div className="pl-3 space-y-1">
                    {t.subtasks.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-2 text-xs py-1.5 px-2.5 rounded-lg bg-stone-50 border border-stone-200/70"
                      >
                        <span
                          className={`truncate ${
                            s.completed ? 'line-through text-stone-400' : 'text-stone-800 font-medium'
                          }`}
                        >
                          {s.title}
                        </span>
                        <span
                          className={`text-[10px] font-bold shrink-0 ${
                            s.completed ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
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
              Aucune tâche enregistrée sur ce mois.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
