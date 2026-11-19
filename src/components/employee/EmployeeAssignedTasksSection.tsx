import React from 'react';
import { Briefcase, CheckCircle, Clock, PlayCircle } from 'lucide-react';
import { Task, Employee, NotificationLog, TaskStatus } from '../../types';

interface EmployeeAssignedTasksSectionProps {
  myTasks?: Task[];
  tasks?: Task[];
  employeeProfile?: Employee;
  onUpdateTasks?: (updated: Task[]) => void;
  onAddNotification?: (log: NotificationLog) => void;
}

export const EmployeeAssignedTasksSection: React.FC<EmployeeAssignedTasksSectionProps> = ({
  myTasks = [],
  tasks = [],
  employeeProfile,
  onUpdateTasks,
  onAddNotification,
}) => {
  const safeMyTasks = myTasks || [];
  const safeTasks = tasks || [];
  const effectiveTasks = safeMyTasks.length > 0 
    ? safeMyTasks 
    : safeTasks.filter(t => t && (!employeeProfile || t.assignedTo === employeeProfile.name || t.employeeId === employeeProfile.id));
  const list = effectiveTasks || [];

  const handleUpdateStatus = (task: Task, newStatus: TaskStatus) => {
    if (!onUpdateTasks) return;
    const all = safeTasks.length > 0 ? safeTasks : list;
    const updated = all.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t));
    onUpdateTasks(updated);

    const statusLabels: Record<string, string> = {
      todo: 'À faire',
      in_progress: 'En cours',
      review: 'En révision',
      completed: 'Terminée',
    };
    const label = statusLabels[newStatus] || newStatus;
    const recipient = employeeProfile?.id || task.assignedTo || 'Collaborateur';

    if (onAddNotification) {
      onAddNotification({
        id: `notif-task-move-${Date.now()}-${task.id}`,
        recipient,
        type: 'system',
        title: `Mouvement de Tâche : ${task.title}`,
        content: `La tâche est passée au statut « ${label} ».`,
        payload: JSON.stringify({
          source: 'task_movement',
          taskId: task.id,
          employeeId: recipient,
          newStatus,
          previousStatus: task.status,
        }),
        timestamp: new Date().toISOString(),
        read: false,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('citrine:new_unread_alert'));
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="text-xs font-serif font-bold text-stone-900 flex items-center gap-1.5">
            <Briefcase className="h-4 w-4 text-[#2A7B76]" /> Tâches & Jalons qui m'ont été attribués
          </h3>
          <span className="text-[10px] text-stone-400 font-mono">
            {list.length} tâches actives
          </span>
        </div>

        {list.length === 0 ? (
          <div className="p-8 text-center text-stone-400 italic text-xs bg-stone-50 rounded-xl border border-stone-200 border-dashed">
            Aucune tâche ne vous est assignée actuellement.
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-xl border border-stone-200/80 hover:border-[#2A7B76]/50 bg-stone-50/40 space-y-2.5 transition shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-stone-900">{task.title}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 ${
                        task.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : task.status === 'in_progress'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {task.status === 'completed'
                        ? 'Terminée'
                        : task.status === 'in_progress'
                        ? 'En cours'
                        : 'À faire'}
                    </span>
                  </div>
                </div>

                {task.description && (
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    {task.description}
                  </p>
                )}

                {/* Quick Status Action Buttons */}
                <div className="flex items-center gap-1.5 pt-1">
                  {task.status !== 'in_progress' && task.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(task, 'in_progress')}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <PlayCircle className="w-3 h-3" />
                      <span>Démarrer</span>
                    </button>
                  )}
                  {task.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(task, 'completed')}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Terminer</span>
                    </button>
                  )}
                  {task.status === 'completed' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(task, 'in_progress')}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Clock className="w-3 h-3" />
                      <span>Rouvrir</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1.5 border-t border-stone-200/60 font-mono">
                  <span>
                    Échéance : {task.date} à {task.time}
                  </span>
                  <span className="font-semibold">
                    Priorité : {task.priority === 'high' ? 'Haute 🔴' : 'Normale 🟡'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
