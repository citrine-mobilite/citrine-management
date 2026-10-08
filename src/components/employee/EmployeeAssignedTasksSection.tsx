import React from 'react';
import { Briefcase } from 'lucide-react';
import { Task, Employee } from '../../types';

interface EmployeeAssignedTasksSectionProps {
  myTasks?: Task[];
  tasks?: Task[];
  employeeProfile?: Employee;
  onUpdateTasks?: (updated: Task[]) => void;
}

export const EmployeeAssignedTasksSection: React.FC<EmployeeAssignedTasksSectionProps> = ({
  myTasks = [],
  tasks = [],
  employeeProfile,
}) => {
  const safeMyTasks = myTasks || [];
  const safeTasks = tasks || [];
  const effectiveTasks = safeMyTasks.length > 0 
    ? safeMyTasks 
    : safeTasks.filter(t => t && (!employeeProfile || t.assignedTo === employeeProfile.name || t.employeeId === employeeProfile.id));
  const list = effectiveTasks || [];

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
                className="p-4 rounded-xl border border-stone-200/80 hover:border-[#2A7B76]/50 bg-stone-50/40 space-y-2 transition shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-stone-900">{task.title}</span>
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

                {task.description && (
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    {task.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-200/60 font-mono">
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
