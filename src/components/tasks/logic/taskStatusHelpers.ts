import { Task, NotificationLog, TaskStatus } from '../../../types';
import { taskService } from '../../../services/taskService';
import { pushNotificationBridgeService } from '../../../services/pushNotificationBridgeService';
import { executeOperationWithLoading } from '../../../utils/sweetAlert';
import { notifyExceptionalTaskCompletion } from '../../../services/exceptionalTaskCompletionService';
import { logSystemAudit } from '../../../services/adminAuditService';

import { getUnfinishedBlockers } from './asanaTreeEngine';

export async function changeTaskStatusAction(params: {
  taskId: string;
  newStatus: TaskStatus;
  tasks: Task[];
  currentRole: string;
  selectedTaskForDetail: Task | null;
  onUpdateTasks: (updated: Task[]) => Promise<void> | void;
  setSelectedTaskForDetail: (t: Task | null) => void;
  onAddNotification: (log: NotificationLog) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}) {
  const {
    taskId,
    newStatus,
    tasks,
    currentRole,
    selectedTaskForDetail,
    onUpdateTasks,
    setSelectedTaskForDetail,
    onAddNotification,
    showToast,
  } = params;

  const targetTask = tasks.find((t) => t.id === taskId);
  if (!targetTask) return;

  if (newStatus === 'completed') {
    const blockers = getUnfinishedBlockers(targetTask.dependsOnIds, tasks);
    if (blockers.length > 0) {
      showToast?.(
        `Action bloquée : terminez d'abord « ${blockers[0].title} ».`,
        'error'
      );
      return;
    }
  }

  const updatedSubtasks = (targetTask.subtasks || []).map((s) =>
    newStatus === 'completed'
      ? { ...s, completed: true, status: 'completed' as TaskStatus, completedAt: s.completedAt || new Date().toISOString() }
      : s
  );

  const updatedTask: Task = {
    ...targetTask,
    status: newStatus,
    subtasks: updatedSubtasks,
    completedAt: newStatus === 'completed' ? targetTask.completedAt || new Date().toISOString() : undefined,
    lastUpdatedTime: new Date().toISOString(),
  };
  const statusLabels: Record<string, string> = {
    todo: 'À faire',
    in_progress: 'En cours',
    review: 'En révision',
    completed: 'Terminée',
  };
  const label = statusLabels[newStatus] || newStatus;

  await executeOperationWithLoading({
    loadingTitle: 'Mise à jour du statut...',
    loadingText: `Passage de "${targetTask.title}" au statut « ${label} », veuillez patienter...`,
    action: async () => {
      await taskService.saveTask(updatedTask);

      await onUpdateTasks(tasks.map((t) => (t.id === taskId ? updatedTask : t)));
      if (selectedTaskForDetail && selectedTaskForDetail.id === taskId) {
        setSelectedTaskForDetail(updatedTask);
      }

      const targetRecipient = targetTask.assignedTo || targetTask.employeeId || 'Collaborateur';
      const isCompletion = newStatus === 'completed' && targetTask.status !== 'completed';

      if (isCompletion) {
        notifyExceptionalTaskCompletion(updatedTask, targetTask.assignedTo, onAddNotification as any);
      } else {
        const operationKey = `task-status:${targetTask.id}:${newStatus}`;
        pushNotificationBridgeService.sendPush({
          operationKey,
          actionKey: operationKey,
          title: 'Mise à jour de Tâche',
          message: `La tâche "${targetTask.title}" est passée au statut : ${label}.`,
          senderName: currentRole || 'Collaborateur',
          type: 'task_assigned',
          link: 'tasks',
          suppressLocalNative: true,
          remoteBeams: {
            targetRoles: ['administrateur', 'responsable'],
          },
        });

        onAddNotification({
          id: `notif-task-move-${Date.now()}-${taskId}`,
          recipient: targetRecipient,
          type: 'system',
          title: `Mouvement de Tâche : ${targetTask.title}`,
          content: `La tâche est passée au statut « ${label} ».`,
          payload: JSON.stringify({
            source: 'task_movement',
            operationKey,
            taskId: targetTask.id,
            employeeId: targetRecipient,
            newStatus,
            previousStatus: targetTask.status,
          }),
          timestamp: new Date().toISOString(),
          read: false,
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('citrine:new_unread_alert'));
        }
      }

      logSystemAudit({
        authorName: currentRole || 'Collaborateur',
        authorRole: currentRole || 'Collaborateur',
        targetName: targetRecipient,
        targetEmployeeId: targetTask.employeeId,
        operationType: 'tache_projet',
        operationLabel: `Changement Statut Tâche (${label})`,
        details: `La tâche "${targetTask.title}" est passée de "${targetTask.status}" à "${label}".`,
        level: newStatus === 'completed' ? 'success' : newStatus === 'blocked' ? 'warning' : 'info',
        metadata: { assignedTo: targetRecipient, taskId: targetTask.id },
      });
    },
    successTitle: 'Statut mis à jour !',
    successMessage: `La tâche "${targetTask.title}" est passée au statut « ${label} ».`,
  });
}

export async function saveUpdatedTaskAction(params: {
  updatedTask: Task;
  tasks: Task[];
  onUpdateTasks: (updated: Task[]) => Promise<void> | void;
  setSelectedTaskForDetail: (t: Task | null) => void;
  onAddNotification: (log: NotificationLog) => void;
}) {
  const { updatedTask, tasks, onUpdateTasks, setSelectedTaskForDetail, onAddNotification } = params;
  const prevTask = tasks.find((t) => t.id === updatedTask.id);
  const finalizedTask = { ...updatedTask, updatedAt: new Date().toISOString() };

  await executeOperationWithLoading({
    loadingTitle: 'Enregistrement de la tâche...',
    loadingText: 'Mise à jour et synchronisation sur le serveur...',
    action: async () => {
      await taskService.saveTask(finalizedTask);
      await onUpdateTasks(tasks.map((t) => (t.id === finalizedTask.id ? finalizedTask : t)));
      setSelectedTaskForDetail(finalizedTask);

      if (finalizedTask.assignedTo) {
        const isStatusChanged = prevTask && prevTask.status !== finalizedTask.status;
        const isPriorityChanged = prevTask && prevTask.priority !== finalizedTask.priority;
        if (isStatusChanged || isPriorityChanged || !prevTask) {
          onAddNotification({
            id: `notif-task-update-${Date.now()}-${finalizedTask.id}`,
            recipient: finalizedTask.assignedTo,
            type: 'system',
            title: `Mise à jour de tâche : ${finalizedTask.title}`,
            content: isStatusChanged
              ? `Statut modifié : passage à « ${finalizedTask.status} »`
              : 'Détails de la tâche mis à jour.',
            payload: JSON.stringify({
              source: 'task_movement',
              taskId: finalizedTask.id,
              employeeId: finalizedTask.assignedTo,
              newStatus: finalizedTask.status,
            }),
            timestamp: new Date().toISOString(),
            read: false,
          });
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('citrine:new_unread_alert'));
          }
        }
      }
      logSystemAudit({
        targetName: finalizedTask.assignedTo || finalizedTask.title,
        targetEmployeeId: finalizedTask.employeeId,
        operationType: 'tache_projet',
        operationLabel: 'Mise à jour de Tâche',
        details: `Tâche "${finalizedTask.title}" modifiée (Statut: ${finalizedTask.status}, Priorité: ${finalizedTask.priority})`,
        level: 'info',
        metadata: { assignedTo: finalizedTask.assignedTo, taskId: finalizedTask.id },
      });
    },
    successTitle: 'Tâche mise à jour !',
    successMessage: `La tâche "${finalizedTask.title}" a été enregistrée avec succès.`,
  });
}
