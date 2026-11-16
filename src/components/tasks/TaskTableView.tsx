import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  GripVertical,
  Link2,
  Plus,
  Trash2,
  Trophy,
} from 'lucide-react';
import {
  Employee,
  Subtask,
  Task,
  TaskPriority,
  TaskProject,
  TaskSection,
  TaskStatus,
} from '../../types';
import { exportToExcel } from '../../services/excelExportService';
import { exportElementToPdf } from '../../services/pdfExportService';
import {
  countRecursiveSubtasks,
  getUnfinishedBlockers,
  resolveProjectSections,
  resolveTaskSectionId,
} from './logic/asanaTreeEngine';
import {
  filterAndSortSubtasks,
  getCurrentWeekBounds,
  SubtaskFilterPeriod,
} from '../../utils/subtaskFilterUtils';
import { SubtaskFilterBar } from './shared/SubtaskFilterBar';

interface TaskTableViewProps {
  tasks: Task[];
  projects: TaskProject[];
  activeProject?: TaskProject;
  employees?: Employee[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onSelectTask: (task: Task, subtaskPath?: string[]) => void;
  onSilentSaveTask?: (updatedTask: Task) => void;
  onMoveTask?: (params: {
    taskId: string;
    targetStatus?: TaskStatus;
    targetSectionId?: string;
    targetTaskIdForReorder?: string;
    placeAfter?: boolean;
  }) => void;
  onQuickCreateTask?: (input: { title: string; sectionId?: string; status?: TaskStatus }) => void;
  onToggleSubtaskAtPath?: (taskId: string, path: string[]) => void;
  onUpdateSubtaskAtPath?: (taskId: string, path: string[], patch: Partial<Subtask>) => void;
  onInlineAddSubtask?: (taskId: string, parentPath: string[], title: string) => void;
  onDeleteSubtaskAtPath?: (taskId: string, path: string[]) => void;
  onAddSection?: (projectId: string, title: string) => void;
  onRenameSection?: (projectId: string, sectionId: string, newTitle: string) => void;
  onDeleteSection?: (projectId: string, sectionId: string) => void;
  onOpenCreateSubtask?: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  getPriorityBadge: (p: TaskPriority) => React.ReactNode;
}

export const TaskTableView: React.FC<TaskTableViewProps> = ({
  tasks,
  projects,
  activeProject,
  employees = [],
  onStatusChange,
  onSelectTask,
  onSilentSaveTask,
  onMoveTask,
  onQuickCreateTask,
  onToggleSubtaskAtPath,
  onUpdateSubtaskAtPath,
  onInlineAddSubtask,
  onDeleteSubtaskAtPath,
  onAddSection,
  onRenameSection,
  onDeleteSection,
  onOpenCreateSubtask,
  onDeleteTask,
}) => {
  const sections: TaskSection[] = useMemo(
    () => resolveProjectSections(activeProject),
    [activeProject]
  );

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentWeekBounds = useMemo(() => getCurrentWeekBounds(), []);

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [editingTitleKey, setEditingTitleKey] = useState<string | null>(null);
  const [editingTitleVal, setEditingTitleVal] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionVal, setEditingSectionVal] = useState('');
  const [addingTaskInSection, setAddingTaskInSection] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingSubUnderKey, setAddingSubUnderKey] = useState<string | null>(null);
  const [newSubTitle, setNewSubTitle] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const [subtaskFilterPeriod, setSubtaskFilterPeriod] = useState<SubtaskFilterPeriod>('current_week');
  const [subtaskFilterDate, setSubtaskFilterDate] = useState<string>(todayIso);
  const [subtaskRangeStart, setSubtaskRangeStart] = useState<string>(currentWeekBounds.startIso);
  const [subtaskRangeEnd, setSubtaskRangeEnd] = useState<string>(currentWeekBounds.endIso);

  const groupedBySection = useMemo(() => {
    const map = new Map<string, Task[]>();
    sections.forEach((s) => map.set(s.id, []));
    tasks.forEach((t) => {
      const secId = resolveTaskSectionId(t, sections);
      if (!map.has(secId)) map.set(secId, []);
      map.get(secId)!.push(t);
    });
    return map;
  }, [tasks, sections]);

  const handleExportExcel = () => {
    const headers = ['ID', 'Intitulé', 'Statut', 'Assigné', 'Échéance', 'Priorité', 'Projet', 'Type', 'Sous-tâches'];
    const rows = tasks.map((t) => {
      const stats = countRecursiveSubtasks(t.subtasks || []);
      return [
        t.id,
        t.title,
        t.status,
        t.assignedTo || '',
        t.dueDate || t.date || '',
        t.priority || 'medium',
        projects.find((p) => p.id === t.projectId)?.name || 'Général',
        t.isMilestone ? 'Jalon' : 'Tâche',
        `${stats.completed}/${stats.total}`,
      ];
    });
    exportToExcel('suivi_des_taches_et_jalons.xls', 'Registre des Tâches Citrine', headers, rows);
  };

  const handleExportPdf = () => {
    exportElementToPdf('tasks-table-container', 'suivi_des_taches_et_jalons.pdf');
  };

  const toggleExpandAll = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    if (expand) {
      tasks.forEach((t) => {
        if ((t.subtasks || []).length > 0) next[t.id] = true;
      });
    }
    setExpandedNodes(next);
  };

  const renderSubtaskTreeRows = (
    task: Task,
    subtasks: Subtask[],
    parentPath: string[],
    depth: number,
    parentDate?: string
  ): React.ReactNode => {
    const { displayedSubtasks, hiddenCount } = filterAndSortSubtasks(
      subtasks,
      {
        period: subtaskFilterPeriod,
        specificDate: subtaskFilterDate,
        startDate: subtaskRangeStart,
        endDate: subtaskRangeEnd,
      },
      parentDate || task.dueDate || task.date
    );

    return (
      <>
        {displayedSubtasks.map((sub) => {
          const path = [...parentPath, sub.id];
          const pathKey = `${task.id}::${path.join('/')}`;
          const children = sub.subtasks || [];
          const hasChildren = children.length > 0;
          const isExpanded = Boolean(expandedNodes[pathKey]);
          const isDone = Boolean(sub.completed || sub.status === 'completed');
          const blockers = getUnfinishedBlockers(sub.dependsOnIds, tasks);
          const dueStr = sub.dueDate || sub.endDate || '';
          const isOverdue = !isDone && dueStr && dueStr < todayIso;

      return (
        <React.Fragment key={pathKey}>
          <tr className="bg-stone-50/40 hover:bg-stone-100/70 transition text-xs group border-t border-stone-100">
            <td className="py-2 px-3">
              <div
                className="flex items-center gap-1.5 min-w-0"
                style={{ paddingLeft: `${depth * 22}px` }}
              >
                <span className="text-stone-300 select-none">└</span>
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedNodes((prev) => ({ ...prev, [pathKey]: !prev[pathKey] }))
                    }
                    className="p-0.5 text-stone-400 hover:text-stone-700 cursor-pointer shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                ) : (
                  <span className="w-4 shrink-0" />
                )}

                <button
                  type="button"
                  onClick={() => onToggleSubtaskAtPath?.(task.id, path)}
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 cursor-pointer transition ${
                    isDone
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-stone-300 hover:border-[#2A7B76] text-transparent bg-white'
                  }`}
                >
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </button>

                {editingTitleKey === pathKey ? (
                  <input
                    autoFocus
                    type="text"
                    value={editingTitleVal}
                    onChange={(e) => setEditingTitleVal(e.target.value)}
                    onBlur={() => {
                      const clean = editingTitleVal.trim();
                      if (clean && clean !== sub.title) {
                        onUpdateSubtaskAtPath?.(task.id, path, { title: clean });
                      }
                      setEditingTitleKey(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
                      if (e.key === 'Escape') setEditingTitleKey(null);
                    }}
                    className="flex-1 px-2 py-0.5 rounded border border-[#2A7B76] bg-white outline-none font-medium text-stone-900"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectTask(task, path)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingTitleKey(pathKey);
                      setEditingTitleVal(sub.title);
                    }}
                    className={`flex-1 text-left truncate font-medium cursor-pointer hover:text-[#2A7B76] ${
                      isDone ? 'line-through text-stone-400' : 'text-stone-800'
                    }`}
                  >
                    {sub.title}
                  </button>
                )}

                {hasChildren && (
                  <span className="text-[11px] text-stone-400 tabular-nums shrink-0">
                    {children.filter((c) => c.completed).length}/{children.length}
                  </span>
                )}

                {(sub.tags || []).length > 0 && (
                  <div className="hidden md:flex flex-wrap items-center gap-1 shrink-0">
                    {(sub.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.2 rounded bg-teal-50 text-[#2A7B76] border border-teal-200 font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {blockers.length > 0 && (
                  <span
                    className="text-[11px] text-amber-700 flex items-center gap-0.5 shrink-0"
                    title={`Bloquée par : ${blockers.map((b) => b.title).join(', ')}`}
                  >
                    <Link2 className="h-3 w-3" />
                    <span>Bloquée</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setAddingSubUnderKey(pathKey);
                    setExpandedNodes((prev) => ({ ...prev, [pathKey]: true }));
                    setNewSubTitle('');
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-[#2A7B76] cursor-pointer transition shrink-0"
                  title="Ajouter une sous-tâche imbriquée"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </td>

            {/* Statut inline */}
            <td className="py-2 px-3">
              <select
                value={sub.status || (isDone ? 'completed' : 'todo')}
                onChange={(e) =>
                  onUpdateSubtaskAtPath?.(task.id, path, {
                    status: e.target.value as TaskStatus,
                    completed: e.target.value === 'completed',
                  })
                }
                className="text-[11px] font-medium px-2 py-1 rounded border border-stone-200 bg-white cursor-pointer outline-none"
              >
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="pending_validation">Validation</option>
                <option value="blocked">Bloquée</option>
                <option value="completed">Terminée</option>
              </select>
            </td>

            {/* Assigné inline */}
            <td className="py-2 px-3">
              <select
                value={sub.assignedTo || 'Équipe'}
                onChange={(e) => {
                  const emp = employees.find((item) => item.name === e.target.value);
                  onUpdateSubtaskAtPath?.(task.id, path, {
                    assignedTo: e.target.value,
                    employeeId: emp?.id,
                  });
                }}
                className="text-[11px] text-stone-700 bg-transparent hover:bg-white border border-transparent hover:border-stone-200 rounded px-1.5 py-1 cursor-pointer outline-none max-w-[130px]"
              >
                <option value="Équipe">Équipe</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </td>

            {/* Échéance inline */}
            <td className="py-2 px-3">
              <input
                type="date"
                value={dueStr}
                onChange={(e) =>
                  onUpdateSubtaskAtPath?.(task.id, path, {
                    dueDate: e.target.value,
                    endDate: e.target.value,
                  })
                }
                className={`text-[11px] font-mono tabular-nums bg-transparent border border-transparent hover:border-stone-200 rounded px-1.5 py-0.5 cursor-pointer outline-none ${
                  isOverdue ? 'text-rose-600 font-semibold' : 'text-stone-600'
                }`}
              />
            </td>

            {/* Priorité inline */}
            <td className="py-2 px-3">
              <select
                value={sub.priority || 'medium'}
                onChange={(e) =>
                  onUpdateSubtaskAtPath?.(task.id, path, {
                    priority: e.target.value as TaskPriority,
                  })
                }
                className="text-[11px] bg-transparent border border-transparent hover:border-stone-200 rounded px-1.5 py-0.5 cursor-pointer outline-none text-stone-700"
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </td>

            <td className="py-2 px-3 text-[11px] text-stone-400">Sous-tâche</td>

            <td className="py-2 px-3 text-right">
              <button
                type="button"
                onClick={() => onDeleteSubtaskAtPath?.(task.id, path)}
                className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 cursor-pointer transition"
                title="Supprimer la sous-tâche"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </td>
          </tr>

          {isExpanded && hasChildren && renderSubtaskTreeRows(task, children, path, depth + 1, sub.dueDate || sub.endDate)}

          {addingSubUnderKey === pathKey && (
            <tr className="bg-stone-50 border-t border-stone-100">
              <td colSpan={7} className="py-1.5 px-3">
                <div
                  className="flex items-center gap-2"
                  style={{ paddingLeft: `${(depth + 1) * 22}px` }}
                >
                  <input
                    autoFocus
                    type="text"
                    value={newSubTitle}
                    onChange={(e) => setNewSubTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSubTitle.trim()) {
                        onInlineAddSubtask?.(task.id, path, newSubTitle.trim());
                        setNewSubTitle('');
                        setAddingSubUnderKey(null);
                      } else if (e.key === 'Escape') {
                        setAddingSubUnderKey(null);
                      }
                    }}
                    placeholder="Intitulé de la sous-tâche imbriquée (Entrée)..."
                    className="flex-1 max-w-md px-2.5 py-1 rounded border border-[#2A7B76] bg-white text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setAddingSubUnderKey(null)}
                    className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>
              </td>
            </tr>
          )}
        </React.Fragment>
      );
    })}
        {hiddenCount > 0 && (
          <tr className="bg-amber-50/50 border-t border-stone-100 text-[11px] text-amber-900">
            <td colSpan={7} className="py-1.5 px-3">
              <div
                className="flex items-center justify-between gap-2"
                style={{ paddingLeft: `${depth * 22}px` }}
              >
                <span>
                  {displayedSubtasks.length === 0
                    ? `Aucune sous-tâche sur la période affichée (${hiddenCount} hors semaine en cours).`
                    : `${hiddenCount} autre${hiddenCount > 1 ? 's' : ''} sous-tâche${hiddenCount > 1 ? 's' : ''} hors période masquée${hiddenCount > 1 ? 's' : ''}.`}
                </span>
                <button
                  type="button"
                  onClick={() => setSubtaskFilterPeriod('all')}
                  className="font-bold text-[#2A7B76] hover:underline cursor-pointer"
                >
                  Afficher toutes
                </button>
              </div>
            </td>
          </tr>
        )}
      </>
    );
  };

  return (
    <div id="tasks-table-container" className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-stone-200 space-y-2.5 bg-stone-50/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-sm text-stone-900 tabular-nums">
              Tâches (Job descriptions) &amp; Sous-tâches ({tasks.length})
            </h4>
            <button
              type="button"
              onClick={() => {
                const anyExpanded = Object.values(expandedNodes).some(Boolean);
                toggleExpandAll(!anyExpanded);
              }}
              className="text-xs font-medium text-[#2A7B76] hover:underline cursor-pointer whitespace-nowrap"
            >
              {Object.values(expandedNodes).some(Boolean)
                ? 'Tout réduire'
                : 'Tout déplier (sous-tâches)'}
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            >
              <FileText className="h-3.5 w-3.5 text-rose-600" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-200/70">
          <span className="text-[11px] font-medium text-stone-500">
            Affichage des sous-tâches :
          </span>
          <SubtaskFilterBar
            period={subtaskFilterPeriod}
            onChangePeriod={setSubtaskFilterPeriod}
            specificDate={subtaskFilterDate}
            onChangeSpecificDate={setSubtaskFilterDate}
            rangeStart={subtaskRangeStart}
            onChangeRangeStart={setSubtaskRangeStart}
            rangeEnd={subtaskRangeEnd}
            onChangeRangeEnd={setSubtaskRangeEnd}
          />
        </div>
      </div>

      {/* Asana Sections + Tree Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-stone-50 text-stone-500 text-[11px] font-semibold border-b border-stone-200">
            <tr>
              <th className="py-2.5 px-3 min-w-[340px]">Tâche / Arborescence</th>
              <th className="py-2.5 px-3 w-36">Statut</th>
              <th className="py-2.5 px-3 w-40">Responsable</th>
              <th className="py-2.5 px-3 w-36">Échéance</th>
              <th className="py-2.5 px-3 w-28">Priorité</th>
              <th className="py-2.5 px-3 w-36">Projet</th>
              <th className="py-2.5 px-3 w-16 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {sections.map((section) => {
              const secTasks = groupedBySection.get(section.id) || [];
              const isCollapsed = Boolean(collapsedSections[section.id]);

              return (
                <React.Fragment key={section.id}>
                  {/* Section Header Drop Target */}
                  <tr
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedTaskId && onMoveTask) {
                        onMoveTask({ taskId: draggedTaskId, targetSectionId: section.id });
                      }
                      setDraggedTaskId(null);
                    }}
                    className="bg-stone-100/70 border-y border-stone-200"
                  >
                    <td colSpan={7} className="py-2 px-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setCollapsedSections((prev) => ({
                                ...prev,
                                [section.id]: !prev[section.id],
                              }))
                            }
                            className="p-0.5 text-stone-500 hover:text-stone-900 cursor-pointer"
                          >
                            {isCollapsed ? (
                              <ChevronRight className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>

                          {editingSectionId === section.id ? (
                            <input
                              autoFocus
                              type="text"
                              value={editingSectionVal}
                              onChange={(e) => setEditingSectionVal(e.target.value)}
                              onBlur={() => {
                                if (editingSectionVal.trim() && activeProject) {
                                  onRenameSection?.(
                                    activeProject.id,
                                    section.id,
                                    editingSectionVal.trim()
                                  );
                                }
                                setEditingSectionId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
                                if (e.key === 'Escape') setEditingSectionId(null);
                              }}
                              className="px-2 py-0.5 rounded border border-[#2A7B76] bg-white font-bold text-stone-900 outline-none"
                            />
                          ) : (
                            <button
                              type="button"
                              onDoubleClick={() => {
                                setEditingSectionId(section.id);
                                setEditingSectionVal(section.title);
                              }}
                              className="font-bold text-stone-900 text-xs hover:text-[#2A7B76] cursor-pointer"
                              title="Double-cliquer pour renommer la section"
                            >
                              {section.title}
                            </button>
                          )}

                          <span className="text-[11px] text-stone-500 font-mono tabular-nums">
                            {secTasks.length}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAddingTaskInSection(section.id);
                              setNewTaskTitle('');
                            }}
                            className="text-[11px] font-semibold text-[#2A7B76] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Ajouter une tâche</span>
                          </button>
                          {sections.length > 1 && activeProject && activeProject.id !== 'all' && (
                            <button
                              type="button"
                              onClick={() => onDeleteSection?.(activeProject.id, section.id)}
                              className="text-stone-400 hover:text-rose-600 p-0.5 cursor-pointer"
                              title="Supprimer cette section"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>

                  {!isCollapsed &&
                    secTasks.map((task) => {
                      const isCompleted = task.status === 'completed';
                      const subtasks = task.subtasks || [];
                      const subStats = countRecursiveSubtasks(subtasks);
                      const isExpanded = Boolean(expandedNodes[task.id]);
                      const matchedProj = projects.find((p) => p.id === task.projectId);
                      const blockers = getUnfinishedBlockers(task.dependsOnIds, tasks);
                      const dueDate = task.dueDate || task.date || '';
                      const isOverdue =
                        !isCompleted && dueDate && dueDate < new Date().toISOString().split('T')[0];

                      return (
                        <React.Fragment key={task.id}>
                          <tr
                            draggable
                            onDragStart={() => setDraggedTaskId(task.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (draggedTaskId && draggedTaskId !== task.id && onMoveTask) {
                                onMoveTask({
                                  taskId: draggedTaskId,
                                  targetSectionId: section.id,
                                  targetTaskIdForReorder: task.id,
                                });
                              }
                              setDraggedTaskId(null);
                            }}
                            className="hover:bg-stone-50 transition border-t border-stone-100 group"
                          >
                            {/* Arborescence & Titre inline */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <GripVertical className="h-3.5 w-3.5 text-stone-300 group-hover:text-stone-500 cursor-grab shrink-0" />

                                {subtasks.length > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedNodes((prev) => ({
                                        ...prev,
                                        [task.id]: !prev[task.id],
                                      }))
                                    }
                                    className="p-0.5 text-stone-500 hover:text-stone-900 cursor-pointer shrink-0"
                                    title="Afficher / masquer l'arborescence des sous-tâches"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                ) : (
                                  <span className="w-4 shrink-0" />
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    onStatusChange(task.id, isCompleted ? 'todo' : 'completed')
                                  }
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 cursor-pointer transition ${
                                    isCompleted
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-stone-300 hover:border-[#2A7B76] text-transparent'
                                  }`}
                                >
                                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                                </button>

                                {task.isMilestone && (
                                  <Trophy className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                )}

                                {editingTitleKey === task.id ? (
                                  <input
                                    autoFocus
                                    type="text"
                                    value={editingTitleVal}
                                    onChange={(e) => setEditingTitleVal(e.target.value)}
                                    onBlur={() => {
                                      const clean = editingTitleVal.trim();
                                      if (clean && clean !== task.title && onSilentSaveTask) {
                                        onSilentSaveTask({ ...task, title: clean });
                                      }
                                      setEditingTitleKey(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
                                      if (e.key === 'Escape') setEditingTitleKey(null);
                                    }}
                                    className="flex-1 px-2 py-0.5 rounded border border-[#2A7B76] bg-white font-semibold text-stone-900 outline-none"
                                  />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => onSelectTask(task, [])}
                                    onDoubleClick={(e) => {
                                      e.stopPropagation();
                                      setEditingTitleKey(task.id);
                                      setEditingTitleVal(task.title);
                                    }}
                                    className={`flex-1 text-left truncate font-semibold cursor-pointer hover:text-[#2A7B76] ${
                                      isCompleted ? 'line-through text-stone-400' : 'text-stone-900'
                                    }`}
                                    title="Cliquer pour ouvrir les détails · Double-cliquer pour renommer"
                                  >
                                    {task.title}
                                  </button>
                                )}

                                {subStats.total > 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedNodes((prev) => ({
                                        ...prev,
                                        [task.id]: !prev[task.id],
                                      }))
                                    }
                                    className="text-[11px] font-mono tabular-nums text-stone-500 hover:text-[#2A7B76] px-1.5 py-0.5 rounded bg-stone-100 cursor-pointer shrink-0"
                                    title="Déplier les sous-tâches"
                                  >
                                    {subStats.completed}/{subStats.total}
                                  </button>
                                )}

                                {blockers.length > 0 && (
                                  <span
                                    className="text-[11px] text-amber-700 flex items-center gap-0.5 shrink-0"
                                    title={`Bloquée par : ${blockers.map((b) => b.title).join(', ')}`}
                                  >
                                    <Link2 className="h-3 w-3" />
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onOpenCreateSubtask) {
                                      onOpenCreateSubtask(task);
                                    } else {
                                      setAddingSubUnderKey(task.id);
                                      setExpandedNodes((prev) => ({ ...prev, [task.id]: true }));
                                      setNewSubTitle('');
                                    }
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-[#2A7B76] cursor-pointer transition shrink-0"
                                  title="Ajouter une sous-tâche complète"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>

                            {/* Statut */}
                            <td className="py-2.5 px-3">
                              <select
                                value={task.status}
                                onChange={(e) =>
                                  onStatusChange(task.id, e.target.value as TaskStatus)
                                }
                                className="text-[11px] font-medium px-2 py-1 rounded border border-stone-200 bg-white cursor-pointer outline-none"
                              >
                                <option value="idea">Idée</option>
                                <option value="todo">À faire</option>
                                <option value="in_progress">En cours</option>
                                <option value="pending_validation">En validation</option>
                                <option value="blocked">Bloquée</option>
                                <option value="completed">Terminée</option>
                              </select>
                            </td>

                            {/* Responsable inline */}
                            <td className="py-2.5 px-3">
                              <select
                                value={task.assignedTo || 'Équipe'}
                                onChange={(e) => {
                                  if (!onSilentSaveTask) return;
                                  const emp = employees.find((item) => item.name === e.target.value);
                                  onSilentSaveTask({
                                    ...task,
                                    assignedTo: e.target.value,
                                    employeeId: emp?.id,
                                  });
                                }}
                                className="text-[11px] text-stone-700 bg-transparent hover:bg-white border border-transparent hover:border-stone-200 rounded px-1.5 py-1 cursor-pointer outline-none max-w-[140px]"
                              >
                                <option value="Équipe">Équipe</option>
                                {employees.map((emp) => (
                                  <option key={emp.id} value={emp.name}>
                                    {emp.name}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Échéance inline */}
                            <td className="py-2.5 px-3">
                              <input
                                type="date"
                                value={dueDate}
                                onChange={(e) =>
                                  onMoveTask?.({ taskId: task.id, targetDate: e.target.value })
                                }
                                className={`text-[11px] font-mono tabular-nums bg-transparent border border-transparent hover:border-stone-200 rounded px-1.5 py-0.5 cursor-pointer outline-none ${
                                  isOverdue ? 'text-rose-600 font-semibold' : 'text-stone-600'
                                }`}
                              />
                            </td>

                            {/* Priorité inline */}
                            <td className="py-2.5 px-3">
                              <select
                                value={task.priority}
                                onChange={(e) =>
                                  onSilentSaveTask?.({
                                    ...task,
                                    priority: e.target.value as TaskPriority,
                                  })
                                }
                                className="text-[11px] font-medium bg-transparent border border-transparent hover:border-stone-200 rounded px-1.5 py-0.5 cursor-pointer outline-none text-stone-800"
                              >
                                <option value="low">Basse</option>
                                <option value="medium">Moyenne</option>
                                <option value="high">Haute</option>
                                <option value="urgent">Urgente</option>
                              </select>
                            </td>

                            {/* Projet */}
                            <td className="py-2.5 px-3 text-[11px] text-stone-600 truncate max-w-[140px]">
                              {matchedProj ? matchedProj.name : 'Général'}
                            </td>

                            {/* Actions */}
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => onDeleteTask(task)}
                                className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer transition"
                                title="Supprimer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>

                          {/* Sous-tâches déployées en arborescence */}
                          {isExpanded &&
                            subtasks.length > 0 &&
                            renderSubtaskTreeRows(task, subtasks, [], 1)}

                          {/* Ajout rapide sous-tâche sous cette tâche */}
                          {addingSubUnderKey === task.id && (
                            <tr className="bg-stone-50 border-t border-stone-100">
                              <td colSpan={7} className="py-2 px-3 pl-10">
                                <div className="flex items-center gap-2">
                                  <input
                                    autoFocus
                                    type="text"
                                    value={newSubTitle}
                                    onChange={(e) => setNewSubTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && newSubTitle.trim()) {
                                        onInlineAddSubtask?.(task.id, [], newSubTitle.trim());
                                        setNewSubTitle('');
                                        setAddingSubUnderKey(null);
                                      } else if (e.key === 'Escape') {
                                        setAddingSubUnderKey(null);
                                      }
                                    }}
                                    placeholder="Nom de la nouvelle sous-tâche (Entrée pour enregistrer)..."
                                    className="flex-1 max-w-md px-2.5 py-1 rounded border border-[#2A7B76] bg-white text-xs outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setAddingSubUnderKey(null)}
                                    className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}

                  {/* Ajout inline rapide d'une tâche dans cette section */}
                  {!isCollapsed && addingTaskInSection === section.id && (
                    <tr className="bg-white border-t border-stone-100">
                      <td colSpan={7} className="py-2 px-3 pl-8">
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newTaskTitle.trim()) {
                                onQuickCreateTask?.({
                                  title: newTaskTitle.trim(),
                                  sectionId: section.id,
                                });
                                setNewTaskTitle('');
                                setAddingTaskInSection(null);
                              } else if (e.key === 'Escape') {
                                setAddingTaskInSection(null);
                              }
                            }}
                            placeholder="Écrivez le nom de la tâche et appuyez sur Entrée..."
                            className="flex-1 max-w-lg px-3 py-1.5 rounded-lg border border-[#2A7B76] bg-white text-xs outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setAddingTaskInSection(null)}
                            className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                          >
                            Annuler
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Section Footer Bar (Asana Style) */}
      <div className="px-4 py-3 border-t border-stone-200 bg-stone-50/50 flex items-center gap-2">
        {showAddSection ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newSectionName.trim()) {
                  onAddSection?.(activeProject?.id || 'general', newSectionName.trim());
                  setNewSectionName('');
                  setShowAddSection(false);
                } else if (e.key === 'Escape') {
                  setShowAddSection(false);
                }
              }}
              placeholder="Nom de la nouvelle section..."
              className="px-3 py-1.5 rounded-lg border border-[#2A7B76] bg-white text-xs outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (newSectionName.trim()) {
                  onAddSection?.(activeProject?.id || 'general', newSectionName.trim());
                  setNewSectionName('');
                  setShowAddSection(false);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-[#2A7B76] text-white text-xs font-semibold cursor-pointer"
            >
              Créer
            </button>
            <button
              type="button"
              onClick={() => setShowAddSection(false)}
              className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
            >
              Annuler
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddSection(true)}
            className="text-xs font-semibold text-stone-600 hover:text-[#2A7B76] flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Ajouter une section</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskTableView;
