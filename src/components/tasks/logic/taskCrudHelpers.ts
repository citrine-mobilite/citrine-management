import { Task, NotificationLog, TaskProject, Subtask } from '../../../types';
import { taskService } from '../../../services/taskService';
import { pushNotificationBridgeService } from '../../../services/pushNotificationBridgeService';
import {
  showErrorAlert,
  confirmDeleteAlert,
  executeOperationWithLoading,
  executeDeleteWithSweetAlert,
} from '../../../utils/sweetAlert';
import { logSystemAudit } from '../../../services/adminAuditService';

export async function confirmDeleteTaskWithPrompt(params: {
  task: Task;
  tasks: Task[];
  selectedTaskForDetail: Task | null;
  onUpdateTasks: (updated: Task[]) => void;
  setSelectedTaskForDetail: (t: Task | null) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}) {
  const { task, tasks, selectedTaskForDetail, onUpdateTasks, setSelectedTaskForDetail, showToast } = params;
  const isConfirmed = await confirmDeleteAlert({
    title: 'Supprimer la tâche',
    text: 'Voulez-vous vraiment supprimer cette tâche ? Cette action est irréversible.',
    itemName: task.title,
    confirmButtonText: 'Oui, supprimer la tâche',
  });
  if (!isConfirmed) return;

  const targetId = String(task.id);
  const targetDocId = task.docId ? String(task.docId) : '';

  try {
    await taskService.deleteTask(targetId);
    if (targetDocId && targetDocId !== targetId) {
      await taskService.deleteTask(targetDocId);
    }

    const updated = tasks.filter((t) => {
      const tId = String(t.id);
      const tDocId = t.docId ? String(t.docId) : '';
      if (tId === targetId || (targetDocId && tId === targetDocId)) return false;
      if (tDocId && (tDocId === targetId || (targetDocId && tDocId === targetDocId))) return false;
      return true;
    });

    onUpdateTasks(updated);
    logSystemAudit({
      targetName: task.assignedTo || task.title,
      targetEmployeeId: task.employeeId,
      operationType: 'tache_projet',
      operationLabel: 'Suppression de Tâche',
      details: `Tâche supprimée : "${task.title}"`,
      level: 'warning',
      metadata: { assignedTo: task.assignedTo, taskId: task.id },
    });

    if (
      selectedTaskForDetail &&
      (String(selectedTaskForDetail.id) === targetId ||
        (targetDocId && String(selectedTaskForDetail.id) === targetDocId))
    ) {
      setSelectedTaskForDetail(null);
    }

    if (showToast) {
      showToast('Tâche supprimée avec succès.', 'success');
    }
  } catch (err: any) {
    await showErrorAlert('Erreur de suppression', err?.message || 'Impossible de supprimer la tâche.');
  }
}

export async function createNewProjectAction(params: {
  newProject: TaskProject;
  projects: TaskProject[];
  setProjects: (p: TaskProject[]) => void;
  setActiveProjectId: (id: string) => void;
}) {
  const { newProject, projects, setProjects, setActiveProjectId } = params;
  await executeOperationWithLoading({
    loadingTitle: 'Création du projet...',
    loadingText: 'Enregistrement du projet en base...',
    action: async () => {
      setProjects([...projects, newProject]);
      setActiveProjectId(newProject.id);
      logSystemAudit({
        targetName: newProject.name,
        operationType: 'tache_projet',
        operationLabel: 'Création Dossier Projet',
        details: `Nouveau dossier projet créé : "${newProject.name}"`,
        level: 'success',
      });
    },
    successTitle: 'Projet créé !',
    successMessage: `Le projet "${newProject.name}" a été créé avec succès.`,
  });
}

export async function createNewTaskAction(params: {
  taskData: Omit<Task, 'id' | 'comments' | 'incidents'> & { subtasks?: Subtask[] };
  tasks: Task[];
  currentRole: string;
  onUpdateTasks: (updated: Task[]) => void;
  onAddNotification: (log: NotificationLog) => void;
}) {
  const { taskData, tasks, currentRole, onUpdateTasks, onAddNotification } = params;
  const taskItem: Task = {
    id: `task-${Date.now()}`,
    ...taskData,
    subtasks: taskData.subtasks || [],
    comments: [],
    incidents: [],
    lastUpdatedTime: new Date().toISOString(),
  };

  await executeOperationWithLoading({
    loadingTitle: 'Création de la tâche...',
    loadingText: 'Enregistrement et synchronisation en base de données...',
    action: async () => {
      await taskService.saveTask(taskItem);
      onUpdateTasks([taskItem, ...tasks]);

      onAddNotification({
        id: `notif-${Date.now()}`,
        recipient: taskItem.assignedTo || 'Équipe',
        type: 'system',
        title: 'Nouvelle Tâche Assignée',
        content: `${taskItem.title} (${taskItem.date})`,
        payload: '{}',
        timestamp: new Date().toISOString(),
      });

      pushNotificationBridgeService.sendPush({
        title: 'Nouvelle Tâche Assignée 📋',
        message: `${taskItem.title} vous a été assignée pour le ${taskItem.date}.`,
        senderName: currentRole || 'Responsable',
        type: 'task_assigned',
        link: 'tasks',
      });
      logSystemAudit({
        authorName: currentRole || 'Responsable',
        authorRole: currentRole || 'Responsable',
        targetName: taskItem.assignedTo || taskItem.title,
        targetEmployeeId: taskItem.employeeId,
        operationType: 'tache_projet',
        operationLabel: taskItem.isMilestone ? 'Création de Jalon' : 'Création de Tâche',
        details: `Tâche "${taskItem.title}" créée et assignée à ${taskItem.assignedTo || 'Équipe'} (Priorité: ${taskItem.priority})`,
        level: 'success',
        metadata: { assignedTo: taskItem.assignedTo, taskId: taskItem.id },
      });
    },
    successTitle: 'Tâche créée !',
    successMessage: `La tâche "${taskItem.title}" a été enregistrée avec succès.`,
  });
}

export async function deleteTaskWithSweetAlert(params: {
  id: string;
  tasks: Task[];
  onUpdateTasks: (updated: Task[]) => void;
  setSelectedTaskForDetail: (t: Task | null) => void;
}) {
  const { id, tasks, onUpdateTasks, setSelectedTaskForDetail } = params;
  const taskToDelete = tasks.find((t) => t.id === id);
  await executeDeleteWithSweetAlert({
    title: 'Supprimer la tâche ?',
    text: 'Voulez-vous vraiment supprimer définitivement cette tâche ?',
    itemName: taskToDelete?.title,
    action: async () => {
      await taskService.deleteTask(id);
      onUpdateTasks(tasks.filter((t) => t.id !== id));
      setSelectedTaskForDetail(null);
      if (taskToDelete) {
        logSystemAudit({
          targetName: taskToDelete.assignedTo || taskToDelete.title,
          targetEmployeeId: taskToDelete.employeeId,
          operationType: 'tache_projet',
          operationLabel: 'Suppression de Tâche',
          details: `Suppression définitive de la tâche "${taskToDelete.title}"`,
          level: 'warning',
          metadata: { assignedTo: taskToDelete.assignedTo, taskId: taskToDelete.id },
        });
      }
    },
    successTitle: 'Tâche supprimée !',
    successMessage: 'La tâche a été retirée avec succès.',
  });
}
