import React, { useMemo, useState } from 'react';
import {
  Plus,
  GripVertical,
  User,
  Lightbulb,
  Clock,
  AlertCircle,
  ShieldAlert,
  CheckCircle,
  Trash2,
  Check,
  ChevronDown,
  ChevronRight,
  Link2,
  Trophy,
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority, TaskProject } from '../../types';
import {
  countRecursiveSubtasks,
  getUnfinishedBlockers,
  resolveProjectSections,
  resolveTaskSectionId,
  sortSubtasksByOrder,
} from './logic/asanaTreeEngine';

interface TaskKanbanBoardProps {
  tasks: Task[];
  activeProject?: TaskProject;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onSelectTask: (task: Task, subtaskPath?: string[]) => void;
  onMoveTask?: (params: {
    taskId: string;
    targetStatus?: TaskStatus;
    targetSectionId?: string;
    targetTaskIdForReorder?: string;
    placeAfter?: boolean;
  }) => void;
  onQuickCreateTask?: (input: { title: string; status?: TaskStatus; sectionId?: string }) => void;
  onToggleSubtaskAtPath?: (taskId: string, path: string[]) => void;
  onInlineAddSubtask?: (taskId: string, parentPath: string[], title: string) => void;
  onAddSection?: (projectId: string, title: string) => void;
  onOpenCreateModal: (defaultStatus: TaskStatus) => void;
  onOpenCreateSubtask?: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  getPriorityBadge: (p: TaskPriority) => React.ReactNode;
}

export const KANBAN_COLUMNS: Array<{
  id: TaskStatus;
  title: string;
  bgSoft: string;
  borderSoft: string;
  textSoft: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'idea', title: 'Idée', bgSoft: 'bg-stone-50', borderSoft: 'border-stone-200', textSoft: 'text-stone-700', icon: Lightbulb },
  { id: 'todo', title: 'À faire', bgSoft: 'bg-stone-50', borderSoft: 'border-stone-200', textSoft: 'text-stone-800', icon: Clock },
  { id: 'in_progress', title: 'En cours', bgSoft: 'bg-amber-50/50', borderSoft: 'border-amber-200', textSoft: 'text-amber-800', icon: AlertCircle },
  { id: 'pending_validation', title: 'En validation', bgSoft: 'bg-blue-50/50', borderSoft: 'border-blue-200', textSoft: 'text-blue-800', icon: Clock },
  { id: 'blocked', title: 'Bloquée', bgSoft: 'bg-rose-50/50', borderSoft: 'border-rose-200', textSoft: 'text-rose-800', icon: ShieldAlert },
  { id: 'completed', title: 'Terminée', bgSoft: 'bg-emerald-50/50', borderSoft: 'border-emerald-200', textSoft: 'text-emerald-800', icon: CheckCircle },
];

export const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  tasks,
  activeProject,
  onStatusChange,
  onSelectTask,
  onMoveTask,
  onQuickCreateTask,
  onToggleSubtaskAtPath,
  onInlineAddSubtask,
  onAddSection,
  onOpenCreateModal,
  onDeleteTask,
  getPriorityBadge,
}) => {
  const [groupBy, setGroupBy] = useState<'status' | 'section'>('status');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [addingInCol, setAddingInCol] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [addingSubOnCard, setAddingSubOnCard] = useState<string | null>(null);
  const [newSubTitle, setNewSubTitle] = useState('');
  const [addingSectionCol, setAddingSectionCol] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  const [customColumns, setCustomColumns] = useState<Array<{ id: string; title: string; bgSoft: string; borderSoft: string; textSoft: string }>>(() => {
    try {
      const saved = localStorage.getItem('citrine_kanban_custom_columns');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [addingCustomCol, setAddingCustomCol] = useState(false);
  const [newCustomColTitle, setNewCustomColTitle] = useState('');

  const projectSections = useMemo(
    () => resolveProjectSections(activeProject),
    [activeProject]
  );

  const columns = useMemo(() => {
    if (groupBy === 'status') {
      const base = KANBAN_COLUMNS.map((c) => ({
        id: String(c.id),
        title: c.title,
        bgSoft: c.bgSoft,
        borderSoft: c.borderSoft,
        textSoft: c.textSoft,
        tasks: tasks.filter((t) => (t.status || 'todo') === c.id),
      }));
      const custom = customColumns.map((c) => ({
        id: c.id,
        title: c.title,
        bgSoft: c.bgSoft || 'bg-stone-50',
        borderSoft: c.borderSoft || 'border-stone-200',
        textSoft: c.textSoft || 'text-stone-800',
        tasks: tasks.filter((t) => (t.status || 'todo') === c.id),
      }));
      return [...base, ...custom];
    }
    return projectSections.map((sec) => ({
      id: sec.id,
      title: sec.title,
      bgSoft: 'bg-stone-50',
      borderSoft: 'border-stone-200',
      textSoft: 'text-stone-800',
      tasks: tasks.filter((t) => resolveTaskSectionId(t, projectSections) === sec.id),
    }));
  }, [groupBy, tasks, projectSections, customColumns]);

  const handleDropOnColumn = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    const tId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);
    if (!tId) return;
    if (groupBy === 'status') {
      if (onMoveTask) onMoveTask({ taskId: tId, targetStatus: colId as TaskStatus });
      else onStatusChange(tId, colId as TaskStatus);
    } else {
      onMoveTask?.({ taskId: tId, targetSectionId: colId });
    }
  };

  const handleDropOnCard = (e: React.DragEvent, colId: string, targetTaskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const tId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);
    if (!tId || tId === targetTaskId) return;
    if (onMoveTask) {
      onMoveTask({
        taskId: tId,
        ...(groupBy === 'status' ? { targetStatus: colId as TaskStatus } : { targetSectionId: colId }),
        targetTaskIdForReorder: targetTaskId,
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Board Mode Switch (Statuts vs Sections Asana) */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-stone-100 border border-stone-200 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setGroupBy('status')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer whitespace-nowrap ${
              groupBy === 'status' ? 'bg-white text-[#2A7B76]' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Colonnes par Statut
          </button>
          <button
            type="button"
            onClick={() => setGroupBy('section')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer whitespace-nowrap ${
              groupBy === 'section' ? 'bg-white text-[#2A7B76]' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Sections du Projet
          </button>
        </div>

        <span className="text-xs text-stone-500 hidden sm:inline">
          Glissez les cartes pour changer de colonne ou réorganiser l'ordre
        </span>
      </div>

      <div className="w-full overflow-x-auto pb-4 pt-1">
        <div className="flex flex-row gap-4 items-start min-w-max">
          {columns.map((col) => (
            <div
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDropOnColumn(e, col.id)}
              className={`w-80 min-w-[320px] shrink-0 ${col.bgSoft} rounded-2xl p-3.5 border ${col.borderSoft} flex flex-col min-h-[540px] select-none`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-stone-200/80">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className={`font-semibold text-xs truncate ${col.textSoft}`}>{col.title}</h3>
                  <span className="text-[11px] font-mono tabular-nums text-stone-500">
                    {col.tasks.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {customColumns.some((c) => c.id === col.id) && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const newName = prompt('Renommer la colonne :', col.title);
                          if (newName && newName.trim()) {
                            const updated = customColumns.map((c) =>
                              c.id === col.id ? { ...c, title: newName.trim() } : c
                            );
                            setCustomColumns(updated);
                            try {
                              localStorage.setItem('citrine_kanban_custom_columns', JSON.stringify(updated));
                            } catch {}
                          }
                        }}
                        className="p-1 hover:bg-white rounded-lg text-stone-400 hover:text-stone-700 transition cursor-pointer text-xs font-bold"
                        title="Renommer la colonne"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Supprimer la colonne "${col.title}" ? Les tâches de cette colonne seront replacées dans "À faire".`
                            )
                          ) {
                            col.tasks.forEach((t) => onStatusChange(t.id, 'todo'));
                            const updated = customColumns.filter((c) => c.id !== col.id);
                            setCustomColumns(updated);
                            try {
                              localStorage.setItem('citrine_kanban_custom_columns', JSON.stringify(updated));
                            } catch {}
                          }
                        }}
                        className="p-1 hover:bg-white rounded-lg text-stone-400 hover:text-rose-600 transition cursor-pointer"
                        title="Supprimer la colonne"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCreateModal(col.id as TaskStatus);
                    }}
                    className="p-1 hover:bg-white rounded-lg text-stone-500 hover:text-[#2A7B76] transition cursor-pointer"
                    title="Ajouter une tâche dans cette colonne"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Inline Card Composer (Asana Style) */}
              {addingInCol === col.id && (
                <div className="bg-white p-2.5 rounded-xl border border-[#2A7B76] mb-2.5 space-y-2">
                  <input
                    autoFocus
                    type="text"
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newCardTitle.trim()) {
                        onQuickCreateTask?.({
                          title: newCardTitle.trim(),
                          ...(groupBy === 'status'
                            ? { status: col.id as TaskStatus }
                            : { sectionId: col.id }),
                        });
                        setNewCardTitle('');
                        setAddingInCol(null);
                      } else if (e.key === 'Escape') {
                        setAddingInCol(null);
                      }
                    }}
                    placeholder="Nom de la tâche (Entrée)..."
                    className="w-full text-xs font-medium text-stone-900 outline-none"
                  />
                  <div className="flex justify-end gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setAddingInCol(null)}
                      className="text-stone-500 hover:text-stone-800 cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (newCardTitle.trim()) {
                          onQuickCreateTask?.({
                            title: newCardTitle.trim(),
                            ...(groupBy === 'status'
                              ? { status: col.id as TaskStatus }
                              : { sectionId: col.id }),
                          });
                          setNewCardTitle('');
                          setAddingInCol(null);
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-[#2A7B76] text-white font-semibold cursor-pointer"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              )}

              {/* Cards */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[680px] pr-0.5">
                {col.tasks.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCreateModal(col.id as TaskStatus);
                    }}
                    className="w-full py-10 text-stone-400 text-xs border border-dashed border-stone-300 rounded-xl hover:border-[#2A7B76] hover:text-[#2A7B76] transition cursor-pointer"
                  >
                    + Ajouter une tâche
                  </button>
                ) : (
                  col.tasks.map((task) => {
                    const isCompleted = task.status === 'completed';
                    const isExpanded = Boolean(expandedCards[task.id]);
                    const subStats = countRecursiveSubtasks(task.subtasks || []);
                    const blockers = getUnfinishedBlockers(task.dependsOnIds, tasks);

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', task.id);
                          setDraggedTaskId(task.id);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropOnCard(e, col.id, task.id)}
                        onClick={() => onSelectTask(task, [])}
                        className="bg-white p-3.5 rounded-xl border border-stone-200 hover:border-[#2A7B76]/60 transition space-y-2.5 cursor-pointer group"
                      >
                        {/* Title + Complete Toggle */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onStatusChange(task.id, isCompleted ? 'todo' : 'completed');
                              }}
                              className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 cursor-pointer transition ${
                                isCompleted
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-stone-300 hover:border-[#2A7B76] text-transparent'
                              }`}
                            >
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            </button>
                            <h4
                              className={`font-semibold text-xs leading-snug line-clamp-2 ${
                                isCompleted ? 'line-through text-stone-400' : 'text-stone-900'
                              }`}
                            >
                              {task.title}
                            </h4>
                          </div>
                          <GripVertical className="h-3.5 w-3.5 text-stone-300 shrink-0 cursor-grab group-hover:text-stone-500" />
                        </div>

                        {/* Metadata line: Priority · Milestone · Dependency */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                          {getPriorityBadge(task.priority)}
                          {task.isMilestone && (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                              <Trophy className="h-3 w-3" />
                              <span>Jalon</span>
                            </span>
                          )}
                          {blockers.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                              <Link2 className="h-3 w-3" />
                              <span>Bloquée ({blockers.length})</span>
                            </span>
                          )}
                        </div>

                        {/* Expandable Inline Subtask Checklist right on Card */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="pt-1.5 border-t border-stone-100 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[11px] text-stone-500">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedCards((prev) => ({ ...prev, [task.id]: !prev[task.id] }))
                              }
                              className="flex items-center gap-1 hover:text-[#2A7B76] font-medium cursor-pointer"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                              <span className="tabular-nums">
                                {subStats.completed}/{subStats.total} sous-tâche{subStats.total > 1 ? 's' : ''}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setExpandedCards((prev) => ({ ...prev, [task.id]: true }));
                                setAddingSubOnCard(task.id);
                                setNewSubTitle('');
                              }}
                              className="text-[#2A7B76] hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Sous-tâche</span>
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="space-y-1 pl-1 pt-1">
                              {sortSubtasksByOrder(task.subtasks || []).map((sub) => {
                                const subDone = Boolean(sub.completed || sub.status === 'completed');
                                return (
                                  <div
                                    key={sub.id}
                                    className="flex items-center gap-1.5 text-[11px] group/sub"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => onToggleSubtaskAtPath?.(task.id, [sub.id])}
                                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 cursor-pointer ${
                                        subDone
                                          ? 'bg-emerald-600 border-emerald-600 text-white'
                                          : 'border-stone-300 text-transparent'
                                      }`}
                                    >
                                      <Check className="h-2 w-2 stroke-[3]" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onSelectTask(task, [sub.id])}
                                      className={`flex-1 text-left truncate hover:text-[#2A7B76] cursor-pointer ${
                                        subDone ? 'line-through text-stone-400' : 'text-stone-700'
                                      }`}
                                    >
                                      {sub.title}
                                    </button>
                                  </div>
                                );
                              })}

                              {addingSubOnCard === task.id && (
                                <input
                                  autoFocus
                                  type="text"
                                  value={newSubTitle}
                                  onChange={(e) => setNewSubTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newSubTitle.trim()) {
                                      onInlineAddSubtask?.(task.id, [], newSubTitle.trim());
                                      setNewSubTitle('');
                                      setAddingSubOnCard(null);
                                    } else if (e.key === 'Escape') {
                                      setAddingSubOnCard(null);
                                    }
                                  }}
                                  placeholder="Nouvelle sous-tâche (Entrée)..."
                                  className="w-full px-2 py-1 rounded border border-[#2A7B76] text-[11px] outline-none mt-1"
                                />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                          <div className="flex items-center gap-1 min-w-0">
                            <User className="h-3 w-3 text-stone-400 shrink-0" />
                            <span className="truncate max-w-[120px]">{task.assignedTo || 'Équipe'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-mono tabular-nums">{task.dueDate || task.date}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTask(task);
                              }}
                              className="p-1 text-stone-400 hover:text-rose-600 rounded transition cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}

          {/* Add Column in Status Mode */}
          {groupBy === 'status' && (
            <div className="w-72 shrink-0 p-3 rounded-2xl border border-dashed border-stone-300 bg-stone-50/50">
              {addingCustomCol ? (
                <div className="space-y-2">
                  <input
                    autoFocus
                    type="text"
                    value={newCustomColTitle}
                    onChange={(e) => setNewCustomColTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newCustomColTitle.trim()) {
                        const newCol = {
                          id: `col_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                          title: newCustomColTitle.trim(),
                          bgSoft: 'bg-stone-50',
                          borderSoft: 'border-stone-200',
                          textSoft: 'text-stone-800',
                        };
                        const updated = [...customColumns, newCol];
                        setCustomColumns(updated);
                        try {
                          localStorage.setItem('citrine_kanban_custom_columns', JSON.stringify(updated));
                        } catch {}
                        setNewCustomColTitle('');
                        setAddingCustomCol(false);
                      } else if (e.key === 'Escape') {
                        setAddingCustomCol(false);
                      }
                    }}
                    placeholder="Nom de la colonne..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#2A7B76] bg-white text-xs outline-none"
                  />
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setAddingCustomCol(false)}
                      className="text-stone-500 cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (newCustomColTitle.trim()) {
                          const newCol = {
                            id: `col_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                            title: newCustomColTitle.trim(),
                            bgSoft: 'bg-stone-50',
                            borderSoft: 'border-stone-200',
                            textSoft: 'text-stone-800',
                          };
                          const updated = [...customColumns, newCol];
                          setCustomColumns(updated);
                          try {
                            localStorage.setItem('citrine_kanban_custom_columns', JSON.stringify(updated));
                          } catch {}
                          setNewCustomColTitle('');
                          setAddingCustomCol(false);
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-[#2A7B76] text-white font-semibold cursor-pointer"
                    >
                      Créer
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingCustomCol(true)}
                  className="w-full py-2 text-xs font-semibold text-stone-600 hover:text-[#2A7B76] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajouter une colonne</span>
                </button>
              )}
            </div>
          )}

          {/* Add Column/Section in Section Mode */}
          {groupBy === 'section' && (
            <div className="w-72 shrink-0 p-3 rounded-2xl border border-dashed border-stone-300 bg-stone-50/50">
              {addingSectionCol ? (
                <div className="space-y-2">
                  <input
                    autoFocus
                    type="text"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSectionTitle.trim()) {
                        onAddSection?.(activeProject?.id || 'general', newSectionTitle.trim());
                        setNewSectionTitle('');
                        setAddingSectionCol(false);
                      } else if (e.key === 'Escape') {
                        setAddingSectionCol(false);
                      }
                    }}
                    placeholder="Nom de la section..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#2A7B76] bg-white text-xs outline-none"
                  />
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setAddingSectionCol(false)}
                      className="text-stone-500 cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (newSectionTitle.trim()) {
                          onAddSection?.(activeProject?.id || 'general', newSectionTitle.trim());
                          setNewSectionTitle('');
                          setAddingSectionCol(false);
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-[#2A7B76] text-white font-semibold cursor-pointer"
                    >
                      Créer
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingSectionCol(true)}
                  className="w-full py-2 text-xs font-semibold text-stone-600 hover:text-[#2A7B76] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajouter une colonne</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
