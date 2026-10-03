import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TodoService, Task, TaskPriority, StatusFilter, PriorityFilter } from '../../../services/todo.service';
import { SoundService } from '../../../services/sound.service';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './todo-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoListComponent {
  todoService = inject(TodoService);
  soundService = inject(SoundService);

  newTaskText = signal('');
  
  statusFilters: { key: StatusFilter, label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
  ];

  priorityFilters: { key: PriorityFilter, label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'high', label: 'High' },
    { key: 'medium', label: 'Medium' },
    { key: 'low', label: 'Low' },
  ];
  
  parseAndAddTask() {
    let text = this.newTaskText().trim();
    if (!text) return;

    let priority: TaskPriority = 'medium';
    let dueDate: string | undefined = undefined;

    // Priority check
    const priorityRegex = /(high|medium|low)\s+priority/i;
    const priorityMatch = text.match(priorityRegex);
    if (priorityMatch) {
      priority = priorityMatch[1].toLowerCase() as TaskPriority;
      text = text.replace(priorityRegex, '').trim();
    }

    // Due date check
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (/\btoday\b/i.test(text)) {
      dueDate = today.toISOString().split('T')[0];
      text = text.replace(/\btoday\b/i, '').trim();
    } else if (/\btomorrow\b/i.test(text)) {
      dueDate = tomorrow.toISOString().split('T')[0];
      text = text.replace(/\btomorrow\b/i, '').trim();
    }

    text = text.replace(/\s\s+/g, ' ').trim();

    this.todoService.addTask({
      text,
      completed: false,
      priority,
      dueDate,
    });
    
    this.soundService.playSuccess();
    this.newTaskText.set('');
  }
  
  toggleTask(id: number) {
      this.soundService.playClick();
      this.todoService.toggleCompletion(id);
  }

  deleteTask(id: number) {
      this.soundService.playFailure();
      this.todoService.deleteTask(id);
  }

  isPastDue(dateString?: string): boolean {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day
    const dueDate = new Date(dateString);
    return dueDate < today;
  }
  
  trackById(index: number, item: Task): number {
    return item.id;
  }
}