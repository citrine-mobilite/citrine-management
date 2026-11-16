import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crosshair,
  Diamond,
  ListTree,
  Plus,
  User,
} from 'lucide-react';
import { Subtask, Task, TaskStatus } from '../../types';
import {
  ChronologicalTimelineEntry,
  flattenAllTasksAndSubtasksChronologically,
} from './logic/taskChronologyHelpers';

interface TaskCalendarViewProps {
  tasks: Task[];
  onSelectTask: (task: Task, subtaskPath?: string[]) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onToggleSubtaskAtPath?: (taskId: string, path: string[]) => void;
  onUpdateSubtaskAtPath?: (taskId: string, path: string[], patch: Partial<Subtask>) => void;
  onMoveTask?: (params: {
    taskId: string;
    targetDate: string;
    targetStartDate?: string;
  }) => void;
  onQuickCreateTask?: (input: {
    title: string;
    date: string;
    startDate: string;
    dueDate: string;
  }) => void;
}

interface CalendarChip {
  key: string;
  entry: ChronologicalTimelineEntry;
  dateIso: string;
  markerKind: 'due' | 'start';
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const toIsoDate = (year: number, monthIndex: number, day: number): string => {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

const formatFrDay = (iso: string): string => {
  const d = new Date(`${iso}T12:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  tasks,
  onSelectTask,
  onStatusChange,
  onToggleSubtaskAtPath,
  onUpdateSubtaskAtPath,
  onMoveTask,
  onQuickCreateTask,
}) => {
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => today.toISOString().split('T')[0], [today]);
  const [cursorYear, setCursorYear] = useState(today.getFullYear());
  const [cursorMonth, setCursorMonth] = useState(today.getMonth());
  const [selectedDayIso, setSelectedDayIso] = useState<string>(todayIso);
  const [agendaScope, setAgendaScope] = useState<'day' | 'month'>('day');
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [showSpanStarts, setShowSpanStarts] = useState(true);
  const [draggedItem, setDraggedItem] = useState<{
    kind: 'task' | 'subtask';
    taskId: string;
    subtaskPath: string[];
    startDate: string;
    endDate: string;
  } | null>(null);
  const [quickAddDay, setQuickAddDay] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState('');
  const didAutoFocusRef = useRef(false);

  const allEntries = useMemo(
    () => flattenAllTasksAndSubtasksChronologically(tasks, todayIso, showSubtasks),
    [tasks, todayIso, showSubtasks]
  );

  // Centrage automatique sur le mois actif si le mois courant est vide mais que des tâches existent
  useEffect(() => {
    if (didAutoFocusRef.current || allEntries.length === 0) return;
    didAutoFocusRef.current = true;
    const currentMonthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const hasInCurrentMonth = allEntries.some(
      (e) => e.endDate.startsWith(currentMonthPrefix) || e.startDate.startsWith(currentMonthPrefix)
    );
    if (!hasInCurrentMonth) {
      const upcoming = allEntries.find((e) => e.endDate >= todayIso) || allEntries[allEntries.length - 1];
      if (upcoming) {
        const d = new Date(`${upcoming.endDate}T12:00:00`);
        if (!isNaN(d.getTime())) {
          setCursorYear(d.getFullYear());
          setCursorMonth(d.getMonth());
          setSelectedDayIso(upcoming.endDate);
        }
      }
    }
  }, [allEntries, today, todayIso]);

  const monthPrefix = useMemo(
    () => `${cursorYear}-${String(cursorMonth + 1).padStart(2, '0')}`,
    [cursorYear, cursorMonth]
  );

  const monthLabel = useMemo(() => {
    const d = new Date(cursorYear, cursorMonth, 1);
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }, [cursorYear, cursorMonth]);

  const calendarCells = useMemo(() => {
    const firstOfMonth = new Date(cursorYear, cursorMonth, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7; // Lundi = 0
    const daysInMonth = new Date(cursorYear, cursorMonth + 1, 0).getDate();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    const cells: Array<{ iso: string; day: number; inCurrentMonth: boolean }> = [];
    for (let i = 0; i < totalCells; i++) {
      const dateObj = new Date(cursorYear, cursorMonth, 1 - startOffset + i);
      cells.push({
        iso: toIsoDate(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()),
        day: dateObj.getDate(),
        inCurrentMonth: dateObj.getMonth() === cursorMonth,
      });
    }
    return cells;
  }, [cursorYear, cursorMonth]);

  const chipsByDate = useMemo(() => {
    const map = new Map<string, CalendarChip[]>();
    const addChip = (chip: CalendarChip) => {
      if (!chip.dateIso) return;
      const list = map.get(chip.dateIso) || [];
      list.push(chip);
      map.set(chip.dateIso, list);
    };

    allEntries.forEach((entry) => {
      addChip({
        key: `${entry.rowKey}:due`,
        entry,
        dateIso: entry.endDate,
        markerKind: 'due',
      });

      if (showSpanStarts && entry.startDate && entry.startDate < entry.endDate) {
        addChip({
          key: `${entry.rowKey}:start`,
          entry,
          dateIso: entry.startDate,
          markerKind: 'start',
        });
      }
    });

    // Tri chronologique strict dans chaque case jour (heure -> début avant échéance -> profondeur -> titre)
    for (const [dateKey, list] of map.entries()) {
      list.sort((a, b) => {
        const timeCmp = a.entry.time.localeCompare(b.entry.time);
        if (timeCmp !== 0) return timeCmp;
        if (a.markerKind !== b.markerKind) return a.markerKind === 'start' ? -1 : 1;
        if (a.entry.depth !== b.entry.depth) return a.entry.depth - b.entry.depth;
        return a.entry.title.localeCompare(b.entry.title, 'fr');
      });
      map.set(dateKey, list);
    }

    return map;
  }, [allEntries, showSpanStarts]);

  const monthStats = useMemo(() => {
    let monthTasks = 0;
    let monthSubtasks = 0;
    const seenKeys = new Set<string>();
    for (const [dateKey, chips] of chipsByDate.entries()) {
      if (!dateKey.startsWith(monthPrefix)) continue;
      chips.forEach((c) => {
        if (seenKeys.has(c.entry.rowKey)) return;
        seenKeys.add(c.entry.rowKey);
        if (c.entry.kind === 'task') monthTasks += 1;
        else monthSubtasks += 1;
      });
    }
    return { monthTasks, monthSubtasks };
  }, [chipsByDate, monthPrefix]);

  const agendaChips = useMemo(() => {
    if (agendaScope === 'day') {
      return chipsByDate.get(selectedDayIso) || [];
    }
    const items: CalendarChip[] = [];
    const seen = new Set<string>();
    for (const [dateKey, list] of chipsByDate.entries()) {
      if (!dateKey.startsWith(monthPrefix)) continue;
      list.forEach((chip) => {
        if (chip.markerKind === 'due' || !seen.has(chip.entry.rowKey)) {
          items.push(chip);
          seen.add(chip.entry.rowKey);
        }
      });
    }
    return items.sort((a, b) => {
      const dCmp = a.dateIso.localeCompare(b.dateIso);
      if (dCmp !== 0) return dCmp;
      const tCmp = a.entry.time.localeCompare(b.entry.time);
      if (tCmp !== 0) return tCmp;
      return a.entry.depth - b.entry.depth;
    });
  }, [agendaScope, chipsByDate, selectedDayIso, monthPrefix]);

  const prevMonth = () => {
    if (cursorMonth === 0) {
      setCursorYear((y) => y - 1);
      setCursorMonth(11);
    } else {
      setCursorMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (cursorMonth === 11) {
      setCursorYear((y) => y + 1);
      setCursorMonth(0);
    } else {
      setCursorMonth((m) => m + 1);
    }
  };

  const jumpToNearestTaskMonth = () => {
    if (allEntries.length === 0) return;
    const target = allEntries.find((e) => e.endDate >= todayIso) || allEntries[allEntries.length - 1];
    if (!target) return;
    const d = new Date(`${target.endDate}T12:00:00`);
    if (!isNaN(d.getTime())) {
      setCursorYear(d.getFullYear());
      setCursorMonth(d.getMonth());
      setSelectedDayIso(target.endDate);
    }
  };

  const handleDropOnDay = (targetDayIso: string) => {
    if (!draggedItem) return;
    const item = draggedItem;
    setDraggedItem(null);

    if (item.kind === 'task') {
      onMoveTask?.({ taskId: item.taskId, targetDate: targetDayIso });
    } else if (item.subtaskPath.length > 0) {
      const nextStart = item.startDate > targetDayIso ? targetDayIso : item.startDate;
      onUpdateSubtaskAtPath?.(item.taskId, item.subtaskPath, {
        startDate: nextStart,
        dueDate: targetDayIso,
        endDate: targetDayIso,
      });
    }
  };

  const handleCreateSubmit = (iso: string) => {
    const trimmed = quickTitle.trim();
    if (!trimmed || !onQuickCreateTask) return;
    onQuickCreateTask({
      title: trimmed,
      date: iso,
      startDate: iso,
      dueDate: iso,
    });
    setQuickTitle('');
    setQuickAddDay(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        {/* En-tête Calendrier */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-stone-200 bg-stone-50/70">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 cursor-pointer"
              title="Mois précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setCursorYear(today.getFullYear());
                setCursorMonth(today.getMonth());
                setSelectedDayIso(todayIso);
              }}
              className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-xs font-semibold text-stone-700 cursor-pointer"
            >
              Aujourd’hui
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 cursor-pointer"
              title="Mois suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <h3 className="ml-1 text-sm font-bold text-stone-900 capitalize">{monthLabel}</h3>

            <span className="text-[11px] font-mono tabular-nums text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
              {monthStats.monthTasks} tâche(s) · {monthStats.monthSubtasks} sous-tâche(s)
            </span>

            {monthStats.monthTasks + monthStats.monthSubtasks === 0 && allEntries.length > 0 && (
              <button
                type="button"
                onClick={jumpToNearestTaskMonth}
                className="px-2.5 py-1 rounded-lg border border-[#2A7B76]/30 bg-emerald-50/70 hover:bg-emerald-100 text-[11px] font-semibold text-[#2A7B76] cursor-pointer flex items-center gap-1"
              >
                <Crosshair className="h-3.5 w-3.5" />
                <span>Aller au mois actif</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showSpanStarts}
                onChange={(e) => setShowSpanStarts(e.target.checked)}
                className="rounded border-stone-300 text-[#2A7B76] focus:ring-[#2A7B76]"
              />
              <span>Dates de début &amp; échéances</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showSubtasks}
                onChange={(e) => setShowSubtasks(e.target.checked)}
                className="rounded border-stone-300 text-[#2A7B76] focus:ring-[#2A7B76]"
              />
              <ListTree className="h-3.5 w-3.5 text-[#2A7B76]" />
              <span>Inclure les sous-tâches</span>
            </label>
          </div>
        </div>

        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50">
          {WEEKDAYS.map((wd) => (
            <div
              key={wd}
              className="py-2 text-center text-[11px] font-bold uppercase tracking-wider text-stone-500 border-r border-stone-200 last:border-r-0"
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Cellules mensuelles */}
        <div className="grid grid-cols-7">
          {calendarCells.map((cell) => {
            const dayChips = chipsByDate.get(cell.iso) || [];
            const isToday = cell.iso === todayIso;
            const isSelected = cell.iso === selectedDayIso;
            const isQuickOpen = quickAddDay === cell.iso;

            return (
              <div
                key={cell.iso}
                onClick={() => setSelectedDayIso(cell.iso)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropOnDay(cell.iso)}
                className={`group min-h-[132px] p-2 border-r border-b border-stone-200 last:border-r-0 flex flex-col gap-1 transition-colors cursor-pointer ${
                  cell.inCurrentMonth ? 'bg-white' : 'bg-stone-50/60'
                } ${
                  isSelected
                    ? 'ring-2 ring-inset ring-[#2A7B76]/70 bg-emerald-50/20'
                    : isToday
                    ? 'ring-1 ring-inset ring-[#2A7B76]'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs font-mono tabular-nums font-bold px-1.5 py-0.5 rounded-md ${
                        isToday
                          ? 'bg-[#2A7B76] text-white'
                          : cell.inCurrentMonth
                          ? 'text-stone-700'
                          : 'text-stone-400'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {dayChips.length > 0 && (
                      <span className="text-[10px] font-mono tabular-nums text-stone-400">
                        ({dayChips.length})
                      </span>
                    )}
                  </div>

                  {onQuickCreateTask && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickAddDay(cell.iso);
                        setQuickTitle('');
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-stone-100 text-stone-500 hover:text-[#2A7B76] transition cursor-pointer"
                      title="Ajouter une tâche ce jour"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {isQuickOpen && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCreateSubmit(cell.iso);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="mb-1"
                  >
                    <input
                      autoFocus
                      type="text"
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Escape' && setQuickAddDay(null)}
                      onBlur={() => {
                        if (!quickTitle.trim()) setQuickAddDay(null);
                      }}
                      placeholder="Nouvelle tâche..."
                      className="w-full px-2 py-1 text-[11px] border border-[#2A7B76] rounded-md outline-none bg-white"
                    />
                  </form>
                )}

                <div className="space-y-1 overflow-y-auto max-h-[155px] pr-0.5">
                  {dayChips.map((chip) => {
                    const { entry } = chip;
                    const isStartMarker = chip.markerKind === 'start';

                    return (
                      <div
                        key={chip.key}
                        draggable={!isStartMarker}
                        onDragStart={() =>
                          !isStartMarker &&
                          setDraggedItem({
                            kind: entry.kind,
                            taskId: entry.task.id,
                            subtaskPath: entry.subtaskPath,
                            startDate: entry.startDate,
                            endDate: entry.endDate,
                          })
                        }
                        onDragEnd={() => setDraggedItem(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTask(entry.task, entry.subtaskPath);
                        }}
                        title={
                          entry.parentTrail
                            ? `${entry.time} · ${entry.parentTrail} › ${entry.title}`
                            : `${entry.time} · ${entry.title}`
                        }
                        className={`flex items-center gap-1 px-1.5 py-1 rounded-md border text-[11px] cursor-pointer transition ${
                          isStartMarker
                            ? 'border-dashed bg-stone-50/70 border-stone-300 text-stone-600'
                            : entry.completed
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 line-through'
                            : entry.isBlocked
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : entry.kind === 'subtask'
                            ? 'bg-amber-50/80 border-amber-200 text-amber-950 hover:border-amber-400'
                            : 'bg-[#2A7B76]/8 border-[#2A7B76]/25 text-stone-900 hover:border-[#2A7B76]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (entry.kind === 'task') {
                              onStatusChange(
                                entry.task.id,
                                entry.completed ? 'todo' : 'completed'
                              );
                            } else {
                              onToggleSubtaskAtPath?.(entry.task.id, entry.subtaskPath);
                            }
                          }}
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 cursor-pointer ${
                            entry.completed
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-stone-400 bg-white'
                          }`}
                        >
                          {entry.completed && <Check className="h-2.5 w-2.5" />}
                        </button>

                        <span className="text-[9px] font-mono tabular-nums text-stone-500 shrink-0">
                          {isStartMarker ? `▶${entry.time}` : entry.time}
                        </span>

                        {entry.isMilestone && (
                          <Diamond className="h-3 w-3 shrink-0 text-amber-600 fill-amber-200" />
                        )}

                        <span className="truncate font-medium">
                          {entry.kind === 'subtask' ? `↳ ${entry.title}` : entry.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agenda chronologique détaillé (Micro-suivi du jour ou du mois) */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-200 bg-stone-50/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#2A7B76]" />
            <h4 className="text-xs font-bold text-stone-900 capitalize">
              {agendaScope === 'day'
                ? `Chronologie détaillée — ${formatFrDay(selectedDayIso)}`
                : `Chronologie complète — ${monthLabel}`}
            </h4>
            <span className="text-[11px] font-mono tabular-nums text-stone-500">
              ({agendaChips.length} élément{agendaChips.length > 1 ? 's' : ''})
            </span>
          </div>

          <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200">
            <button
              type="button"
              onClick={() => setAgendaScope('day')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                agendaScope === 'day' ? 'bg-white text-[#2A7B76]' : 'text-stone-600'
              }`}
            >
              Jour sélectionné
            </button>
            <button
              type="button"
              onClick={() => setAgendaScope('month')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                agendaScope === 'month' ? 'bg-white text-[#2A7B76]' : 'text-stone-600'
              }`}
            >
              Tout le mois
            </button>
          </div>
        </div>

        {agendaChips.length === 0 ? (
          <div className="py-6 px-4 text-center text-xs text-stone-400">
            {agendaScope === 'day'
              ? 'Aucune tâche ni sous-tâche planifiée pour cette journée.'
              : 'Aucune tâche ni sous-tâche planifiée pour ce mois.'}
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {agendaChips.map((chip) => {
              const { entry } = chip;
              return (
                <div
                  key={`agenda-${chip.key}`}
                  onClick={() => onSelectTask(entry.task, entry.subtaskPath)}
                  className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-stone-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono tabular-nums font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md shrink-0">
                      <Clock className="h-3 w-3 text-[#2A7B76]" />
                      {agendaScope === 'month' ? `${chip.dateIso} · ` : ''}
                      {entry.time}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (entry.kind === 'task') {
                          onStatusChange(
                            entry.task.id,
                            entry.completed ? 'todo' : 'completed'
                          );
                        } else {
                          onToggleSubtaskAtPath?.(entry.task.id, entry.subtaskPath);
                        }
                      }}
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 cursor-pointer ${
                        entry.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-stone-300 hover:border-[#2A7B76]'
                      }`}
                    >
                      {entry.completed && <Check className="h-2.5 w-2.5" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            entry.kind === 'subtask'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {entry.kind === 'subtask' ? 'Sous-tâche' : 'Tâche'}
                        </span>
                        {chip.markerKind === 'start' && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 shrink-0">
                            Début
                          </span>
                        )}
                        <span
                          className={`text-xs truncate ${
                            entry.completed
                              ? 'line-through text-stone-400'
                              : 'font-semibold text-stone-800'
                          }`}
                        >
                          {entry.title}
                        </span>
                      </div>
                      {entry.parentTrail && (
                        <div className="text-[11px] text-stone-500 truncate mt-0.5">
                          ↳ {entry.parentTrail}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-[11px] text-stone-500">
                    <span className="hidden sm:inline font-mono tabular-nums text-[10px]">
                      {entry.startDate === entry.endDate
                        ? entry.endDate
                        : `${entry.startDate} → ${entry.endDate}`}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-md font-medium text-stone-700">
                      <User className="h-3 w-3 text-stone-400" />
                      {entry.assignee.split(' ')[0]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
