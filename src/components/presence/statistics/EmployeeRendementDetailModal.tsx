import React, { useState } from 'react';
import { X, CheckSquare, Clock, Trophy, ShieldCheck, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { Employee, Task, Subtask } from '../../../types';
import { haptic } from '../../../services/hapticService';

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

  // Filter tasks assigned to this employee
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

  // Estimate time spent on each task (e.g. High = 8h, Medium = 4h, Low = 2h, or based on subtasks count)
  const tasksWithDuration = employeeTasks.map((t) => {
    let estimatedHours = 4;
    if (t.priority === 'high' || t.priority === 'urgent') estimatedHours = 8;
    else if (t.priority === 'low') estimatedHours = 2;
    if (t.subtasks && t.subtasks.length > 0) {
      estimatedHours = Math.max(estimatedHours, t.subtasks.length * 2);
    }
    return {
      ...t,
      estimatedHours,
    };
  });

  // Sort tasks descending by estimated duration (tasks taking the most time first)
  const sortedTasks = [...tasksWithDuration].sort((a, b) => b.estimatedHours - a.estimatedHours);
  const maxHours = Math.max(...sortedTasks.map((t) => t.estimatedHours), 1);

  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(sortedTasks[0]?.id || null);
  const [newSubtaskTitles, setNewSubtaskTitles] = useState<{ [taskId: string]: string }>({});

  const handleToggleSubtask = (task: Task, subtaskId: string) => {
    haptic.light();
    const updatedSubtasks = (task.subtasks || []).map((sub) =>
      sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
    );
    const updatedTask: Task = {
      ...task,
      subtasks: updatedSubtasks,
      lastUpdatedTime: new Date().toISOString(),
    };
    if (onUpdateTask) {
      onUpdateTask(updatedTask);
    }
    if (showToast) showToast('Sous-tâche mise à jour avec succès.', 'success');
  };

  const handleAddSubtask = (task: Task) => {
    const title = (newSubtaskTitles[task.id] || '').trim();
    if (!title) return;
    haptic.medium();

    const newSub: Subtask = {
      id: `sub-${Date.now()}`,
      title,
      completed: false,
    };

    const updatedTask: Task = {
      ...task,
      subtasks: [...(task.subtasks || []), newSub],
      lastUpdatedTime: new Date().toISOString(),
    };

    if (onUpdateTask) {
      onUpdateTask(updatedTask);
    }
    setNewSubtaskTitles({ ...newSubtaskTitles, [task.id]: '' });
    if (showToast) showToast('Sous-tâche ajoutée avec succès.', 'success');
  };

  const handleDeleteSubtask = (task: Task, subtaskId: string) => {
    haptic.light();
    const updatedSubtasks = (task.subtasks || []).filter((sub) => sub.id !== subtaskId);
    const updatedTask: Task = {
      ...task,
      subtasks: updatedSubtasks,
      lastUpdatedTime: new Date().toISOString(),
    };
    if (onUpdateTask) {
      onUpdateTask(updatedTask);
    }
    if (showToast) showToast('Sous-tâche supprimée.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
        
        {/* Header */}
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* KPI Ribbon */}
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

          {/* 📊 Diagramme en baton : Tâches classées par temps passé estimé */}
          <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-stone-900">
                  Diagramme de Temps Passé par Tâche (Classé du plus long au plus court)
                </h3>
                <p className="text-[11px] text-stone-500">
                  Estimation du temps de travail (heures) basée sur la complexité et les sous-tâches.
                </p>
              </div>
              <span className="text-xs font-bold text-[#2A7B76] bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                {sortedTasks.length} Tâche(s) active(s)
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {sortedTasks.map((task) => {
                const percentage = Math.round((task.estimatedHours / maxHours) * 100);
                const isCompleted = task.status === 'completed';
                return (
                  <div key={task.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-800 truncate max-w-md flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {task.title}
                      </span>
                      <span className="font-mono font-medium text-stone-600">
                        {task.estimatedHours}h estimées ({task.priority})
                      </span>
                    </div>

                    <div className="w-full bg-stone-200 h-3 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-600' : 'bg-[#2A7B76]'
                        }`}
                        style={{ width: `${Math.max(percentage, 8)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {sortedTasks.length === 0 && (
                <p className="text-center py-6 text-stone-400 italic text-xs">
                  Aucune tâche assignée à ce collaborateur.
                </p>
              )}
            </div>
          </div>

          {/* 📝 Liste détaillée des tâches et gestion des sous-tâches */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-sm text-stone-900">
              Détail des Tâches & Gestion des Sous-Tâches
            </h3>

            <div className="space-y-3">
              {sortedTasks.map((task) => {
                const isExpanded = expandedTaskId === task.id;
                const subtasks = task.subtasks || [];
                const completedSub = subtasks.filter((s) => s.completed).length;

                return (
                  <div
                    key={task.id}
                    className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden transition"
                  >
                    {/* Task Row Header */}
                    <div
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            task.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {task.status === 'completed' ? '✓' : '••'}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-stone-900 truncate">{task.title}</h4>
                          <p className="text-[11px] text-stone-500 truncate">
                            {task.description || 'Aucune description'} • Sous-tâches : {completedSub}/{subtasks.length}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono text-[11px] font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-lg">
                          {task.estimatedHours}h
                        </span>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
                      </div>
                    </div>

                    {/* Expanded Subtasks Section */}
                    {isExpanded && (
                      <div className="p-4 bg-stone-50/80 border-t border-stone-200 space-y-3">
                        <div className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                          Sous-tâches de la tâche ({subtasks.length})
                        </div>

                        <div className="space-y-2">
                          {subtasks.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-stone-200 shadow-3xs"
                            >
                              <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={sub.completed}
                                  onChange={() => handleToggleSubtask(task, sub.id)}
                                  className="w-4 h-4 rounded border-stone-300 text-[#2A7B76] cursor-pointer"
                                  title="Marquer comme complété"
                                />
                                <span
                                  className={`text-xs truncate ${
                                    sub.completed ? 'line-through text-stone-400 font-medium' : 'text-stone-800 font-bold'
                                  }`}
                                >
                                  {sub.title}
                                </span>
                              </label>

                              <button
                                onClick={() => handleDeleteSubtask(task, sub.id)}
                                className="p-1 text-stone-400 hover:text-red-600 transition cursor-pointer ml-2"
                                title="Supprimer cette sous-tâche"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}

                          {subtasks.length === 0 && (
                            <p className="text-xs text-stone-400 italic">Aucune sous-tâche pour le moment.</p>
                          )}
                        </div>

                        {/* Add Subtask Input */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={newSubtaskTitles[task.id] || ''}
                            onChange={(e) =>
                              setNewSubtaskTitles({ ...newSubtaskTitles, [task.id]: e.target.value })
                            }
                            placeholder="Ajouter une nouvelle sous-tâche..."
                            className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
                            title="Titre de la nouvelle sous-tâche"
                          />
                          <button
                            onClick={() => handleAddSubtask(task)}
                            className="px-3 py-1.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 shadow-xs"
                            title="Ajouter la sous-tâche"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Ajouter</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
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
