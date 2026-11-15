import React, { useState } from 'react';
import { X, CheckSquare, Clock, Trophy, ShieldCheck } from 'lucide-react';
import { Employee, Task, Subtask, TaskStatus } from '../../../types';
import { haptic } from '../../../services/hapticService';
import {
  RendementTaskDurationChart,
  RendementTaskAccordionList,
  TaskWithDuration,
} from './RendementDetailSections';

interface EmployeeRendementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  tasks: Task[];
  assiduiteRate: number;
  onUpdateTask?: (updatedTask: Task) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const EmployeeRendementDetailModal: React.FC<EmployeeRendementDetailModalProps> = ({
  isOpen,
  onClose,
  employee,
  tasks,
  assiduiteRate,
  onUpdateTask,
  showToast,
}) => {
  if (!isOpen) return null;

  const employeeTasks = tasks.filter(
    (t) =>
      t.employeeId === employee.id ||
      t.assignedTo === employee.name ||
      t.assignedTo === employee.email
  );

  const totalAssigned = employeeTasks.length;
  const completedTasks = employeeTasks.filter((t) => t.status === 'completed').length;
  const taskCompletionRate = totalAssigned > 0 ? Math.round((completedTasks / totalAssigned) * 100) : 0;
  const globalScore = Math.round((assiduiteRate + taskCompletionRate) / 2);

  const tasksWithDuration: TaskWithDuration[] = employeeTasks.map((t) => {
    let estimatedHours = 4;
    if (t.priority === 'high' || t.priority === 'urgent') estimatedHours = 8;
    else if (t.priority === 'low') estimatedHours = 2;
    if (t.subtasks && t.subtasks.length > 0) {
      estimatedHours = Math.max(estimatedHours, t.subtasks.length * 2);
    }
    return { ...t, estimatedHours };
  });

  const sortedTasks = [...tasksWithDuration].sort((a, b) => b.estimatedHours - a.estimatedHours);
  const maxHours = Math.max(...sortedTasks.map((t) => t.estimatedHours), 1);

  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(sortedTasks[0]?.id || null);
  const [newSubtaskTitles, setNewSubtaskTitles] = useState<{ [taskId: string]: string }>({});

  const handleToggleSubtask = (task: Task, subtaskId: string) => {
    haptic.light();
    const updatedSubtasks = (task.subtasks || []).map((sub) => {
      if (sub.id === subtaskId) {
        const nextCompleted = !sub.completed;
        return {
          ...sub,
          completed: nextCompleted,
          status: nextCompleted ? ('completed' as TaskStatus) : ('todo' as TaskStatus),
        };
      }
      return sub;
    });

    const allCompleted =
      updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.completed || s.status === 'completed');
    const newStatus = allCompleted ? 'completed' : task.status === 'completed' ? 'in_progress' : task.status;

    onUpdateTask?.({
      ...task,
      status: newStatus as TaskStatus,
      subtasks: updatedSubtasks,
      lastUpdatedTime: new Date().toISOString(),
    });
    showToast?.('Sous-tâche mise à jour avec succès.', 'success');
  };

  const handleAddSubtask = (task: Task) => {
    const title = (newSubtaskTitles[task.id] || '').trim();
    if (!title) return;
    haptic.medium();

    const newSub: Subtask = { id: `sub-${Date.now()}`, title, completed: false };
    onUpdateTask?.({
      ...task,
      subtasks: [...(task.subtasks || []), newSub],
      lastUpdatedTime: new Date().toISOString(),
    });
    setNewSubtaskTitles({ ...newSubtaskTitles, [task.id]: '' });
    showToast?.('Sous-tâche ajoutée avec succès.', 'success');
  };

  const handleDeleteSubtask = (task: Task, subtaskId: string) => {
    haptic.light();
    onUpdateTask?.({
      ...task,
      subtasks: (task.subtasks || []).filter((sub) => sub.id !== subtaskId),
      lastUpdatedTime: new Date().toISOString(),
    });
    showToast?.('Sous-tâche supprimée.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
        <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-900 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-bold font-serif text-lg">
              {employee.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg md:text-xl">{employee.name}</h2>
              <p className="text-xs text-emerald-100/90">
                {employee.department || 'Général'} • {employee.position || 'Collaborateur'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition cursor-pointer text-white"
            title="Fermer la fenêtre"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Score Global</span>
              <div className="flex items-center gap-2 mt-1">
                <Trophy className="h-5 w-5 text-amber-600" />
                <span className="font-serif font-bold text-xl text-stone-900">{globalScore}%</span>
              </div>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Assiduité Présence</span>
              <div className="flex items-center gap-2 mt-1">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <span className="font-serif font-bold text-xl text-stone-900">{assiduiteRate}%</span>
              </div>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Taux de Rendement Tâches</span>
              <div className="flex items-center gap-2 mt-1">
                <CheckSquare className="h-5 w-5 text-[#2A7B76]" />
                <span className="font-serif font-bold text-xl text-stone-900">{taskCompletionRate}%</span>
              </div>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Tâches (Terminées / Total)</span>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="font-serif font-bold text-xl text-stone-900">{completedTasks} / {totalAssigned}</span>
              </div>
            </div>
          </div>

          <RendementTaskDurationChart sortedTasks={sortedTasks} maxHours={maxHours} />

          <RendementTaskAccordionList
            sortedTasks={sortedTasks}
            expandedTaskId={expandedTaskId}
            setExpandedTaskId={setExpandedTaskId}
            newSubtaskTitles={newSubtaskTitles}
            setNewSubtaskTitles={setNewSubtaskTitles}
            onToggleSubtask={handleToggleSubtask}
            onAddSubtask={handleAddSubtask}
            onDeleteSubtask={handleDeleteSubtask}
          />
        </div>

        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
            title="Fermer la fenêtre de détail du rendement"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRendementDetailModal;
