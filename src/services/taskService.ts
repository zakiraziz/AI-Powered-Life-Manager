import type { Task } from '../types';
import { dbHelpers } from './firebaseService';

class TaskService {
  private readonly COLLECTION_NAME = 'tasks';

  async getTasks(): Promise<Task[]> {
    try {
      // Try Firebase first
      const userId = this.getCurrentUserId();
      if (userId) {
        return await dbHelpers.getCollection<Task>(this.COLLECTION_NAME, {
          where: [['userId', '==', userId]],
          orderBy: [['createdAt', 'desc'] as [string, 'asc' | 'desc']],
        });
      }
    } catch (error) {
      console.warn('Firebase getTasks failed, falling back to local storage:', error);
    }
    
    // Fallback to local storage
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : [];
  }

  async getTask(id: string): Promise<Task | null> {
    try {
      return await dbHelpers.getDocument<Task>(this.COLLECTION_NAME, id);
    } catch (error) {
      console.warn('Firebase getTask failed, falling back to local storage');
      const saved = localStorage.getItem('tasks');
      const tasks: Task[] = saved ? JSON.parse(saved) : [];
      return tasks.find(t => t.id === id) || null;
    }
  }

  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const task: Task = {
      ...taskData,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await dbHelpers.setDocument(this.COLLECTION_NAME, task.id, task as unknown as Record<string, unknown>);
    } catch (error) {
      console.warn('Firebase createTask failed, saving to local storage');
      const saved = localStorage.getItem('tasks');
      const tasks: Task[] = saved ? JSON.parse(saved) : [];
      tasks.push(task);
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    return task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const existingTask = await this.getTask(id);
    if (!existingTask) {
      throw new Error('Task not found');
    }

    const updatedTask: Task = {
      ...existingTask,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    try {
      await dbHelpers.updateDocument(this.COLLECTION_NAME, id, updatedTask as unknown as Record<string, unknown>);
    } catch (error) {
      console.warn('Firebase updateTask failed, updating local storage');
      const saved = localStorage.getItem('tasks');
      const tasks: Task[] = saved ? JSON.parse(saved) : [];
      const index = tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        tasks[index] = updatedTask;
        localStorage.setItem('tasks', JSON.stringify(tasks));
      }
    }

    return updatedTask;
  }

  async deleteTask(id: string): Promise<void> {
    try {
      await dbHelpers.deleteDocument(this.COLLECTION_NAME, id);
    } catch (error) {
      console.warn('Firebase deleteTask failed, deleting from local storage');
      const saved = localStorage.getItem('tasks');
      const tasks: Task[] = saved ? JSON.parse(saved) : [];
      const filtered = tasks.filter(t => t.id !== id);
      localStorage.setItem('tasks', JSON.stringify(filtered));
    }
  }

  async syncTasks(): Promise<void> {
    const saved = localStorage.getItem('tasks');
    const tasks: Task[] = saved ? JSON.parse(saved) : [];
    
    for (const task of tasks) {
      try {
        await dbHelpers.setDocument(this.COLLECTION_NAME, task.id, task as unknown as Record<string, unknown>);
      } catch (error) {
        console.error('Failed to sync task:', task.id, error);
      }
    }
  }

  private getCurrentUserId(): string | null {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.id || null;
    }
    return null;
  }
}

export const taskService = new TaskService();
