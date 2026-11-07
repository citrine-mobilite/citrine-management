import { Task, Employee, AppUser } from '../types';
import { pushNotificationService } from './pushNotificationService';
import { haptic } from './hapticService';

export interface ExceptionalCompletionResult {
  notified: boolean;
  message: string;
}

/**
 * Service pour notifier les Responsables (Admin, Managers) et l'IT 
 * lorsqu'un collaborateur accomplit de façon exceptionnelle une tâche complète.
 */
export async function notifyExceptionalTaskCompletion(
  task: Task,
  employeeName?: string,
  onAddNotification?: (notif: any) => Promise<void> | void
): Promise<ExceptionalCompletionResult> {
  const collab = employeeName || task.assignedTo || 'Un collaborateur';
  const taskTitle = task.title || 'Mission';

  const title = `🏆 Accomplissement Exceptionnel !`;
  const body = `${collab} a finalisé avec succès l'intégralité de la tâche : "${taskTitle}". Les responsables et l'équipe IT en sont informés.`;

  // 1. Déclenchement Haptique festif
  haptic.success();

  // 2. Envoi de la notification push système du navigateur / PWA
  try {
    await pushNotificationService.sendNotification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: `exceptional-task-${task.id}-${Date.now()}`,
      data: {
        taskId: task.id,
        url: '/#tasks',
      },
    });
  } catch (err) {
    console.warn('Push notification notice (ignorable):', err);
  }

  // 3. Notification interne / persistée destinée aux Responsables & IT
  const internalNotif = {
    id: `notif-exceptional-${task.id}-${Date.now()}`,
    title: `🏆 Tâche Complète Finalisée : ${taskTitle}`,
    message: `${collab} a validé l'ensemble des sous-tâches et clôturé cette mission majeure. Félicitations pour ce rendement exceptionnel !`,
    type: 'success',
    category: 'rendement_exceptionnel',
    targetRoles: ['admin', 'manager', 'responsable', 'it_admin'],
    read: false,
    timestamp: new Date().toISOString(),
    link: '#tasks',
    metadata: {
      taskId: task.id,
      taskTitle: task.title,
      employeeName: collab,
      isExceptional: true,
    },
  };

  try {
    if (onAddNotification) {
      await onAddNotification(internalNotif);
    }
  } catch (notifErr) {
    console.warn('Notification store warning:', notifErr);
  }

  // 4. Événement local broadcasté
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
  }

  return {
    notified: true,
    message: body,
  };
}
