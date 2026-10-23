import React from 'react';
import { 
  Check, 
  Trash2, 
  Flag, 
  Download, 
  FileText, 
  FolderKanban,
  Plus,
  Trophy
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority, TaskProject } from '../../types';
import { exportToExcel } from '../../services/excelExportService';
import { exportElementToPdf } from '../../services/pdfExportService';

interface TaskTableViewProps {
  tasks: Task[];
  projects: TaskProject[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onSelectTask: (task: Task) => void;
  onOpenCreateSubtask?: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  getPriorityBadge: (p: TaskPriority) => React.ReactNode;
}

export const TaskTableView: React.FC<TaskTableViewProps> = ({
  tasks,
  projects,
  onStatusChange,
  onSelectTask,
  onOpenCreateSubtask,
  onDeleteTask,
  getPriorityBadge,
}) => {
  const handleExportExcel = () => {
    const headers = ['ID', 'Intitulé', 'Statut', 'Assigné', 'Échéance', 'Priorité', 'Projet', 'Type', 'Sous-tâches'];
    const rows = tasks.map((t) => [
      t.id,
      t.title,
      t.status,
      t.assignedTo || '',
      t.dueDate || t.date || '',
      t.priority || 'medium',
      projects.find((p) => p.id === t.projectId)?.name || 'Projet Principal',
      t.isMilestone ? 'Jalon Clé' : 'Tâche',
      t.subtasks ? `${t.subtasks.filter((s) => s.completed).length}/${t.subtasks.length}` : '0/0',
    ]);
    exportToExcel('suivi_des_taches_et_jalons.xls', 'Registre des Tâches Citrine', headers, rows);
  };

  const handleExportPdf = () => {
    exportElementToPdf('tasks-table-container', 'suivi_des_taches_et_jalons.pdf');
  };

  return (
    <div id="tasks-table-container" className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-stone-100 flex items-center justify-between gap-3 bg-stone-50/50">
        <h4 className="font-serif font-bold text-xs text-stone-900 flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-[#2A7B76]" />
          Tableau des Tâches & Jalons ({tasks.length})
        </h4>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            title="Exporter la liste des tâches au format Excel"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            title="Exporter la vue au format PDF"
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
              <th className="py-3 px-4">Intitulé & Jalons</th>
              <th className="py-3 px-4">Étape Kanban</th>
              <th className="py-3 px-4">Responsable Assigné</th>
              <th className="py-3 px-4">Échéance</th>
              <th className="py-3 px-4">Priorité</th>
              <th className="py-3 px-4">Projet</th>
              <th className="py-3 px-4 text-center">Sous-tâches Asana</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-stone-400 text-xs">
                  Aucune tâche dans cette vue. Utilisez "Nouvelle Tâche" ou "Nouveau Jalon" pour en ajouter.
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const isCompleted = task.status === 'completed';
                const matchedProj = projects.find((p) => p.id === task.projectId);
                const subtasks = task.subtasks || [];
                const completedSub = subtasks.filter((s) => s.completed).length;
                const blockedSub = subtasks.filter((s) => s.status === 'blocked' || s.isBlocked || (s.incidents && s.incidents.length > 0)).length;
                const subPercentage = subtasks.length > 0 ? Math.round((completedSub / subtasks.length) * 100) : 0;

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

                    {/* Title & Milestone */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          {task.isMilestone && (
                            <span className="bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-1 shrink-0">
                              <Trophy className="h-2.5 w-2.5" />
                              <span>Jalon</span>
                            </span>
                          )}
                          <span className={`font-bold ${isCompleted ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                            {task.title}
                          </span>
                        </div>
                        {task.milestoneTarget && (
                          <span className="text-[10px] text-amber-700 italic">
                            🎯 Livrable : {task.milestoneTarget}
                          </span>
                        )}
                      </div>
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

                    {/* Subtasks progress with Asana quick button */}
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        {subtasks.length > 0 ? (
                          <div className="w-24 space-y-0.5 text-center">
                            <span className="font-mono text-[10px] font-bold text-stone-600 block">
                              {completedSub}/{subtasks.length} ({subPercentage}%)
                            </span>
                            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-[#2A7B76] h-full rounded-full transition-all"
                                style={{ width: `${subPercentage}%` }}
                              />
                            </div>
                            {blockedSub > 0 && (
                              <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1 py-0.2 rounded-md block mt-0.5">
                                🚨 {blockedSub} bloquée{blockedSub > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-stone-300 text-[11px]">-</span>
                        )}
                        {onOpenCreateSubtask && (
                          <button
                            type="button"
                            onClick={() => onOpenCreateSubtask(task)}
                            className="p-1 text-[#2A7B76] hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="Ajouter une sous-tâche"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onDeleteTask(task)}
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

export default TaskTableView;
