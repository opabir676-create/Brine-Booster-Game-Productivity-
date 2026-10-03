import { Injectable, signal, effect, computed } from '@angular/core';

export type TaskPriority = 'high' | 'medium' | 'low';
export type StatusFilter = 'all' | 'active' | 'completed';
export type PriorityFilter = 'all' | TaskPriority;

export interface Task {
  id: number;
  text: string;
  completed: boolean;
  priority: TaskPriority;
  dueDate?: string; // YYYY-MM-DD
}

@Injectable({ providedIn: 'root' })
export class TodoService {
  private getItem<T>(key: string, defaultValue: T): T {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    }
    return defaultValue;
  }

  tasks = signal<Task[]>(this.getItem('bb_tasks', []));

  statusFilter = signal<StatusFilter>('all');
  priorityFilter = signal<PriorityFilter>('all');

  filteredTasks = computed(() => {
    const tasks = this.tasks();
    const status = this.statusFilter();
    const priority = this.priorityFilter();

    return tasks.filter(task => {
      const statusMatch = status === 'all' || (status === 'completed' && task.completed) || (status === 'active' && !task.completed);
      const priorityMatch = priority === 'all' || task.priority === priority;
      return statusMatch && priorityMatch;
    });
  });

  constructor() {
    effect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('bb_tasks', JSON.stringify(this.tasks()));
      }
    });
  }

  addTask(task: Omit<Task, 'id'>) {
    const newTask: Task = { ...task, id: Date.now() };
    this.tasks.update(tasks => [newTask, ...tasks]);
  }

  deleteTask(id: number) {
    this.tasks.update(tasks => tasks.filter(task => task.id !== id));
  }

  toggleCompletion(id: number) {
    this.tasks.update(tasks => 
      tasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }

  updateTask(updatedTask: Task) {
    this.tasks.update(tasks => 
      tasks.map(task => (task.id === updatedTask.id ? updatedTask : task))
    );
  }
}