import { Task } from '../types';
import { COLLECTIONS, saveDocument, deleteDocument, subscribeToCollection } from './dataService';

export class TaskService {
  public getTasksSync(): Task[] {
    return [];
  }

  public async saveTask(task: Task): Promise<Task> {
    await saveDocument(COLLECTIONS.TASKS, task);
    return task;
  }

  public async deleteTask(taskId: string): Promise<boolean> {
    await deleteDocument(COLLECTIONS.TASKS, taskId);
    return true;
  }

  public subscribeToTasks(callback: (tasks: Task[]) => void) {
    return subscribeToCollection<Task>(COLLECTIONS.TASKS, (data) => {
      callback(data || []);
    });
  }
}

export const taskService = new TaskService();
