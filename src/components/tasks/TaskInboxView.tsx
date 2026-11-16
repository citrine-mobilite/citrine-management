import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Clock,
  Inbox,
  Link2,
  MessageSquare,
} from 'lucide-react';
import { Subtask, Task } from '../../types';
import { safeStorage } from '../../utils/safeStorage';
import { getUnfinishedBlockers } from './logic/asanaTreeEngine';

interface TaskInboxViewProps {
  tasks: Task[];
  onSelectTask: (task: Task, subtaskPath?: string[]) => void;
}

export interface InboxActivityItem {
  id: string;
  category: 'comment' | 'blocker' | 'overdue' | 'dependency';
  task: Task;
  subtaskPath: string[];
  title: string;
  detail: string;
  author?: string;
  timestamp: string;
}

const READ_STORAGE_KEY = 'citrine_asana_inbox_read_v1';

const loadReadMap = (): Record<string, boolean> => {
  try {
    const raw = safeStorage.getItem(READ_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export function synthesizeTaskInboxItems(tasks: Task[]): InboxActivityItem[] {
  const todayIso = new Date().toISOString().split('T')[0];
  const items: InboxActivityItem[] = [];

  const inspectSubtasks = (parentTask: Task, list: Subtask[], parentPath: string[]) => {
    for (const s of list) {
      const path = [...parentPath, s.id];
      const completed = Boolean(s.completed || s.status === 'completed');

      if (s.status === 'blocked' || s.isBlocked || (s.incidents && s.incidents.some((i) => !i.resolved))) {
        items.push({
          id: `sub-blk:${parentTask.id}:${s.id}`,
          category: 'blocker',
          task: parentTask,
          subtaskPath: path,
          title: `${parentTask.title} › ${s.title}`,
          detail: s.blockerReason || s.incidents?.[0]?.title || 'Sous-tâche signalée bloquée',
          timestamp: s.incidents?.[0]?.createdAt || parentTask.lastUpdatedTime || parentTask.date,
        });
      }

      if (s.comments && s.comments.length > 0) {
        const lastComment = s.comments[s.comments.length - 1];
        items.push({
          id: `sub-cmt:${parentTask.id}:${s.id}:${lastComment.id}`,
          category: 'comment',
          task: parentTask,
          subtaskPath: path,
          title: `${parentTask.title} › ${s.title}`,
          detail: lastComment.text,
          author: lastComment.author,
          timestamp: lastComment.timestamp || parentTask.lastUpdatedTime || parentTask.date,
        });
      }

      const subDue = (s.dueDate || s.endDate || '').slice(0, 10);
      if (!completed && subDue && subDue < todayIso) {
        items.push({
          id: `sub-due:${parentTask.id}:${s.id}:${subDue}`,
          category: 'overdue',
          task: parentTask,
          subtaskPath: path,
          title: `${parentTask.title} › ${s.title}`,
          detail: `Échéance dépassée (${subDue})`,
          timestamp: subDue,
        });
      }

      if (s.subtasks && s.subtasks.length > 0) {
        inspectSubtasks(parentTask, s.subtasks, path);
      }
    }
  };

  tasks.forEach((task) => {
    const isCompleted = task.status === 'completed';

    if (
      task.status === 'blocked' ||
      task.isBlocked ||
      (task.incidents && task.incidents.some((i) => !i.resolved))
    ) {
      items.push({
        id: `task-blk:${task.id}`,
        category: 'blocker',
        task,
        subtaskPath: [],
        title: task.title,
        detail:
          task.blockerReason ||
          task.incidents?.find((i) => !i.resolved)?.title ||
          'Tâche bloquée nécessitant une action',
        timestamp:
          task.incidents?.[0]?.createdAt || task.lastUpdatedTime || task.updatedAt || task.date,
      });
    }

    const unfinishedDeps = getUnfinishedBlockers(task.dependsOnIds, tasks);
    if (!isCompleted && unfinishedDeps.length > 0) {
      items.push({
        id: `task-dep:${task.id}:${unfinishedDeps.map((d) => d.id).join(',')}`,
        category: 'dependency',
        task,
        subtaskPath: [],
        title: task.title,
        detail: `En attente de « ${unfinishedDeps[0].title} »`,
        timestamp: task.lastUpdatedTime || task.date,
      });
    }

    if (task.comments && task.comments.length > 0) {
      const last = task.comments[task.comments.length - 1];
      items.push({
        id: `task-cmt:${task.id}:${last.id}`,
        category: 'comment',
        task,
        subtaskPath: [],
        title: task.title,
        detail: last.text,
        author: last.author,
        timestamp: last.timestamp || task.lastUpdatedTime || task.date,
      });
    }

    const dueIso = (task.dueDate || task.date || '').slice(0, 10);
    if (!isCompleted && dueIso && dueIso < todayIso) {
      items.push({
        id: `task-due:${task.id}:${dueIso}`,
        category: 'overdue',
        task,
        subtaskPath: [],
        title: task.title,
        detail: `Échéance dépassée (${dueIso})`,
        timestamp: dueIso,
      });
    }

    if (task.subtasks && task.subtasks.length > 0) {
      inspectSubtasks(task, task.subtasks, []);
    }
  });

  return items.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
}

export const TaskInboxView: React.FC<TaskInboxViewProps> = ({ tasks, onSelectTask }) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'comment' | 'blocker' | 'overdue'>('all');
  const [readMap, setReadMap] = useState<Record<string, boolean>>(() => loadReadMap());

  const items = useMemo(() => synthesizeTaskInboxItems(tasks), [tasks]);

  const unreadCount = useMemo(
    () => items.filter((item) => !readMap[item.id]).length,
    [items, readMap]
  );

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (filter === 'unread') return !readMap[item.id];
      if (filter === 'comment') return item.category === 'comment';
      if (filter === 'blocker') return item.category === 'blocker' || item.category === 'dependency';
      if (filter === 'overdue') return item.category === 'overdue';
      return true;
    });
  }, [items, filter, readMap]);

  const markRead = (id: string) => {
    setReadMap((prev) => {
      const next = { ...prev, [id]: true };
      safeStorage.setItem(READ_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const markAllRead = () => {
    const next: Record<string, boolean> = { ...readMap };
    items.forEach((it) => {
      next[it.id] = true;
    });
    safeStorage.setItem(READ_STORAGE_KEY, JSON.stringify(next));
    setReadMap(next);
  };

  const renderCategoryIcon = (cat: InboxActivityItem['category']) => {
    if (cat === 'comment') return <MessageSquare className="h-4 w-4 text-[#2A7B76]" />;
    if (cat === 'blocker') return <AlertTriangle className="h-4 w-4 text-rose-600" />;
    if (cat === 'dependency') return <Link2 className="h-4 w-4 text-amber-600" />;
    return <Clock className="h-4 w-4 text-amber-600" />;
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
      {/* Barre de filtrage Boîte de réception */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-stone-200 bg-stone-50/70">
        <div className="flex flex-wrap items-center gap-1.5">
          <Inbox className="h-4 w-4 text-[#2A7B76] mr-1" />
          {(
            [
              { id: 'all', label: `Tout (${items.length})` },
              { id: 'unread', label: `Non lus (${unreadCount})` },
              { id: 'comment', label: 'Commentaires' },
              { id: 'blocker', label: 'Blocages & Dépendances' },
              { id: 'overdue', label: 'Échéances' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-[#2A7B76] text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-xs font-semibold text-stone-700 cursor-pointer whitespace-nowrap"
          >
            <CheckCheck className="h-3.5 w-3.5 text-[#2A7B76]" />
            <span>Tout marquer comme lu</span>
          </button>
        )}
      </div>

      {/* Flux d'activité */}
      {visibleItems.length === 0 ? (
        <div className="py-12 text-center text-stone-400">
          <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <div className="text-sm font-semibold text-stone-600">Boîte de réception à jour</div>
        </div>
      ) : (
        <div className="divide-y divide-stone-100">
          {visibleItems.map((item) => {
            const isRead = Boolean(readMap[item.id]);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  markRead(item.id);
                  onSelectTask(item.task, item.subtaskPath);
                }}
                className={`w-full text-left px-4 py-3 flex items-start justify-between gap-3 hover:bg-stone-50 transition-colors cursor-pointer ${
                  isRead ? 'bg-white' : 'bg-[#2A7B76]/[0.03]'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">{renderCategoryIcon(item.category)}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {!isRead && <span className="w-2 h-2 rounded-full bg-[#2A7B76] shrink-0" />}
                      <span className="text-sm font-semibold text-stone-900 truncate">
                        {item.title}
                      </span>
                    </div>
                    <div className="text-xs text-stone-600 mt-0.5 line-clamp-2">
                      {item.author ? `${item.author} : ` : ''}
                      {item.detail}
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-mono tabular-nums text-stone-400 shrink-0">
                  {(item.timestamp || '').slice(0, 10)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
