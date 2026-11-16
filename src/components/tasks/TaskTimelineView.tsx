import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Diamond,
  GitBranch,
  Link2,
  User,
} from 'lucide-react';
import {
  Subtask,
  Task,
  TaskProject,
  TaskSection,
  TaskStatus,
} from '../../types';
import {
  resolveProjectSections,
  resolveTaskSectionId,
  sortSubtasksByOrder,
} from './logic/asanaTreeEngine';

interface TaskTimelineViewProps {
  tasks: Task[];
  activeProject?: TaskProject;
  onSelectTask: (task: Task, subtaskPath?: string[]) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onToggleSubtaskAtPath?: (taskId: string, path: string[]) => void;
  onMoveTask?: (params: {
    taskId: string;
    targetSectionId?: string;
    targetDate?: string;
    targetStartDate?: string;
  }) => void;
}

interface TimelineRow {
  rowKey: string;
  id: string;
  kind: 'task' | 'subtask';
  task: Task;
  subtask?: Subtask;
  subtaskPath: string[];
  depth: number;
  title: string;
  assignee: string;
  startDate: string;
  endDate: string;
  completed: boolean;
  isBlocked: boolean;
  isMilestone: boolean;
  dependsOnIds: string[];
  groupId: string;
}

const addDaysIso = (iso: string, delta: number): string => {
  const d = new Date(`${iso}T12:00:00`);
  if (isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + delta);
  return d.toISOString().split('T')[0];
};

const diffDays = (startIso: string, endIso: string): number => {
  const a = new Date(`${startIso}T12:00:00`).getTime();
  const b = new Date(`${endIso}T12:00:00`).getTime();
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.round((b - a) / 86400000);
};

export const TaskTimelineView: React.FC<TaskTimelineViewProps> = ({
  tasks,
  activeProject,
  onSelectTask,
  onStatusChange,
  onToggleSubtaskAtPath,
  onMoveTask,
}) => {
  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [windowStart, setWindowStart] = useState<string>(() => addDaysIso(todayIso, -2));
  const [daysSpan, setDaysSpan] = useState<14 | 21>(14);
  const [groupBy, setGroupBy] = useState<'section' | 'assignee'>('section');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const sections: TaskSection[] = useMemo(
    () => resolveProjectSections(activeProject),
    [activeProject]
  );

  const days = useMemo(() => {
    return Array.from({ length: daysSpan }, (_, idx) => {
      const iso = addDaysIso(windowStart, idx);
      const d = new Date(`${iso}T12:00:00`);
      const dayNum = d.getDate();
      const weekday = d.toLocaleDateString('fr-FR', { weekday: 'short' });
      const monthLabel = d.toLocaleDateString('fr-FR', { month: 'short' });
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      return { iso, dayNum, weekday, monthLabel, isWeekend, isToday: iso === todayIso };
    });
  }, [windowStart, daysSpan, todayIso]);

  const windowEnd = days[days.length - 1]?.iso || windowStart;

  const groups = useMemo(() => {
    if (groupBy === 'section') {
      return sections.map((sec) => ({
        id: sec.id,
        title: sec.title,
        color: sec.color || '#2A7B76',
      }));
    }
    const assignees: string[] = Array.from(
      new Set<string>(tasks.map((t) => (t.assignedTo || 'Non assigné').trim() || 'Non assigné'))
    ).sort((a, b) => a.localeCompare(b));
    return assignees.map((name) => ({
      id: name,
      title: name,
      color: '#2A7B76',
    }));
  }, [groupBy, sections, tasks]);

  const rowsByGroup = useMemo(() => {
    const map = new Map<string, TimelineRow[]>();
    groups.forEach((g) => map.set(g.id, []));

    const pushSubtasks = (
      targetArr: TimelineRow[],
      parentTask: Task,
      list: Subtask[],
      parentPath: string[],
      depth: number,
      groupId: string
    ) => {
      for (const sub of sortSubtasksByOrder(list)) {
        const path = [...parentPath, sub.id];
        const sStart = sub.startDate || parentTask.startDate || parentTask.date || todayIso;
        const sEnd = sub.dueDate || sub.endDate || parentTask.dueDate || parentTask.date || sStart;
        const clampedEnd = sEnd < sStart ? sStart : sEnd;
        targetArr.push({
          rowKey: `sub:${parentTask.id}:${path.join('/')}`,
          id: sub.id,
          kind: 'subtask',
          task: parentTask,
          subtask: sub,
          subtaskPath: path,
          depth,
          title: sub.title,
          assignee: sub.assignedTo || parentTask.assignedTo || '—',
          startDate: sStart,
          endDate: clampedEnd,
          completed: Boolean(sub.completed || sub.status === 'completed'),
          isBlocked: Boolean(sub.isBlocked || sub.status === 'blocked'),
          isMilestone: false,
          dependsOnIds: sub.dependsOnIds || [],
          groupId,
        });
        if (sub.subtasks && sub.subtasks.length > 0) {
          pushSubtasks(targetArr, parentTask, sub.subtasks, path, depth + 1, groupId);
        }
      }
    };

    tasks.forEach((task) => {
      const groupId =
        groupBy === 'section'
          ? resolveTaskSectionId(task, sections)
          : (task.assignedTo || 'Non assigné').trim() || 'Non assigné';
      const arr = map.get(groupId) || map.get(groups[0]?.id || '');
      if (!arr) return;

      const tStart = task.startDate || task.date || todayIso;
      const tEnd = task.dueDate || task.date || tStart;
      const clampedEnd = tEnd < tStart ? tStart : tEnd;

      arr.push({
        rowKey: `task:${task.id}`,
        id: task.id,
        kind: 'task',
        task,
        subtaskPath: [],
        depth: 0,
        title: task.title,
        assignee: task.assignedTo || 'Équipe',
        startDate: tStart,
        endDate: clampedEnd,
        completed: task.status === 'completed',
        isBlocked: task.status === 'blocked' || Boolean(task.isBlocked),
        isMilestone: Boolean(task.isMilestone),
        dependsOnIds: task.dependsOnIds || [],
        groupId,
      });

      if (expandedTaskIds[task.id] && task.subtasks && task.subtasks.length > 0) {
        pushSubtasks(arr, task, task.subtasks, [], 1, groupId);
      }
    });

    return map;
  }, [tasks, groups, groupBy, sections, expandedTaskIds, todayIso]);

  // Index plat des lignes visibles pour tracer les flèches de dépendances SVG
  const flatVisibleRows = useMemo(() => {
    const out: Array<{ row: TimelineRow; rowIndex: number; startCol: number; endCol: number }> = [];
    let rowIdx = 0;
    groups.forEach((g) => {
      rowIdx += 1; // En-tête de groupe
      const rows = rowsByGroup.get(g.id) || [];
      rows.forEach((row) => {
        const rawStartCol = diffDays(windowStart, row.startDate);
        const rawEndCol = diffDays(windowStart, row.endDate);
        const startCol = Math.max(0, Math.min(daysSpan - 1, rawStartCol));
        const endCol = Math.max(startCol, Math.min(daysSpan - 1, rawEndCol));
        out.push({ row, rowIndex: rowIdx, startCol, endCol });
        rowIdx += 1;
      });
    });
    return out;
  }, [groups, rowsByGroup, windowStart, daysSpan]);

  const rowCoordsById = useMemo(() => {
    const map = new Map<string, { rowIndex: number; startCol: number; endCol: number }>();
    flatVisibleRows.forEach((item) => {
      map.set(item.row.id, {
        rowIndex: item.rowIndex,
        startCol: item.startCol,
        endCol: item.endCol,
      });
    });
    return map;
  }, [flatVisibleRows]);

  const shiftTaskByDays = (task: Task, delta: number) => {
    if (!onMoveTask) return;
    const baseStart = task.startDate || task.date || todayIso;
    const baseEnd = task.dueDate || task.date || baseStart;
    onMoveTask({
      taskId: task.id,
      targetStartDate: addDaysIso(baseStart, delta),
      targetDate: addDaysIso(baseEnd, delta),
    });
  };

  const handleDropOnDay = (targetDayIso: string, targetGroupId?: string) => {
    if (!draggedTaskId || !onMoveTask) return;
    const t = tasks.find((x) => x.id === draggedTaskId);
    setDraggedTaskId(null);
    if (!t) return;
    const oldStart = t.startDate || t.date || targetDayIso;
    const oldEnd = t.dueDate || t.date || oldStart;
    const duration = Math.max(0, diffDays(oldStart, oldEnd));
    const newStart = targetDayIso;
    const newEnd = addDaysIso(newStart, duration);
    onMoveTask({
      taskId: t.id,
      targetStartDate: newStart,
      targetDate: newEnd,
      targetSectionId: groupBy === 'section' ? targetGroupId : undefined,
    });
  };

  const ROW_H = 38;
  const LEFT_COL_W = 290;

  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
      {/* Barre d'outils Chronologie */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-stone-200 bg-stone-50/70">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setWindowStart((w) => addDaysIso(w, -7))}
            className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 cursor-pointer"
            title="Semaine précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setWindowStart(addDaysIso(todayIso, -2))}
            className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-xs font-semibold text-stone-700 cursor-pointer whitespace-nowrap"
          >
            Aujourd’hui
          </button>
          <button
            type="button"
            onClick={() => setWindowStart((w) => addDaysIso(w, 7))}
            className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 cursor-pointer"
            title="Semaine suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="ml-2 text-xs font-semibold text-stone-700 font-mono tabular-nums whitespace-nowrap">
            {windowStart} → {windowEnd}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200">
            <button
              type="button"
              onClick={() => setGroupBy('section')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap ${
                groupBy === 'section' ? 'bg-white text-[#2A7B76]' : 'text-stone-600'
              }`}
            >
              Par section
            </button>
            <button
              type="button"
              onClick={() => setGroupBy('assignee')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap ${
                groupBy === 'assignee' ? 'bg-white text-[#2A7B76]' : 'text-stone-600'
              }`}
            >
              Par collaborateur
            </button>
          </div>

          <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200">
            <button
              type="button"
              onClick={() => setDaysSpan(14)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer tabular-nums ${
                daysSpan === 14 ? 'bg-white text-[#2A7B76]' : 'text-stone-600'
              }`}
            >
              14 j
            </button>
            <button
              type="button"
              onClick={() => setDaysSpan(21)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer tabular-nums ${
                daysSpan === 21 ? 'bg-white text-[#2A7B76]' : 'text-stone-600'
              }`}
            >
              21 j
            </button>
          </div>
        </div>
      </div>

      {/* Grille Chronologie */}
      <div className="overflow-x-auto">
        <div className="min-w-[980px]">
          {/* En-tête des jours */}
          <div className="flex border-b border-stone-200 bg-stone-50">
            <div
              className="shrink-0 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-500 border-r border-stone-200 flex items-center gap-1.5"
              style={{ width: LEFT_COL_W }}
            >
              <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" />
              <span>Tâches &amp; Sous-tâches</span>
            </div>
            <div
              className="flex-1 grid"
              style={{ gridTemplateColumns: `repeat(${daysSpan}, minmax(34px, 1fr))` }}
            >
              {days.map((d) => (
                <div
                  key={d.iso}
                  className={`py-1.5 text-center border-r border-stone-100 last:border-r-0 ${
                    d.isToday
                      ? 'bg-[#2A7B76]/10 text-[#2A7B76]'
                      : d.isWeekend
                      ? 'bg-stone-100/70 text-stone-400'
                      : 'text-stone-600'
                  }`}
                >
                  <div className="text-[10px] uppercase font-semibold">{d.weekday}</div>
                  <div className="text-xs font-bold font-mono tabular-nums">{d.dayNum}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Corps avec calque SVG dépendances */}
          <div className="relative">
            {groups.map((group) => {
              const rows = rowsByGroup.get(group.id) || [];
              return (
                <div key={group.id}>
                  {/* Ligne de groupe / section */}
                  <div
                    className="flex items-center bg-stone-50/90 border-b border-stone-200"
                    style={{ height: ROW_H }}
                  >
                    <div
                      className="shrink-0 px-4 flex items-center gap-2 border-r border-stone-200 h-full"
                      style={{ width: LEFT_COL_W }}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="text-xs font-bold text-stone-800 truncate">
                        {group.title}
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-stone-400">
                        {rows.filter((r) => r.kind === 'task').length}
                      </span>
                    </div>
                    <div
                      className="flex-1 grid h-full"
                      style={{ gridTemplateColumns: `repeat(${daysSpan}, minmax(34px, 1fr))` }}
                    >
                      {days.map((d) => (
                        <div
                          key={d.iso}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDropOnDay(d.iso, group.id)}
                          className={`border-r border-stone-100/80 last:border-r-0 ${
                            d.isToday ? 'bg-[#2A7B76]/5' : d.isWeekend ? 'bg-stone-50/70' : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Lignes tâches & sous-tâches */}
                  {rows.map((row) => {
                    const hasSubtasks =
                      row.kind === 'task' && (row.task.subtasks?.length || 0) > 0;
                    const isExpanded = Boolean(expandedTaskIds[row.task.id]);

                    const rawStartCol = diffDays(windowStart, row.startDate);
                    const rawEndCol = diffDays(windowStart, row.endDate);
                    const isVisible = rawEndCol >= 0 && rawStartCol < daysSpan;
                    const startCol = Math.max(0, Math.min(daysSpan - 1, rawStartCol));
                    const endCol = Math.max(startCol, Math.min(daysSpan - 1, rawEndCol));
                    const spanCols = Math.max(1, endCol - startCol + 1);

                    return (
                      <div
                        key={row.rowKey}
                        className="flex items-center border-b border-stone-100 hover:bg-stone-50/60 transition-colors"
                        style={{ height: ROW_H }}
                      >
                        {/* Colonne gauche */}
                        <div
                          className="shrink-0 px-3 flex items-center gap-1.5 border-r border-stone-200 h-full min-w-0"
                          style={{
                            width: LEFT_COL_W,
                            paddingLeft: `${12 + row.depth * 18}px`,
                          }}
                        >
                          {hasSubtasks ? (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedTaskIds((prev) => ({
                                  ...prev,
                                  [row.task.id]: !prev[row.task.id],
                                }))
                              }
                              className="p-0.5 rounded hover:bg-stone-200 text-stone-500 cursor-pointer shrink-0"
                              title="Afficher les sous-tâches sur la chronologie"
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
                              row.kind === 'task'
                                ? onStatusChange(
                                    row.task.id,
                                    row.completed ? 'todo' : 'completed'
                                  )
                                : onToggleSubtaskAtPath?.(row.task.id, row.subtaskPath)
                            }
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 cursor-pointer ${
                              row.completed
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-stone-300 hover:border-[#2A7B76]'
                            }`}
                          >
                            {row.completed && <Check className="h-2.5 w-2.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectTask(row.task, row.subtaskPath)}
                            className={`text-left text-xs truncate flex-1 cursor-pointer hover:text-[#2A7B76] ${
                              row.completed
                                ? 'line-through text-stone-400'
                                : row.kind === 'task'
                                ? 'font-semibold text-stone-800'
                                : 'font-medium text-stone-600'
                            }`}
                          >
                            {row.title}
                          </button>

                          {row.dependsOnIds.length > 0 && (
                            <span title={`${row.dependsOnIds.length} dépendance(s)`}>
                              <Link2 className="h-3 w-3 text-amber-600 shrink-0" />
                            </span>
                          )}
                        </div>

                        {/* Grille jours + barre Gantt */}
                        <div
                          className="flex-1 relative grid h-full"
                          style={{
                            gridTemplateColumns: `repeat(${daysSpan}, minmax(34px, 1fr))`,
                          }}
                        >
                          {days.map((d) => (
                            <div
                              key={d.iso}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => handleDropOnDay(d.iso, group.id)}
                              className={`border-r border-stone-100/80 last:border-r-0 h-full ${
                                d.isToday
                                  ? 'bg-[#2A7B76]/5'
                                  : d.isWeekend
                                  ? 'bg-stone-50/60'
                                  : ''
                              }`}
                            />
                          ))}

                          {isVisible && (
                            <div
                              draggable={row.kind === 'task'}
                              onDragStart={() =>
                                row.kind === 'task' && setDraggedTaskId(row.task.id)
                              }
                              onDragEnd={() => setDraggedTaskId(null)}
                              onClick={() => onSelectTask(row.task, row.subtaskPath)}
                              style={{
                                left: `${(startCol / daysSpan) * 100}%`,
                                width: row.isMilestone
                                  ? `${(1 / daysSpan) * 100}%`
                                  : `${(spanCols / daysSpan) * 100}%`,
                              }}
                              className={`group absolute top-1.5 bottom-1.5 z-10 px-2 flex items-center justify-between gap-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition select-none ${
                                row.completed
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : row.isBlocked
                                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                                  : row.kind === 'subtask'
                                  ? 'bg-stone-100 border-stone-300 text-stone-700'
                                  : 'bg-[#2A7B76] border-[#22625e] text-white'
                              }`}
                              title={`${row.title} (${row.startDate} → ${row.endDate})`}
                            >
                              <div className="flex items-center gap-1 min-w-0">
                                {row.isMilestone && (
                                  <Diamond className="h-3 w-3 shrink-0 fill-amber-300 text-amber-300" />
                                )}
                                <span className="truncate">{row.title}</span>
                              </div>

                              <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                                {row.kind === 'task' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        shiftTaskByDays(row.task, -1);
                                      }}
                                      className="px-1 rounded bg-black/15 hover:bg-black/25 text-[10px] font-mono cursor-pointer"
                                      title="Avancer d'un jour"
                                    >
                                      -1j
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        shiftTaskByDays(row.task, 1);
                                      }}
                                      className="px-1 rounded bg-black/15 hover:bg-black/25 text-[10px] font-mono cursor-pointer"
                                      title="Décaler d'un jour"
                                    >
                                      +1j
                                    </button>
                                  </>
                                )}
                                <span className="inline-flex items-center gap-0.5 text-[10px] opacity-80 ml-1">
                                  <User className="h-2.5 w-2.5" />
                                  {row.assignee.split(' ')[0]}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Calque SVG des lignes de dépendances */}
            {flatVisibleRows.some((r) => r.row.dependsOnIds.length > 0) && (
              <svg
                className="pointer-events-none absolute top-0 right-0 bottom-0 z-20"
                style={{ left: LEFT_COL_W, width: `calc(100% - ${LEFT_COL_W}px)`, height: '100%' }}
                viewBox={`0 0 1000 ${Math.max(1, (flatVisibleRows.length + groups.length) * ROW_H)}`}
                preserveAspectRatio="none"
              >
                <defs>
                  <marker
                    id="asana-dep-arrow"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L6,3 L0,6 Z" fill="#d97706" />
                  </marker>
                </defs>
                {flatVisibleRows.map((targetItem) =>
                  targetItem.row.dependsOnIds.map((depId) => {
                    const src = rowCoordsById.get(depId);
                    if (!src) return null;
                    const x1 = ((src.endCol + 1) / daysSpan) * 1000;
                    const y1 = src.rowIndex * ROW_H + ROW_H / 2;
                    const x2 = (targetItem.startCol / daysSpan) * 1000;
                    const y2 = targetItem.rowIndex * ROW_H + ROW_H / 2;
                    const midX = x1 + (x2 - x1) / 2;
                    return (
                      <path
                        key={`${depId}->${targetItem.row.id}`}
                        d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                        fill="none"
                        stroke="#d97706"
                        strokeWidth="1.5"
                        strokeDasharray="3 2"
                        markerEnd="url(#asana-dep-arrow)"
                      />
                    );
                  })
                )}
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Pied de légende compact */}
      <div className="px-4 py-2 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1">
            <GitBranch className="h-3.5 w-3.5 text-[#2A7B76]" />
            Glisser une barre sur un jour pour replanifier
          </span>
          <span className="inline-flex items-center gap-1">
            <Link2 className="h-3.5 w-3.5 text-amber-600" />
            Liens pointillés : dépendances bloquantes
          </span>
        </div>
        <span className="font-mono tabular-nums">{tasks.length} tâche(s) affichée(s)</span>
      </div>
    </div>
  );
};
