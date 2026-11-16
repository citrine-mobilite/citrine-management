import React from 'react';
import { Users, Clock, CheckSquare, Bell, Settings, Repeat } from 'lucide-react';
import { Reminder, Task } from '../../types';
import { TabType } from '../Sidebar';
import { HumaanRelaxedState } from '../illustrations/HumaanIllustrations';
import {
  computeReminderUrgency,
  formatDeadlineFrenchDate,
  formatNextOccurrenceBadge,
  formatRoutineRecurrenceLabel,
} from '../../services/reminderService';

interface AdminDashboardBottomWidgetsProps {
  sortedReminders: Reminder[];
  upcomingRoutines?: Reminder[];
  activeRemindersCount: number;
  pendingTasks: Task[];
  onSelectTab: (tab: TabType) => void;
}

export const AdminDashboardBottomWidgets: React.FC<AdminDashboardBottomWidgetsProps> = ({
  sortedReminders,
  upcomingRoutines = [],
  activeRemindersCount,
  pendingTasks,
  onSelectTab,
}) => {
  const unresolvedDeadlines = sortedReminders.filter((r) => computeReminderUrgency(r).level !== 'resolved');

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200/60 pb-2">
            <h4 className="text-xs font-serif font-bold text-stone-900 flex items-center gap-1.5">
              <Bell className="h-4 w-4 text-[#2A7B76]" />
              Échéances & Rituels
            </h4>
            <div className="flex items-center gap-1.5">
              {upcomingRoutines.length > 0 && (
                <span className="text-[10px] font-mono tabular-nums bg-emerald-50 text-[#2A7B76] font-bold px-2 py-0.5 rounded-lg border border-emerald-200/70">
                  {upcomingRoutines.length} rituel{upcomingRoutines.length > 1 ? 's' : ''}
                </span>
              )}
              <span className="text-[10px] font-mono tabular-nums bg-stone-100 text-stone-700 font-bold px-2 py-0.5 rounded-lg border border-stone-200/70">
                {activeRemindersCount} urgente{activeRemindersCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="py-2 text-center flex flex-col items-center justify-center">
            {unresolvedDeadlines.length === 0 && upcomingRoutines.length === 0 ? (
              <div className="flex flex-col items-center py-2 space-y-1">
                <HumaanRelaxedState className="w-20 h-20" />
                <p className="text-stone-600 font-bold text-xs">Tout est sous contrôle !</p>
                <p className="text-stone-400 text-[10px]">Aucune échéance urgente ni réunion planifiée.</p>
              </div>
            ) : (
              <div className="w-full text-left space-y-2 max-h-44 overflow-y-auto">
                {unresolvedDeadlines.slice(0, 2).map((r) => {
                  const u = computeReminderUrgency(r);
                  return (
                    <div
                      key={r.id}
                      className="p-2.5 glass-chip rounded-xl flex items-center justify-between gap-2 text-[11px]"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-stone-900 truncate">{r.title}</p>
                        <p className="text-[10px] text-stone-500 truncate">
                          {r.entityName ? `${r.entityName} · ` : ''}
                          {formatDeadlineFrenchDate(u.targetDateStr)}
                        </p>
                      </div>
                      <span
                        className={`font-mono tabular-nums font-bold text-[10px] shrink-0 ${
                          u.level === 'expired' || u.level === 'critical'
                            ? 'text-rose-700'
                            : u.level === 'warning'
                            ? 'text-amber-700'
                            : 'text-[#2A7B76]'
                        }`}
                      >
                        {u.shortCountdown}
                      </span>
                    </div>
                  );
                })}

                {upcomingRoutines.slice(0, unresolvedDeadlines.length > 0 ? 2 : 3).map((r) => (
                  <div
                    key={r.id}
                    className="p-2.5 bg-emerald-50/50 border border-emerald-200/60 rounded-xl flex items-center justify-between gap-2 text-[11px]"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <Repeat className="h-3.5 w-3.5 text-[#2A7B76] shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-stone-900 truncate">{r.title}</p>
                        <p className="text-[10px] text-stone-500 truncate">
                          {formatRoutineRecurrenceLabel(r)}
                          {r.location ? ` · ${r.location}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono tabular-nums font-bold text-[10px] text-[#2A7B76] shrink-0">
                      {formatNextOccurrenceBadge(r).label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onSelectTab('reminders')}
            className="w-full py-2 glass-chip text-stone-700 hover:text-stone-900 font-bold rounded-xl text-[10px] transition cursor-pointer text-center"
          >
            Ouvrir Échéances & Rappels &gt;
          </button>
        </div>

        <div className="glass-card rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200/60 pb-2">
            <h4 className="text-xs font-serif font-bold text-stone-900 flex items-center gap-1.5">
              <CheckSquare className="h-4 w-4 text-[#2A7B76]" />
              Tâches en Cours ({pendingTasks.length})
            </h4>
          </div>

          <div className="py-2 space-y-2">
            {pendingTasks.length === 0 ? (
              <p className="text-stone-400 italic text-[11px] text-center py-4">Aucune tâche en cours.</p>
            ) : (
              pendingTasks.slice(0, 1).map((t) => (
                <div key={t.id} className="p-3 glass-chip rounded-2xl flex items-center justify-between gap-3 text-[11px]">
                  <div className="space-y-0.5 min-w-0">
                    <span className="block font-bold text-stone-900 truncate">{t.title}</span>
                    <span className="block text-[10px] text-stone-500">Assigné à : {t.assignedTo}</span>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 bg-stone-100 border text-stone-600 rounded-md shrink-0 uppercase tracking-wide">
                    Normale
                  </span>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => onSelectTab('tasks')}
            className="w-full py-2 glass-chip text-stone-700 hover:text-stone-900 font-bold rounded-xl text-[10px] transition cursor-pointer text-center"
            title="Voir la liste complète des tâches"
          >
            Accéder aux tâches &gt;
          </button>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200/60 pb-2.5">
          <h4 className="text-xs font-serif font-bold text-stone-900 flex items-center gap-1.5">
            <Settings className="h-4 w-4 text-[#2A7B76]" />
            Raccourcis Directs
          </h4>
          <button
            onClick={() => onSelectTab('settings')}
            className="text-[10px] font-bold text-[#2A7B76] hover:underline flex items-center gap-1 cursor-pointer"
            title="Ouvrir la configuration des paramètres et modules"
          >
            Paramètres & Modules &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => onSelectTab('collaborators')}
            className="flex items-center gap-3 p-3 bg-stone-50/50 hover:bg-emerald-50/30 rounded-2xl border border-stone-200/80 cursor-pointer transition"
            title="Ouvrir l'annuaire des collaborateurs"
          >
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-stone-800">Annuaire</span>
          </div>

          <div
            onClick={() => onSelectTab('presences')}
            className="flex items-center gap-3 p-3 bg-stone-50/50 hover:bg-emerald-50/30 rounded-2xl border border-stone-200/80 cursor-pointer transition"
            title="Ouvrir le module de pointage"
          >
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-stone-800">Pointage</span>
          </div>

          <div
            onClick={() => onSelectTab('tasks')}
            className="flex items-center gap-3 p-3 bg-stone-50/50 hover:bg-emerald-50/30 rounded-2xl border border-stone-200/80 cursor-pointer transition"
            title="Ouvrir le module des tâches"
          >
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 shrink-0">
              <CheckSquare className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-stone-800">Tâches</span>
          </div>

          <div
            onClick={() => onSelectTab('settings')}
            className="flex items-center gap-3 p-3 bg-stone-50/50 hover:bg-emerald-50/30 rounded-2xl border border-stone-200/80 cursor-pointer transition"
            title="Ouvrir les paramètres"
          >
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <Settings className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-stone-800">Paramètres</span>
          </div>
        </div>
      </div>
    </>
  );
};
