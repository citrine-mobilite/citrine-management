import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  UserCheck,
} from 'lucide-react';
import {
  AppUser,
  Employee,
  PersonalTaskBucket,
  Subtask,
  Task,
  TaskProject,
  TaskStatus,
  TaskPriority,
} from '../../types';
import { TaskKanbanBoard } from './TaskKanbanBoard';
import {
  getSubtaskCreatedTimestamp,
  sortSubtasksNewestFirst,
} from '../../utils/subtaskFilterUtils';

const getPriorityBadge = (p: TaskPriority) => {
  switch (p) {
    case 'urgent': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">Urgente</span>;
    case 'high': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">Haute</span>;
    case 'medium': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Moyenne</span>;
    default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Basse</span>;
  }
};

interface TaskMyTasksViewProps {
  tasks: Task[];
  projects: TaskProject[];
  employees: Employee[];
  currentUser?: AppUser | null;
  currentRole: string;
  onSelectTask: (task: Task, subtaskPath?: string[]) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onToggleSubtaskAtPath?: (taskId: string, path: string[]) => void;
  onMoveTask?: (params: {
    taskId: string;
    targetPersonalBucket: PersonalTaskBucket;
  }) => void;
  onQuickCreateTask?: (input: {
    title: string;
    personalBucket: PersonalTaskBucket;
    assignedTo?: string;
    date?: string;
  }) => void;
}

const BUCKETS: Array<{ id: PersonalTaskBucket; title: string }> = [
  { id: 'recent', title: 'Récemment attribuées' },
  { id: 'today', title: "À faire aujourd'hui" },
  { id: 'upcoming', title: 'À faire prochainement' },
  { id: 'later', title: 'À faire plus tard' },
];

interface PersonalItem {
  key: string;
  kind: 'task' | 'subtask';
  task: Task;
  subtask?: Subtask;
  subtaskPath: string[];
  title: string;
  dueDate: string;
  completed: boolean;
  bucket: PersonalTaskBucket;
  projectTitle: string;
}

const matchesPerson = (assignedTo: string | undefined, targetName: string): boolean => {
  if (!assignedTo || !targetName) return false;
  const a = assignedTo.trim().toLowerCase();
  const b = targetName.trim().toLowerCase();
  return a === b || a.includes(b) || b.includes(a);
};

export const TaskMyTasksView: React.FC<TaskMyTasksViewProps> = ({
  tasks,
  projects,
  employees,
  currentUser,
  currentRole,
  onSelectTask,
  onStatusChange,
  onToggleSubtaskAtPath,
  onMoveTask,
  onQuickCreateTask,
}) => {
  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);
  const nextWeekIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }, []);

  const isManager =
    currentRole === 'Administrateur' || currentRole === 'Responsable';

  const [selectedPerson, setSelectedPerson] = useState<string>(
    currentUser?.name || employees[0]?.name || ''
  );
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [collapsedBuckets, setCollapsedBuckets] = useState<Record<string, boolean>>({});
  const [addingInBucket, setAddingInBucket] = useState<PersonalTaskBucket | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [hideCompleted, setHideCompleted] = useState(false);

  const resolveDefaultBucket = (dueIso: string, explicit?: PersonalTaskBucket): PersonalTaskBucket => {
    if (explicit) return explicit;
    if (!dueIso) return 'recent';
    if (dueIso <= todayIso) return 'today';
    if (dueIso <= nextWeekIso) return 'upcoming';
    return 'later';
  };

  const itemsByBucket = useMemo(() => {
    const map = new Map<PersonalTaskBucket, PersonalItem[]>();
    BUCKETS.forEach((b) => map.set(b.id, []));
    const projectMap = new Map<string, string>(projects.map((p) => [p.id, p.name]));

    const walkSubs = (parentTask: Task, subs: Subtask[], parentPath: string[]) => {
      const sortedSubs = sortSubtasksNewestFirst(subs, parentTask.dueDate || parentTask.date);
      for (const s of sortedSubs) {
        const path = [...parentPath, s.id];
        const completed = Boolean(s.completed || s.status === 'completed');
        if (
          matchesPerson(s.assignedTo, selectedPerson) &&
          (!hideCompleted || !completed)
        ) {
          const due = (s.dueDate || s.endDate || parentTask.dueDate || parentTask.date || '').slice(0, 10);
          const bucket = resolveDefaultBucket(due);
          map.get(bucket)?.push({
            key: `sub:${parentTask.id}:${path.join('/')}`,
            kind: 'subtask',
            task: parentTask,
            subtask: s,
            subtaskPath: path,
            title: `${s.title} (${parentTask.title})`,
            dueDate: due,
            completed,
            bucket,
            projectTitle: projectMap.get(parentTask.projectId || 'general') || 'Général',
          });
        }
        if (s.subtasks && s.subtasks.length > 0) {
          walkSubs(parentTask, s.subtasks, path);
        }
      }
    };

    tasks.forEach((task) => {
      const completed = task.status === 'completed';
      if (
        (!selectedPerson || matchesPerson(task.assignedTo, selectedPerson)) &&
        (!hideCompleted || !completed)
      ) {
        const due = (task.dueDate || task.date || '').slice(0, 10);
        const bucket = resolveDefaultBucket(due, task.personalBucket);
        map.get(bucket)?.push({
          key: `task:${task.id}`,
          kind: 'task',
          task,
          subtaskPath: [],
          title: task.title,
          dueDate: due,
          completed,
          bucket,
          projectTitle: projectMap.get(task.projectId || 'general') || 'Général',
        });
      }
      if (task.subtasks && task.subtasks.length > 0) {
        walkSubs(task, task.subtasks, []);
      }
    });

    for (const [bucketId, list] of map.entries()) {
      list.sort((a, b) => {
        if (b.dueDate !== a.dueDate) {
          return (b.dueDate || '').localeCompare(a.dueDate || '');
        }
        const createdA = a.subtask
          ? getSubtaskCreatedTimestamp(a.subtask)
          : new Date(a.task.createdAt || a.task.date || 0).getTime() || 0;
        const createdB = b.subtask
          ? getSubtaskCreatedTimestamp(b.subtask)
          : new Date(b.task.createdAt || b.task.date || 0).getTime() || 0;
        return createdB - createdA;
      });
      map.set(bucketId, list);
    }

    return map;
  }, [tasks, projects, selectedPerson, hideCompleted, todayIso, nextWeekIso]);

  const handleQuickAdd = (bucket: PersonalTaskBucket) => {
    const trimmed = newTaskTitle.trim();
    if (!trimmed || !onQuickCreateTask) return;
    onQuickCreateTask({
      title: trimmed,
      personalBucket: bucket,
      assignedTo: selectedPerson || currentUser?.name || 'Moi',
      date: bucket === 'today' ? todayIso : undefined,
    });
    setNewTaskTitle('');
    setAddingInBucket(null);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
      {/* Barre supérieure Mes Tâches */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-stone-200 bg-stone-50/70">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-[#2A7B76]" />
          <span className="text-sm font-bold text-stone-900">Mes Tâches</span>
          {isManager && (
            <select
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
              className="ml-2 px-2.5 py-1 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-700 outline-none cursor-pointer"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.name}>
                  {emp.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-[#2A7B76] shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Liste par Échéance
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white text-[#2A7B76] shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Tableau Kanban
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
              className="rounded border-stone-300 text-[#2A7B76] focus:ring-[#2A7B76]"
            />
            <span>Masquer les terminées</span>
          </label>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="p-4">
          <TaskKanbanBoard
            tasks={tasks.filter((t) => (!selectedPerson || matchesPerson(t.assignedTo, selectedPerson)) && (!hideCompleted || t.status !== 'completed'))}
            activeProject={projects[0]}
            onStatusChange={onStatusChange}
            onSelectTask={onSelectTask}
            onToggleSubtaskAtPath={onToggleSubtaskAtPath}
            onOpenCreateModal={() => {}}
            onDeleteTask={() => {}}
            getPriorityBadge={getPriorityBadge}
          />
        </div>
      ) : (
        <div className="divide-y divide-stone-200">
        {BUCKETS.map((bucket) => {
          const items = itemsByBucket.get(bucket.id) || [];
          const isCollapsed = Boolean(collapsedBuckets[bucket.id]);

          return (
            <div
              key={bucket.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedTaskId && onMoveTask) {
                  onMoveTask({
                    taskId: draggedTaskId,
                    targetPersonalBucket: bucket.id,
                  });
                }
                setDraggedTaskId(null);
              }}
            >
              <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50/60">
                <button
                  type="button"
                  onClick={() =>
                    setCollapsedBuckets((prev) => ({
                      ...prev,
                      [bucket.id]: !prev[bucket.id],
                    }))
                  }
                  className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-stone-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-stone-500" />
                  )}
                  <span>{bucket.title}</span>
                  <span className="font-mono tabular-nums text-[11px] text-stone-400">
                    {items.length}
                  </span>
                </button>

                {onQuickCreateTask && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddingInBucket(bucket.id);
                      setNewTaskTitle('');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#2A7B76] hover:underline cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Ajouter</span>
                  </button>
                )}
              </div>

              {!isCollapsed && (
                <div className="divide-y divide-stone-100">
                  {items.map((item) => (
                    <div
                      key={item.key}
                      draggable={item.kind === 'task'}
                      onDragStart={() =>
                        item.kind === 'task' && setDraggedTaskId(item.task.id)
                      }
                      onDragEnd={() => setDraggedTaskId(null)}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-stone-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {item.kind === 'task' ? (
                          <GripVertical className="h-3.5 w-3.5 text-stone-300 cursor-grab shrink-0" />
                        ) : (
                          <span className="w-3.5 shrink-0" />
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            item.kind === 'task'
                              ? onStatusChange(
                                  item.task.id,
                                  item.completed ? 'todo' : 'completed'
                                )
                              : onToggleSubtaskAtPath?.(item.task.id, item.subtaskPath)
                          }
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 cursor-pointer ${
                            item.completed
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-stone-300 hover:border-[#2A7B76]'
                          }`}
                        >
                          {item.completed && <Check className="h-2.5 w-2.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectTask(item.task, item.subtaskPath)}
                          className={`text-left text-sm truncate cursor-pointer hover:text-[#2A7B76] ${
                            item.completed
                              ? 'line-through text-stone-400'
                              : 'font-medium text-stone-800'
                          }`}
                        >
                          {item.kind === 'subtask' ? `↳ ${item.title}` : item.title}
                        </button>
                        {((item.subtask?.tags || item.task.tags) || []).length > 0 && (
                          <div className="hidden md:flex flex-wrap items-center gap-1 shrink-0">
                            {((item.subtask?.tags || item.task.tags) || []).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.2 rounded bg-teal-50 text-[#2A7B76] border border-teal-200 font-medium"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-stone-500 shrink-0">
                        <span className="truncate max-w-[140px]">{item.projectTitle}</span>
                        <span className="text-stone-300">·</span>
                        <span
                          className={`font-mono tabular-nums ${
                            item.dueDate && item.dueDate < todayIso && !item.completed
                              ? 'text-rose-600 font-semibold'
                              : 'text-stone-500'
                          }`}
                        >
                          {item.dueDate || '—'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {addingInBucket === bucket.id && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleQuickAdd(bucket.id);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-stone-50/50"
                    >
                      <input
                        autoFocus
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Escape' && setAddingInBucket(null)}
                        placeholder={`Nouvelle tâche dans « ${bucket.title} »...`}
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#2A7B76] rounded-lg outline-none"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-[#2A7B76] text-white text-xs font-semibold cursor-pointer"
                      >
                        Ajouter
                      </button>
                    </form>
                  )}

                  {items.length === 0 && addingInBucket !== bucket.id && (
                    <div className="px-4 py-3 text-xs text-stone-400">
                      Aucune tâche dans cette section.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
