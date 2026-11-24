import React, { useMemo, useState } from 'react';
import { Bell, Calendar, Clock, Download, FileText, Repeat } from 'lucide-react';
import { Employee, NotificationLog, Presence, Reminder, SalaryPayment, StrategicProject, Task } from '../../types';
import { downloadPayslipPdf } from '../../services/pdfExportService';
import {
  computeReminderUrgency,
  doesRoutineOccurOnDate,
  formatDeadlineFrenchDate,
  formatNextOccurrenceBadge,
  getScopedRemindersForEmployee,
  isRoutineReminder,
} from '../../services/reminderService';
import { CollaboratorPresenceMap } from '../CollaboratorPresenceMap';
import { UserStatisticsSummaryPanel } from '../presence/statistics/UserStatisticsSummaryPanel';
import { EmployeeRendementDetailModal } from '../presence/statistics/EmployeeRendementDetailModal';
import { computePresenceStatistics } from '../presence/statistics/statisticsCalculations';
import { TaskSheetModal } from '../tasksheet/TaskSheetModal';
import { CollaboratorDetailTab, formatCollaboratorXAF } from './collaboratorConstants';
import { CollaboratorPresencesAndMissionsTab } from './CollaboratorPresencesAndMissionsTab';

interface CollaboratorDetailTabsProps {
  emp: Employee;
  activeDetailTab: CollaboratorDetailTab;
  empPayslips: SalaryPayment[];
  empPresences: Presence[];
  empTasks: Task[];
  allTasks?: Task[];
  reminders?: Reminder[];
  notifications?: NotificationLog[];
  strategicProjects?: StrategicProject[];
  rhReportMonth: string;
  setRhReportMonth: (m: string) => void;
  isGeneratingRhReport: boolean;
  onGenerateMonthlyReport: (emp: Employee, month: string) => void;
}

export const CollaboratorDetailTabs: React.FC<CollaboratorDetailTabsProps> = ({
  emp,
  activeDetailTab,
  empPayslips,
  empPresences,
  empTasks,
  allTasks = [],
  reminders = [],
  notifications = [],
  strategicProjects = [],
  rhReportMonth,
  setRhReportMonth,
  isGeneratingRhReport,
  onGenerateMonthlyReport,
}) => {
  const [taskSheetState, setTaskSheetState] = useState<{
    employee: Employee;
    mode: 'day' | 'month' | 'year';
  } | null>(null);
  const [rendementModalEmployee, setRendementModalEmployee] = useState<Employee | null>(null);

  const tasksSource = allTasks.length > 0 ? allTasks : empTasks;

  const assiduiteRate = useMemo(() => {
    const res = computePresenceStatistics([emp], empPresences, 'all');
    return res.statsByEmployee[0]?.assiduiteRate ?? 100;
  }, [emp, empPresences]);

  return (
    <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs">
      {activeDetailTab === 'statistics' && (
        <UserStatisticsSummaryPanel
          employee={emp}
          presences={empPresences}
          tasks={tasksSource}
          reminders={reminders}
          notifications={notifications}
          strategicProjects={strategicProjects}
          salaryPayments={empPayslips}
          onOpenTaskSheet={(targetEmp, mode) => setTaskSheetState({ employee: targetEmp, mode })}
          onOpenFullRendement={(targetEmp) => setRendementModalEmployee(targetEmp)}
        />
      )}

      {activeDetailTab === 'payslips' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-serif font-bold text-xs text-stone-900">
              Registre des bulletins d&apos;embauche
            </h4>
            <span className="text-[10px] text-stone-500 font-bold bg-stone-50 px-2 py-0.5 rounded-md border">
              Devise : FCFA / XAF
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-100 text-stone-400 font-bold pb-2 uppercase tracking-wide text-[10px]">
                  <th className="pb-3">Période</th>
                  <th className="pb-3">Base</th>
                  <th className="pb-3">Net à payer</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {empPayslips.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-stone-400 italic">
                      Aucune fiche de paie enregistrée pour cet employé.
                    </td>
                  </tr>
                ) : (
                  empPayslips.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50/50">
                      <td className="py-3 font-bold text-stone-900">{p.period}</td>
                      <td className="py-3 font-mono text-stone-600">
                        {formatCollaboratorXAF(p.baseAmount)}
                      </td>
                      <td className="py-3 font-bold text-emerald-800 font-mono">
                        {formatCollaboratorXAF(p.netAmount)}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => downloadPayslipPdf(p, emp)}
                          className="p-1 rounded bg-emerald-50 text-[#2A7B76] hover:bg-[#2A7B76] hover:text-white transition cursor-pointer"
                          title="Télécharger PDF"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(activeDetailTab === 'presences' || activeDetailTab === 'missions') && (
        <CollaboratorPresencesAndMissionsTab
          mode={activeDetailTab}
          emp={emp}
          empPresences={empPresences}
          rhReportMonth={rhReportMonth}
          setRhReportMonth={setRhReportMonth}
          isGeneratingRhReport={isGeneratingRhReport}
          onGenerateMonthlyReport={onGenerateMonthlyReport}
        />
      )}

      {activeDetailTab === 'map' && (
        <div className="space-y-3">
          <h4 className="font-serif font-bold text-xs text-stone-900 pb-1">
            Positions GPS des pointages
          </h4>
          <CollaboratorPresenceMap
            presences={empPresences}
            employeeName={emp.name}
            avatarUrl={emp.avatarUrl}
          />
        </div>
      )}

      {activeDetailTab === 'alerts' && (() => {
        const scopedReminders = getScopedRemindersForEmployee(reminders, emp);
        const empTokens = [emp.id, emp.name, emp.email]
          .filter(Boolean)
          .map((v) => String(v).trim().toLowerCase());
        const scopedNotifs = notifications
          .filter((n) => {
            const rec = String(n.recipient || '').trim().toLowerCase();
            return rec === 'tous' || empTokens.includes(rec);
          })
          .slice(0, 10);

        if (scopedReminders.length === 0 && scopedNotifs.length === 0) {
          return (
            <div className="p-8 text-center text-xs text-stone-400 italic">
              Aucune alerte, échéance ou notification active pour ce collaborateur.
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <h4 className="font-serif font-bold text-xs text-stone-900 pb-2 border-b border-stone-100 flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#2A7B76]" />
              Échéances, Rappels &amp; Notifications de {emp.name}
            </h4>

            {scopedReminders.length > 0 && (
              <div className="space-y-2">
                {scopedReminders.map((rem) => {
                  const routine = isRoutineReminder(rem);
                  if (routine) {
                    const occursToday = doesRoutineOccurOnDate(rem);
                    const nextBadge = formatNextOccurrenceBadge(rem);
                    return (
                      <div
                        key={rem.id}
                        className="p-3 rounded-xl border border-stone-200/80 bg-stone-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Repeat className="h-3.5 w-3.5 text-[#2A7B76] shrink-0" />
                            <span className="font-bold text-stone-900">{rem.title || rem.note}</span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                rem.stopped
                                  ? 'bg-stone-100 text-stone-500 border-stone-200'
                                  : occursToday
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-white text-stone-600 border-stone-200'
                              }`}
                            >
                              {rem.stopped ? 'En pause' : occursToday ? 'Rappel Jour J' : `Programmé · ${nextBadge.label}`}
                            </span>
                          </div>
                          {rem.note && rem.note !== rem.title && (
                            <p className="text-[11px] text-stone-500 pl-5">{rem.note}</p>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-stone-600 shrink-0 inline-flex items-center gap-1">
                          <Clock className="h-3 w-3 text-stone-400" />
                          {rem.time || '09:00'}
                        </span>
                      </div>
                    );
                  }

                  const urgency = computeReminderUrgency(rem);
                  return (
                    <div
                      key={rem.id}
                      className="p-3 rounded-xl border border-stone-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <FileText className="h-3.5 w-3.5 text-[#2A7B76] shrink-0" />
                          <span className="font-bold text-stone-900">{rem.title || rem.note}</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              urgency.level === 'expired' || urgency.level === 'critical'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : urgency.level === 'warning'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : urgency.level === 'resolved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-stone-100 text-stone-600 border-stone-200'
                            }`}
                          >
                            {urgency.statusLabel}
                          </span>
                        </div>
                        {rem.note && rem.note !== rem.title && (
                          <p className="text-[11px] text-stone-500 pl-5">{rem.note}</p>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-stone-600 shrink-0 inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-stone-400" />
                        {formatDeadlineFrenchDate(urgency.targetDateStr)} (J-{urgency.leadDays})
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {scopedNotifs.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <h5 className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
                  Notifications récentes ({scopedNotifs.length})
                </h5>
                {scopedNotifs.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/70 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-stone-900 block truncate">{n.title}</span>
                      <span className="text-[11px] text-stone-500 block truncate">{n.content}</span>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400 shrink-0">
                      {n.timestamp ? n.timestamp.split('T')[0] : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {activeDetailTab === 'tasks' && (
        <div className="space-y-3">
          <h4 className="font-serif font-bold text-xs text-stone-900 pb-2 border-b border-stone-100">
            Liste des tâches assignées en cours
          </h4>
          <div className="space-y-2">
            {empTasks.length === 0 ? (
              <p className="text-stone-400 italic text-xs py-4 text-center">
                Aucune tâche assignée non terminée.
              </p>
            ) : (
              empTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/60"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-stone-900">{t.title}</span>
                    <p className="text-[10px] text-stone-400">
                      Échéance : {t.dueDate || t.date || 'Non fixée'} {t.time ? `à ${t.time}` : ''}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                      t.priority === 'high'
                        ? 'bg-rose-50 text-rose-700'
                        : t.priority === 'medium'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {taskSheetState && (
        <TaskSheetModal
          isOpen={Boolean(taskSheetState)}
          onClose={() => setTaskSheetState(null)}
          employee={taskSheetState.employee}
          allTasks={tasksSource}
          presences={empPresences}
          reminders={reminders}
          notifications={notifications}
          strategicProjects={strategicProjects}
          defaultMode={taskSheetState.mode}
        />
      )}

      {rendementModalEmployee && (
        <EmployeeRendementDetailModal
          isOpen={Boolean(rendementModalEmployee)}
          onClose={() => setRendementModalEmployee(null)}
          employee={rendementModalEmployee}
          tasks={tasksSource}
          assiduiteRate={assiduiteRate}
        />
      )}
    </div>
  );
};
