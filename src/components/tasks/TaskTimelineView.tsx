import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crosshair,
  Diamond,
  GitBranch,
  Link2,
  ListTree,
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
} from './logic/asanaTreeEngine';
import {
  ChronologicalTimelineEntry,
  compareChronologicalEntries,
  flattenAllTasksAndSubtasksChronologically,
  flattenSubtasksChronologically,
  normalizeIsoDate,
  normalizeTimeString,
} from './logic/taskChronologyHelpers';

interface TaskTimelineViewProps {
  tasks: Task[];
  activeProject?: TaskProject;
  onSelectTask: (task: Task, subtaskPath?: string[]) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onToggleSubtaskAtPath?: (taskId: string, path: string[]) => void;
  onUpdateSubtaskAtPath?: (taskId: string, path: string[], patch: Partial<Subtask>) => void;
  onMoveTask?: (params: {
    taskId: string;
    targetSectionId?: string;
    targetDate?: string;
    targetStartDate?: string;
  }) => void;
}

interface TimelineRow extends ChronologicalTimelineEntry {
  groupId: string;
}

const addDaysIso = (iso: string, delta: number): string => {
  const clean = normalizeIsoDate(iso);
  const d = new Date(`${clean}T12:00:00`);
  if (isNaN(d.getTime())) return clean;
  d.setDate(d.getDate() + delta);
  return d.toISOString().split('T')[0];
};

const diffDays = (startIso: string, endIso: string): number => {
  const aClean = normalizeIsoDate(startIso);
  const bClean = normalizeIsoDate(endIso);
  const a = new Date(`${aClean}T12:00:00`).getTime();
  const b = new Date(`${bClean}T12:00:00`).getTime();
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.round((b - a) / 86400000);
};

const formatShortFr = (iso: string): string => {
  const clean = normalizeIsoDate(iso);
  const d = new Date(`${clean}T12:00:00`);
  if (isNaN(d.getTime())) return clean;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

export const TaskTimelineView: React.FC<TaskTimelineViewProps> = ({
  tasks,
  activeProject,
  onSelectTask,
  onStatusChange,
  onToggleSubtaskAtPath,
  onUpdateSubtaskAtPath,
  onMoveTask,
}) => {
  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [windowStart, setWindowStart] = useState<string>(() => addDaysIso(todayIso, -2));
  const [daysSpan, setDaysSpan] = useState<14 | 21>(14);
  const [groupBy, setGroupBy] = useState<'chronological' | 'section' | 'assignee'>('chronological');
  const [includeSubtasks, setIncludeSubtasks] = useState<boolean>(true);
  const [collapsedTaskIds, setCollapsedTaskIds] = useState<Record<string, boolean>>({});
  const [draggedItem, setDraggedItem] = useState<{
    kind: 'task' | 'subtask';
    taskId: string;
    subtaskPath: string[];
    startDate: string;
    endDate: string;
  } | null>(null);
  const didAutoFocusRef = useRef(false);

  const sections: TaskSection[] = useMemo(
    () => resolveProjectSections(activeProject),
    [activeProject]
  );

  // Liste plate chronologique globale (tâches + toutes sous-tâches)
  const allChronologicalEntries = useMemo(
    () => flattenAllTasksAndSubtasksChronologically(tasks, todayIso, includeSubtasks),
    [tasks, todayIso, includeSubtasks]
  );

  // Centrage automatique initial si aucune tâche/sous-tâche n'apparaît dans la fenêtre par défaut
  useEffect(() => {
    if (didAutoFocusRef.current || allChronologicalEntries.length === 0) return;
    didAutoFocusRef.current = true;
    const defaultEnd = addDaysIso(addDaysIso(todayIso, -2), daysSpan - 1);
    const defaultStart = addDaysIso(todayIso, -2);
    const hasOverlap = allChronologicalEntries.some(
      (entry) => entry.endDate >= defaultStart && entry.startDate <= defaultEnd
    );
    if (!hasOverlap) {
      // Centrer sur l'élément le plus proche d'aujourd'hui ou le premier chronologiquement
      const upcoming = allChronologicalEntries.find((e) => e.endDate >= todayIso);
      const anchor = upcoming || allChronologicalEntries[allChronologicalEntries.length - 1];
      if (anchor) {
        setWindowStart(addDaysIso(anchor.startDate, -1));
      }
    }
  }, [allChronologicalEntries, todayIso, daysSpan]);

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
    if (groupBy === 'chronological') {
      return [
        {
          id: 'chronological_all',
          title: 'Fil chronologique (Tâches & Sous-tâches)',
          color: '#2A7B76',
        },
      ];
    }
    if (groupBy === 'section') {
      return sections.map((sec) => ({
        id: sec.id,
        title: sec.title,
        color: sec.color || '#2A7B76',
      }));
    }
    const assigneesSet = new Set<string>();
    tasks.forEach((t) => {
      assigneesSet.add((t.assignedTo || 'Non assigné').trim() || 'Non assigné');
      if (includeSubtasks && t.subtasks) {
        const walk = (subs: Subtask[]) => {
          subs.forEach((s) => {
            assigneesSet.add((s.assignedTo || t.assignedTo || 'Non assigné').trim() || 'Non assigné');
            if (s.subtasks?.length) walk(s.subtasks);
          });
        };
        walk(t.subtasks);
      }
    });
    const assignees = Array.from(assigneesSet).sort((a, b) => a.localeCompare(b, 'fr'));
    return assignees.map((name) => ({
      id: name,
      title: name,
      color: '#2A7B76',
    }));
  }, [groupBy, sections, tasks, includeSubtasks]);

  const rowsByGroup = useMemo(() => {
    const map = new Map<string, TimelineRow[]>();
    groups.forEach((g) => map.set(g.id, []));

    if (groupBy === 'chronological') {
      const target = map.get('chronological_all') || [];
      allChronologicalEntries.forEach((entry) => {
        target.push({ ...entry, groupId: 'chronological_all' });
      });
      return map;
    }

    // Modes 'section' et 'assignee' : tâches triées chronologiquement + sous-tâches dépliées par défaut triées chronologiquement
    const sortedParentTasks = [...tasks].sort((a, b) => {
      const aEntry = {
        startDate: normalizeIsoDate(a.startDate || a.date || a.createdAt, todayIso),
        endDate: normalizeIsoDate(a.dueDate || a.date, todayIso),
        time: normalizeTimeString(a.time, '09:00'),
        depth: 0,
        title: a.title,
      };
      const bEntry = {
        startDate: normalizeIsoDate(b.startDate || b.date || b.createdAt, todayIso),
        endDate: normalizeIsoDate(b.dueDate || b.date, todayIso),
        time: normalizeTimeString(b.time, '09:00'),
        depth: 0,
        title: b.title,
      };
      return compareChronologicalEntries(aEntry, bEntry);
    });

    sortedParentTasks.forEach((task) => {
      const groupId =
        groupBy === 'section'
          ? resolveTaskSectionId(task, sections)
          : (task.assignedTo || 'Non assigné').trim() || 'Non assigné';
      const arr = map.get(groupId) || map.get(groups[0]?.id || '');
      if (!arr) return;

      const startDate = normalizeIsoDate(task.startDate || task.date || task.createdAt, todayIso);
      const endDateRaw = normalizeIsoDate(task.dueDate || task.date || startDate, startDate);
      const endDate = endDateRaw < startDate ? startDate : endDateRaw;
      const time = normalizeTimeString(task.time, '09:00');

      arr.push({
        rowKey: `task:${task.id}`,
        id: task.id,
        kind: 'task',
        task,
        subtaskPath: [],
        depth: 0,
        parentTrail: '',
        title: task.title,
        assignee: task.assignedTo || 'Équipe',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        startDate,
        endDate,
        time,
        completed: task.status === 'completed',
        isBlocked: task.status === 'blocked' || Boolean(task.isBlocked),
        isMilestone: Boolean(task.isMilestone),
        dependsOnIds: task.dependsOnIds || [],
        groupId,
      });

      const isExpanded = !collapsedTaskIds[task.id];
      if (includeSubtasks && isExpanded && task.subtasks && task.subtasks.length > 0) {
        const subEntries = flattenSubtasksChronologically(
          task,
          task.subtasks,
          [],
          task.title,
          1,
          todayIso
        ).sort(compareChronologicalEntries);
        subEntries.forEach((sub) => {
          arr.push({ ...sub, groupId });
        });
      }
    });

    return map;
  }, [
    groups,
    groupBy,
    allChronologicalEntries,
    tasks,
    sections,
    collapsedTaskIds,
    includeSubtasks,
    todayIso,
  ]);

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

  const totalCounts = useMemo(() => {
    let taskCount = 0;
    let subtaskCount = 0;
    let outOfWindowCount = 0;
    flatVisibleRows.forEach(({ row }) => {
      if (row.kind === 'task') taskCount += 1;
      else subtaskCount += 1;
      if (row.endDate < windowStart || row.startDate > windowEnd) {
        outOfWindowCount += 1;
      }
    });
    return { taskCount, subtaskCount, outOfWindowCount };
  }, [flatVisibleRows, windowStart, windowEnd]);

  const focusOnTasks = () => {
    if (allChronologicalEntries.length === 0) return;
    const upcoming = allChronologicalEntries.find((e) => e.endDate >= todayIso);
    const target = upcoming || allChronologicalEntries[0];
    if (target) {
      setWindowStart(addDaysIso(target.startDate, -1));
    }
  };

  const shiftRowByDays = (row: TimelineRow, delta: number) => {
    const nextStart = addDaysIso(row.startDate, delta);
    const nextEnd = addDaysIso(row.endDate, delta);
    if (row.kind === 'task') {
      onMoveTask?.({
        taskId: row.task.id,
        targetStartDate: nextStart,
        targetDate: nextEnd,
      });
    } else if (row.subtaskPath.length > 0) {
      onUpdateSubtaskAtPath?.(row.task.id, row.subtaskPath, {
        startDate: nextStart,
        dueDate: nextEnd,
        endDate: nextEnd,
      });
    }
  };

  const handleDropOnDay = (targetDayIso: string, targetGroupId?: string) => {
    if (!draggedItem) return;
    const current = draggedItem;
    setDraggedItem(null);

    const duration = Math.max(0, diffDays(current.startDate, current.endDate));
    const newStart = targetDayIso;
    const newEnd = addDaysIso(newStart, duration);

    if (current.kind === 'task') {
      onMoveTask?.({
        taskId: current.taskId,
        targetStartDate: newStart,
        targetDate: newEnd,
        targetSectionId: groupBy === 'section' ? targetGroupId : undefined,
      });
    } else if (current.subtaskPath.length > 0) {
      onUpdateSubtaskAtPath?.(current.taskId, current.subtaskPath, {
        startDate: newStart,
        dueDate: newEnd,
        endDate: newEnd,
      });
    }
  };

  const toggleAllSubtasks = (collapse: boolean) => {
    if (!collapse) {
      setCollapsedTaskIds({});
      return;
    }
    const next: Record<string, boolean> = {};
    tasks.forEach((t) => {
      if (t.subtasks && t.subtasks.length > 0) next[t.id] = true;
    });
    setCollapsedTaskIds(next);
  };

  const ROW_H = 42;
  const LEFT_COL_W = 340;

  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
      {/* Barre d'outils Chronologie */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-stone-200 bg-stone-50/70">
        <div className="flex flex-wrap items-center gap-1.5">
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

          {allChronologicalEntries.length > 0 && (
            <button
              type="button"
              onClick={focusOnTasks}
              className="px-2.5 py-1.5 rounded-lg border border-[#2A7B76]/30 bg-emerald-50/70 hover:bg-emerald-100 text-[11px] font-semibold text-[#2A7B76] cursor-pointer flex items-center gap-1 whitespace-nowrap"
              title="Centrer la chronologie sur les tâches et sous-tâches actives"
            >
              <Crosshair className="h-3.5 w-3.5" />
              <span>
                {totalCounts.outOfWindowCount > 0
                  ? `Centrer (${totalCounts.outOfWindowCount} hors fenêtre)`
                  : 'Centrer sur les tâches'}
              </span>
            </button>
          )}

          <span className="ml-1 text-xs font-semibold text-stone-700 font-mono tabular-nums whitespace-nowrap">
            {formatShortFr(windowStart)} → {formatShortFr(windowEnd)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeSubtasks}
              onChange={(e) => setIncludeSubtasks(e.target.checked)}
              className="rounded border-stone-300 text-[#2A7B76] focus:ring-[#2A7B76]"
            />
            <ListTree className="h-3.5 w-3.5 text-[#2A7B76]" />
            <span>Sous-tâches</span>
          </label>

          {groupBy !== 'chronological' && includeSubtasks && (
            <button
              type="button"
              onClick={() => {
                const anyCollapsed = Object.keys(collapsedTaskIds).some((k) => collapsedTaskIds[k]);
                toggleAllSubtasks(!anyCollapsed);
              }}
              className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-xs font-semibold text-stone-700 cursor-pointer whitespace-nowrap"
            >
              {Object.keys(collapsedTaskIds).some((k) => collapsedTaskIds[k])
                ? 'Tout déplier'
                : 'Tout replier'}
            </button>
          )}

          <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200">
            <button
              type="button"
              onClick={() => setGroupBy('chronological')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap ${
                groupBy === 'chronological' ? 'bg-white text-[#2A7B76]' : 'text-stone-600'
              }`}
            >
              Chronologique
            </button>
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
      {allChronologicalEntries.length === 0 ? (
        <div className="py-12 px-6 text-center text-stone-500 text-xs">
          Aucune tâche ni sous-tâche ne correspond aux filtres actuels.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[1040px]">
            {/* En-tête des jours */}
            <div className="flex border-b border-stone-200 bg-stone-50">
              <div
                className="shrink-0 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-500 border-r border-stone-200 flex items-center justify-between gap-1.5"
                style={{ width: LEFT_COL_W }}
              >
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" />
                  <span>Tâches &amp; Sous-tâches</span>
                </span>
                <span className="font-mono text-[10px] text-stone-400">Début · Heure</span>
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
                    <div className="text-xs font-bold font-mono tabular-nums">
                      {d.dayNum}
                      {d.dayNum === 1 && (
                        <span className="ml-0.5 text-[9px] font-normal">{d.monthLabel}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Corps avec calque SVG dépendances */}
            <div className="relative">
              {groups.map((group) => {
                const rows = rowsByGroup.get(group.id) || [];
                const groupTaskCount = rows.filter((r) => r.kind === 'task').length;
                const groupSubCount = rows.filter((r) => r.kind === 'subtask').length;
                return (
                  <div key={group.id}>
                    {/* Ligne de groupe / section */}
                    <div
                      className="flex items-center bg-stone-50/90 border-b border-stone-200"
                      style={{ height: ROW_H }}
                    >
                      <div
                        className="shrink-0 px-4 flex items-center justify-between gap-2 border-r border-stone-200 h-full"
                        style={{ width: LEFT_COL_W }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: group.color }}
                          />
                          <span className="text-xs font-bold text-stone-800 truncate">
                            {group.title}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono tabular-nums text-stone-500 shrink-0">
                          {groupTaskCount}t{groupSubCount > 0 ? ` · ${groupSubCount}st` : ''}
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
                        groupBy !== 'chronological' &&
                        includeSubtasks &&
                        row.kind === 'task' &&
                        (row.task.subtasks?.length || 0) > 0;
                      const isExpanded = !collapsedTaskIds[row.task.id];

                      const rawStartCol = diffDays(windowStart, row.startDate);
                      const rawEndCol = diffDays(windowStart, row.endDate);
                      const isBeforeWindow = rawEndCol < 0;
                      const isAfterWindow = rawStartCol >= daysSpan;
                      const isVisible = !isBeforeWindow && !isAfterWindow;
                      const startCol = Math.max(0, Math.min(daysSpan - 1, rawStartCol));
                      const endCol = Math.max(startCol, Math.min(daysSpan - 1, rawEndCol));
                      const spanCols = Math.max(1, endCol - startCol + 1);
                      const leftPadding =
                        groupBy === 'chronological'
                          ? row.kind === 'subtask'
                            ? 22
                            : 12
                          : 12 + row.depth * 16;

                      return (
                        <div
                          key={row.rowKey}
                          className={`flex items-center border-b border-stone-100 hover:bg-stone-50/80 transition-colors ${
                            row.kind === 'subtask' ? 'bg-stone-50/30' : ''
                          }`}
                          style={{ height: ROW_H }}
                        >
                          {/* Colonne gauche */}
                          <div
                            className="shrink-0 pr-2.5 flex items-center justify-between gap-2 border-r border-stone-200 h-full min-w-0"
                            style={{
                              width: LEFT_COL_W,
                              paddingLeft: `${leftPadding}px`,
                            }}
                          >
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              {hasSubtasks ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCollapsedTaskIds((prev) => ({
                                      ...prev,
                                      [row.task.id]: !prev[row.task.id],
                                    }))
                                  }
                                  className="p-0.5 rounded hover:bg-stone-200 text-stone-500 cursor-pointer shrink-0"
                                  title={isExpanded ? 'Replier les sous-tâches' : 'Déplier les sous-tâches'}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              ) : row.kind === 'subtask' ? (
                                <span className="text-[11px] font-bold text-stone-400 shrink-0">↳</span>
                              ) : (
                                <span className="w-3.5 shrink-0" />
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
                                className="text-left min-w-0 flex-1 cursor-pointer group"
                                title={
                                  row.parentTrail
                                    ? `${row.parentTrail} › ${row.title}`
                                    : row.title
                                }
                              >
                                <div
                                  className={`text-xs truncate group-hover:text-[#2A7B76] ${
                                    row.completed
                                      ? 'line-through text-stone-400'
                                      : row.kind === 'task'
                                      ? 'font-semibold text-stone-800'
                                      : 'font-medium text-stone-700'
                                  }`}
                                >
                                  {row.title}
                                </div>
                                {row.kind === 'subtask' && row.parentTrail && (
                                  <div className="text-[10px] text-stone-400 truncate">
                                    {row.parentTrail}
                                  </div>
                                )}
                              </button>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {row.dependsOnIds.length > 0 && (
                                <span title={`${row.dependsOnIds.length} dépendance(s)`}>
                                  <Link2 className="h-3 w-3 text-amber-600 shrink-0" />
                                </span>
                              )}
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-mono tabular-nums text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                                <Clock className="h-2.5 w-2.5 text-stone-400" />
                                {formatShortFr(row.startDate)} · {row.time}
                              </span>
                            </div>
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

                            {isBeforeWindow && (
                              <button
                                type="button"
                                onClick={() => setWindowStart(addDaysIso(row.startDate, -1))}
                                className="absolute left-2 top-1.5 bottom-1.5 z-10 px-2.5 rounded-lg border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                title={`Aller au ${row.startDate}`}
                              >
                                <ChevronLeft className="h-3 w-3" />
                                <span>
                                  {formatShortFr(row.startDate)} · {row.title}
                                </span>
                              </button>
                            )}

                            {isAfterWindow && (
                              <button
                                type="button"
                                onClick={() => setWindowStart(addDaysIso(row.startDate, -1))}
                                className="absolute right-2 top-1.5 bottom-1.5 z-10 px-2.5 rounded-lg border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                title={`Aller au ${row.startDate}`}
                              >
                                <span>
                                  {row.title} · {formatShortFr(row.startDate)}
                                </span>
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            )}

                            {isVisible && (
                              <div
                                draggable
                                onDragStart={() =>
                                  setDraggedItem({
                                    kind: row.kind,
                                    taskId: row.task.id,
                                    subtaskPath: row.subtaskPath,
                                    startDate: row.startDate,
                                    endDate: row.endDate,
                                  })
                                }
                                onDragEnd={() => setDraggedItem(null)}
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
                                    ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                                    : 'bg-[#2A7B76] border-[#22625e] text-white'
                                }`}
                                title={`${row.title} (${row.startDate} ${row.time} → ${row.endDate})`}
                              >
                                <div className="flex items-center gap-1 min-w-0">
                                  {row.isMilestone && (
                                    <Diamond className="h-3 w-3 shrink-0 fill-amber-300 text-amber-300" />
                                  )}
                                  <span className="truncate">
                                    {row.kind === 'subtask' ? `↳ ${row.title}` : row.title}
                                  </span>
                                </div>

                                <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      shiftRowByDays(row, -1);
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
                                      shiftRowByDays(row, 1);
                                    }}
                                    className="px-1 rounded bg-black/15 hover:bg-black/25 text-[10px] font-mono cursor-pointer"
                                    title="Décaler d'un jour"
                                  >
                                    +1j
                                  </button>
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
      )}

      {/* Pied de légende compact */}
      <div className="px-4 py-2 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1">
            <GitBranch className="h-3.5 w-3.5 text-[#2A7B76]" />
            Glisser une barre (tâche ou sous-tâche) sur un jour pour replanifier
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#2A7B76] inline-block" /> Tâche
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-400 inline-block" /> Sous-tâche
          </span>
          <span className="inline-flex items-center gap-1">
            <Link2 className="h-3.5 w-3.5 text-amber-600" />
            Dépendances
          </span>
        </div>
        <span className="font-mono tabular-nums">
          {totalCounts.taskCount} tâche(s) · {totalCounts.subtaskCount} sous-tâche(s)
        </span>
      </div>
    </div>
  );
};
