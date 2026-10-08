import React from 'react';
import { ListTodo, ChevronRight, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import { Task, Reminder } from '../../types';
import { TabType } from '../Sidebar';

interface DashboardQuickTasksWidgetProps {
  tasks: Task[];
  reminders: Reminder[];
  onSelectTab: (tab: TabType) => void;
}

export const DashboardQuickTasksWidget: React.FC<DashboardQuickTasksWidgetProps> = ({
  tasks,
  reminders,
  onSelectTab,
}) => {
  const pendingTasks = tasks.filter((t) => t.status !== 'termine');
  const activeReminders = reminders.filter((r) => r.status === 'pending');

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-[#2A7B76]" />
          <h3 className="font-serif font-bold text-xs text-stone-900">
            Tâches Prioritaires & Alertes
          </h3>
          <span className="bg-[#D4A82F]/20 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
            {pendingTasks.length + activeReminders.length}
          </span>
        </div>
        <button
          onClick={() => onSelectTab('tasks')}
          className="text-[11px] text-[#2A7B76] hover:text-[#20635F] font-bold flex items-center gap-0.5 transition cursor-pointer"
        >
          <span>Gérer</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="divide-y divide-stone-100 overflow-y-auto max-h-[380px]">
        {pendingTasks.length === 0 && activeReminders.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-xs italic">
            Aucune tâche urgente ou alerte en attente.
          </div>
        ) : (
          <>
            {activeReminders.slice(0, 3).map((rem) => (
              <div
                key={rem.id}
                onClick={() => onSelectTab('reminders')}
                className="p-3.5 bg-amber-50/40 hover:bg-amber-50/80 transition flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-amber-950 group-hover:text-amber-900 truncate">
                      {rem.title}
                    </h4>
                    <p className="text-[10px] text-amber-800/80 truncate">{rem.description}</p>
                  </div>
                </div>
                <span className="text-[9px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-full shrink-0">
                  Alerte
                </span>
              </div>
            ))}

            {pendingTasks.slice(0, 6).map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectTab('tasks')}
                className="p-3.5 hover:bg-stone-50/80 transition flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      task.priority === 'urgent'
                        ? 'bg-red-500'
                        : task.priority === 'haut'
                        ? 'bg-amber-500'
                        : 'bg-[#2A7B76]'
                    }`}
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-stone-900 group-hover:text-[#2A7B76] transition truncate">
                      {task.title}
                    </h4>
                    <p className="text-[10px] text-stone-400 truncate flex items-center gap-1.5">
                      <span>{task.category || 'Général'}</span>
                      {task.dueDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Calendar className="h-2.5 w-2.5" /> {task.dueDate}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    task.status === 'en_cours'
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {task.status === 'en_cours' ? 'En cours' : 'À faire'}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
