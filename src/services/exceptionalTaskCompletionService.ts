import { Task } from '../types';
import { pushNotificationBridgeService } from './pushNotificationBridgeService';
import { haptic } from './hapticService';

export interface ExceptionalCompletionResult {
  notified: boolean;
  message: string;
}

/**
 * Service pour notifier les Responsables (Admin, Managers) et l'IT
 * lorsqu'un collaborateur accomplit une tâche complète (notification unique dédupliquée + Pusher Beams).
 */
export async function notifyExceptionalTaskCompletion(
  task: Task,
  employeeName?: string,
  onAddNotification?: (notif: any) => Promise<void> | void
): Promise<ExceptionalCompletionResult> {
  const collab = employeeName || task.assignedTo || 'Un collaborateur';
  const taskTitle = task.title || 'Mission';

  const title = `Tâche terminée : ${taskTitle}`;
  const body = `${collab} a finalisé la tâche "${taskTitle}".`;
  const operationKey = `task-complete:${task.id}`;

  haptic.success();

  pushNotificationBridgeService.sendPush({
    operationKey,
    actionKey: operationKey,
    title,
    message: body,
    senderName: collab,
    type: 'task_assigned',
    link: 'tasks',
    suppressLocalNative: true,
    remoteBeams: {
      targetRoles: ['administrateur', 'responsable'],
    },
  });

  const internalNotif = {
    id: `notif-exceptional-${task.id}-${Date.now()}`,
    title,
    content: body,
    message: body,
    type: 'system',
    category: 'rendement_exceptionnel',
    targetRoles: ['admin', 'manager', 'responsable', 'it_admin'],
    recipient: 'Direction RH & Responsables',
    read: false,
    timestamp: new Date().toISOString(),
    link: '#tasks',
    payload: JSON.stringify({
      source: 'task_completed',
      operationKey,
      taskId: task.id,
      taskTitle: task.title,
      employeeName: collab,
      isExceptional: true,
    }),
  };

  try {
    if (onAddNotification) {
      await onAddNotification(internalNotif);
    }
  } catch (notifErr) {
    console.warn('Notification store warning:', notifErr);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('citrine:exceptional_task_completed', {
        detail: {
          task,
          employeeName: collab,
          notification: internalNotif,
        },
      })
    );
    window.dispatchEvent(new CustomEvent('citrine:new_unread_alert'));
  }

  return {
    notified: true,
    message: body,
  };
}
