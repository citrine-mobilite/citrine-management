import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Diamond,
  Plus,
} from 'lucide-react';
import { Subtask, Task, TaskStatus } from '../../types';

interface TaskCalendarViewProps {
  tasks: Task[];
  onSelectTask: (task: Task, subtaskPath?: string[]) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onToggleSubtaskAtPath?: (taskId: string, path: string[]) => void;
  onMoveTask?: (params: { taskId: string; targetDate: string }) => void;
  onQuickCreateTask?: (input: {
    title: string;
    date: string;
    startDate: string;
    dueDate: string;
  }) => void;
}

interface CalendarChip {
  key: string;
  kind: 'task' | 'subtask';
  task: Task;
  subtask?: Subtask;
  subtaskPath: string[];
  title: string;
  completed: boolean;
  isMilestone: boolean;
  isBlocked: boolean;
  dateIso: string;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const toIsoDate = (year: number, monthIndex: number, day: number): string => {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  tasks,
  onSelectTask,
  onStatusChange,
  onToggleSubtaskAtPath,
  onMoveTask,
  onQuickCreateTask,
}) => {
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => today.toISOString().split('T')[0], [today]);
  const [cursorYear, setCursorYear] = useState(today.getFullYear());
  const [cursorMonth, setCursorMonth] = useState(today.getMonth());
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [quickAddDay, setQuickAddDay] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState('');

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

    const walkSubs = (parentTask: Task, subs: Subtask[], parentPath: string[]) => {
      for (const s of subs) {
        const path = [...parentPath, s.id];
        const dateIso = (s.dueDate || s.endDate || parentTask.dueDate || parentTask.date || '').slice(0, 10);
        addChip({
          key: `sub:${parentTask.id}:${path.join('/')}`,
          kind: 'subtask',
          task: parentTask,
          subtask: s,
          subtaskPath: path,
          title: s.title,
          completed: Boolean(s.completed || s.status === 'completed'),
          isMilestone: false,
          isBlocked: Boolean(s.isBlocked || s.status === 'blocked'),
          dateIso,
        });
        if (s.subtasks && s.subtasks.length > 0) {
          walkSubs(parentTask, s.subtasks, path);
        }
      }
    };

    tasks.forEach((task) => {
      const dateIso = (task.dueDate || task.date || '').slice(0, 10);
      addChip({
        key: `task:${task.id}`,
        kind: 'task',
        task,
        subtaskPath: [],
        title: task.title,
        completed: task.status === 'completed',
        isMilestone: Boolean(task.isMilestone),
        isBlocked: task.status === 'blocked' || Boolean(task.isBlocked),
        dateIso,
      });
      if (showSubtasks && task.subtasks && task.subtasks.length > 0) {
        walkSubs(task, task.subtasks, []);
      }
    });

    return map;
  }, [tasks, showSubtasks]);

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
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
      {/* En-tête Calendrier */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-stone-200 bg-stone-50/70">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setCursorYear(today.getFullYear());
              setCursorMonth(today.getMonth());
            }}
            className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-xs font-semibold text-stone-700 cursor-pointer"
          >
            Aujourd’hui
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <h3 className="ml-2 text-sm font-bold text-stone-900 capitalize">{monthLabel}</h3>
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showSubtasks}
            onChange={(e) => setShowSubtasks(e.target.checked)}
            className="rounded border-stone-300 text-[#2A7B76] focus:ring-[#2A7B76]"
          />
          <span>Inclure les sous-tâches</span>
        </label>
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
          const isQuickOpen = quickAddDay === cell.iso;

          return (
            <div
              key={cell.iso}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedTaskId && onMoveTask) {
                  onMoveTask({ taskId: draggedTaskId, targetDate: cell.iso });
                }
                setDraggedTaskId(null);
              }}
              className={`group min-h-[118px] p-2 border-r border-b border-stone-200 last:border-r-0 flex flex-col gap-1 transition-colors ${
                cell.inCurrentMonth ? 'bg-white' : 'bg-stone-50/60'
              } ${isToday ? 'ring-1 ring-inset ring-[#2A7B76]' : ''}`}
            >
              <div className="flex items-center justify-between">
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

                {onQuickCreateTask && (
                  <button
                    type="button"
                    onClick={() => {
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

              <div className="space-y-1 overflow-y-auto max-h-[120px]">
                {dayChips.map((chip) => (
                  <div
                    key={chip.key}
                    draggable={chip.kind === 'task'}
                    onDragStart={() => chip.kind === 'task' && setDraggedTaskId(chip.task.id)}
                    onDragEnd={() => setDraggedTaskId(null)}
                    onClick={() => onSelectTask(chip.task, chip.subtaskPath)}
                    className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md border text-[11px] cursor-pointer transition ${
                      chip.completed
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 line-through'
                        : chip.isBlocked
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : chip.kind === 'subtask'
                        ? 'bg-stone-50 border-stone-200 text-stone-700'
                        : 'bg-[#2A7B76]/8 border-[#2A7B76]/25 text-stone-900 hover:border-[#2A7B76]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (chip.kind === 'task') {
                          onStatusChange(
                            chip.task.id,
                            chip.completed ? 'todo' : 'completed'
                          );
                        } else {
                          onToggleSubtaskAtPath?.(chip.task.id, chip.subtaskPath);
                        }
                      }}
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 cursor-pointer ${
                        chip.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-stone-400 bg-white'
                      }`}
                    >
                      {chip.completed && <Check className="h-2.5 w-2.5" />}
                    </button>

                    {chip.isMilestone && (
                      <Diamond className="h-3 w-3 shrink-0 text-amber-600 fill-amber-200" />
                    )}

                    <span className="truncate font-medium">
                      {chip.kind === 'subtask' ? `↳ ${chip.title}` : chip.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
