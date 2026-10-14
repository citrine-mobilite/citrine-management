import { Task } from '../types';
import { COLLECTIONS, saveDocument, deleteDocument, subscribeToCollection } from './dataService';

const LOCAL_STORAGE_KEY = 'citrine_tasks';

export class TaskService {
  /**
   * Récupère toutes les tâches synchrones depuis le cache local
   */
  public getTasksSync(): Task[] {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  }

  /**
   * Enregistre ou met à jour une tâche en base de données Supabase / CloudSQL et en local (Action isolée CRUD)
   */
  public async saveTask(task: Task): Promise<Task> {
    try {
      await saveDocument(COLLECTIONS.TASKS, task);
    } catch (err) {
      console.warn('Erreur lors de la sauvegarde de la tâche en base, cache local actif:', err);
    }

    try {
      const tasks = this.getTasksSync();
      const idx = tasks.findIndex((t) => t.id === task.id);
      let updated: Task[];
      if (idx >= 0) {
        updated = tasks.map((t) => (t.id === task.id ? task : t));
      } else {
        updated = [task, ...tasks];
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

      // Diffusion multi-onglets
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bcast = new BroadcastChannel('citrine_cross_tab_sync');
          bcast.postMessage({ type: 'SYNC_TASKS', tasks: updated });
          bcast.close();
        } catch {}
      }
    } catch (e) {
      console.warn('Erreur localStorage lors de l\'enregistrement de la tâche:', e);
    }

    return task;
  }

  /**
   * Supprime une tâche par son ID en base de données et en local (Action isolée CRUD)
   */
  public async deleteTask(taskId: string): Promise<boolean> {
    try {
      await deleteDocument(COLLECTIONS.TASKS, taskId);
    } catch (err) {
      console.warn('Erreur lors de la suppression de la tâche en base:', err);
    }

    try {
      const tasks = this.getTasksSync();
      const updated = tasks.filter((t) => t.id !== taskId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bcast = new BroadcastChannel('citrine_cross_tab_sync');
          bcast.postMessage({ type: 'SYNC_TASKS', tasks: updated });
          bcast.close();
        } catch {}
      }
    } catch (e) {
      console.warn('Erreur lors de la suppression de la tâche en local:', e);
    }

    return true;
  }

  /**
   * S'abonne aux modifications temps réel des tâches (Database truth is authoritative, even if empty [])
   */
  public subscribeToTasks(callback: (tasks: Task[]) => void) {
    return subscribeToCollection<Task>(COLLECTIONS.TASKS, (data) => {
      const list = data || [];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
      callback(list);
    });
  }
}

export const taskService = new TaskService();
