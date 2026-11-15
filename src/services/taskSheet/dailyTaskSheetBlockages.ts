import { Subtask, Task } from '../../types';
import { DailyTaskSheetData } from './taskSheetTypes';

export function collectBlockagesAndComments(sortedParentTasks: Task[]): {
  unforeseenEvents: DailyTaskSheetData['unforeseenEvents'];
  managerComments: DailyTaskSheetData['managerComments'];
  managerAlertPoint: string;
} {
  const unforeseenEvents: DailyTaskSheetData['unforeseenEvents'] = [];
  const managerComments: DailyTaskSheetData['managerComments'] = [];

  sortedParentTasks.forEach((t) => {
    if (t.incidents && t.incidents.length > 0) {
      t.incidents.forEach((inc) => {
        unforeseenEvents.push({
          time: t.time || '10:30',
          subject: `🚨 [Blocage tâche] ${t.title} : ${inc.title || inc.description || 'Difficulté opérationnelle'}`,
          lostMinutes: 45,
          sourceTask: t.title,
          isFromBlockage: true,
          status: inc.resolved ? 'Résolu' : 'Bloqué',
        });
      });
    } else if (t.status === 'blocked') {
      unforeseenEvents.push({
        time: t.time || '10:30',
        subject: `🚨 [Blocage tâche] ${t.title} : Tâche bloquée`,
        lostMinutes: 45,
        sourceTask: t.title,
        isFromBlockage: true,
        status: 'Bloqué',
      });
    }

    if (t.comments && t.comments.length > 0) {
      t.comments.forEach((c) => {
        managerComments.push({
          id: c.id,
          taskTitle: t.title,
          isSubtask: false,
          author: c.author,
          time: c.timestamp || 'Journée',
          text: c.text,
        });
      });
    }

    const traverseSubtasks = (subList: Subtask[], parentName: string) => {
      subList.forEach((sub) => {
        if (sub.incidents && sub.incidents.length > 0) {
          sub.incidents.forEach((inc) => {
            unforeseenEvents.push({
              time: sub.time || '14:15',
              subject: `🚨 [Blocage sous-tâche] ${sub.title} (sur "${parentName}") : ${inc.title || inc.description || 'Difficulté opérationnelle'}`,
              lostMinutes: 30,
              sourceTask: sub.title,
              isFromBlockage: true,
              status: inc.resolved ? 'Résolu' : 'Bloqué',
            });
          });
        } else if (sub.status === 'blocked' || sub.isBlocked || sub.blockerReason) {
          unforeseenEvents.push({
            time: sub.time || '14:15',
            subject: `🚨 [Blocage sous-tâche] ${sub.title} (sur "${parentName}") : ${sub.blockerReason || 'Difficulté opérationnelle signalée'}`,
            lostMinutes: 30,
            sourceTask: sub.title,
            isFromBlockage: true,
            status: 'Bloqué',
          });
        }

        if (sub.comments && sub.comments.length > 0) {
          sub.comments.forEach((c) => {
            managerComments.push({
              id: c.id,
              taskTitle: `${sub.title} (sur "${parentName}")`,
              isSubtask: true,
              author: c.author,
              time: c.timestamp || 'Journée',
              text: c.text,
            });
          });
        }

        if (sub.subtasks && sub.subtasks.length > 0) {
          traverseSubtasks(sub.subtasks, sub.title);
        }
      });
    };

    if (t.subtasks && t.subtasks.length > 0) {
      traverseSubtasks(t.subtasks, t.title);
    }
  });

  const managerAlertPoint = managerComments.length > 0
    ? managerComments.map((c) => `[${c.taskTitle}] ${c.author}: ${c.text}`).join(' | ')
    : 'Aucun point particulier consigné par le collaborateur aujourd’hui.';

  return { unforeseenEvents, managerComments, managerAlertPoint };
}
