import React from 'react';
import { 
  Check, 
  Trash2, 
  Flag,
  Download,
  FileText,
  FolderKanban
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority, TaskProject } from '../../types';
import { exportToExcel } from '../../services/excelExportService';
import { exportElementToPdf } from '../../services/pdfExportService';

interface TaskTableViewProps {
  tasks: Task[];
  projects: TaskProject[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onSelectTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  getPriorityBadge: (p: TaskPriority) => React.ReactNode;
}

export const TaskTableView: React.FC<TaskTableViewProps> = ({
  tasks,
  projects,
  onStatusChange,
  onSelectTask,
  onDeleteTask,
  getPriorityBadge,
}) => {
  const handleExportExcel = () => {
    const headers = ['ID', 'Intitulé', 'Statut', 'Assigné', 'Échéance', 'Priorité', 'Projet'];
    const rows = tasks.map((t) => [
      t.id,
      t.title,
      t.status,
      t.assignedTo || '',
      t.dueDate || '',
      t.priority || 'medium',
      projects.find((p) => p.id === t.projectId)?.name || 'Projet Principal',
    ]);
    exportToExcel('suivi_des_taches.xls', 'Registre des Tâches Citrine', headers, rows);
  };

  const handleExportPdf = () => {
    exportElementToPdf('tasks-table-container', 'suivi_des_taches.pdf');
  };

  return (
    <div id="tasks-table-container" className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-stone-100 flex items-center justify-between gap-3 bg-stone-50/50">
        <h4 className="font-serif font-bold text-xs text-stone-900 flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-[#2A7B76]" />
          Tableau des Tâches ({tasks.length})
        </h4>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-rose-600" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase font-bold border-b border-stone-200/80">
            <tr>
              <th className="py-3 px-3 text-center w-10">Statut</th>
              <th className="py-3 px-4">Intitulé de la Tâche</th>
              <th className="py-3 px-4">Étape Kanban</th>
              <th className="py-3 px-4">Responsable Assigné</th>
              <th className="py-3 px-4">Échéance</th>
              <th className="py-3 px-4">Priorité</th>
              <th className="py-3 px-4">Projet</th>
              <th className="py-3 px-4 text-center">Sous-tâches</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-stone-400 text-xs">
                  Aucune tâche dans cette vue. Utilisez "Nouvelle Tâche" pour en ajouter.
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const isCompleted = task.status === 'completed';
                const matchedProj = projects.find((p) => p.id === task.projectId);

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-stone-50/70 transition cursor-pointer"
                    onClick={() => onSelectTask(task)}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onStatusChange(task.id, isCompleted ? 'todo' : 'completed')}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition cursor-pointer ${
                          isCompleted
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-stone-300 hover:border-[#2A7B76] text-transparent'
                        }`}
                      >
                        <Check className="h-3 w-3 stroke-[3]" />
                      </button>
                    </td>

                    {/* Title */}
                    <td className="py-3 px-4 font-bold text-stone-900">
                      <span className={isCompleted ? 'line-through text-stone-400' : 'text-stone-900'}>
                        {task.title}
                      </span>
                    </td>

                    {/* Status dropdown */}
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={task.status}
                        onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                        className="text-[11px] font-bold px-2 py-1 rounded-lg border border-stone-200 bg-white cursor-pointer focus:outline-none"
                      >
                        <option value="idea">💡 Idée</option>
                        <option value="todo">📌 À faire</option>
                        <option value="in_progress">⚡ En cours</option>
                        <option value="pending_validation">⏳ En attente</option>
                        <option value="blocked">🚨 Bloquée</option>
                        <option value="completed">✅ Terminée</option>
                      </select>
                    </td>

                    {/* Assignee */}
                    <td className="py-3 px-4 text-stone-700">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-[9px] font-bold">
                          {(task.assignedTo || 'E').slice(0, 1)}
                        </span>
                        <span>{task.assignedTo || 'Équipe'}</span>
                      </div>
                    </td>

                    {/* Due Date */}
                    <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                      {task.date}
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4">
                      {getPriorityBadge(task.priority)}
                    </td>

                    {/* Project / Module */}
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md border border-stone-200/80">
                        {matchedProj ? `${matchedProj.icon || '📁'} ${matchedProj.name}` : '🚀 Général'}
                      </span>
                    </td>

                    {/* Subtasks count */}
                    <td className="py-3 px-4 text-center font-mono text-[11px] text-stone-500">
                      {task.subtasks && task.subtasks.length > 0 ? (
                        <span>{task.subtasks.filter((s) => s.completed).length} / {task.subtasks.length}</span>
                      ) : (
                        <span className="text-stone-300">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1 text-stone-400 hover:text-rose-600 transition cursor-pointer"
                        title="Supprimer la tâche"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
