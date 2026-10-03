import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

type ToolCategory = 'All' | 'Focus' | 'Planning' | 'Creativity' | 'AI' | 'Utility';

interface ProductiveTool {
  id: string;
  name: string;
  icon: string;
  description: string;
  isImplemented: boolean;
  isOnline: boolean;
  category: 'Focus' | 'Planning' | 'Creativity' | 'AI' | 'Utility';
}

@Component({
  selector: 'app-productive-list',
  templateUrl: './productive-list.component.html',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductiveListComponent {
  searchQuery = signal('');
  selectedCategory = signal<ToolCategory>('All');

  categories: ToolCategory[] = ['All', 'Focus', 'Planning', 'Creativity', 'Utility', 'AI'];
  
  tools: ProductiveTool[] = [
    { id: 'pomodoro-timer', name: 'Pomodoro Timer', icon: '🍅', description: 'Stay focused with timed work sessions.', isImplemented: true, isOnline: false, category: 'Focus' },
    { id: 'noise-generator', name: 'Noise Generator', icon: '🎧', description: 'Play ambient sounds to improve focus.', isImplemented: true, isOnline: false, category: 'Focus' },
    { id: 'breathing-exercise', name: 'Breathing Exercise', icon: '🧘', description: 'A simple guide to calm your mind and re-center.', isImplemented: true, isOnline: false, category: 'Focus' },
    { id: 'habit-tracker', name: 'Habit Tracker', icon: '📈', description: 'Build good habits, break bad ones.', isImplemented: true, isOnline: false, category: 'Planning' },
    { id: 'todo-list', name: 'To-Do List', icon: '✅', description: 'Organize your tasks with priorities and due dates.', isImplemented: true, isOnline: false, category: 'Planning' },
    { id: 'daily-journal', name: 'Daily Journal', icon: '📔', description: 'Reflect on your day and clear your mind.', isImplemented: true, isOnline: false, category: 'Planning' },
    { id: 'quick-notes', name: 'Quick Notes', icon: '📝', description: 'Digital sticky notes for your ideas.', isImplemented: true, isOnline: false, category: 'Planning' },
    { id: 'personal-crm', name: 'Personal CRM', icon: '👥', description: 'Keep track of important personal contacts.', isImplemented: true, isOnline: false, category: 'Planning' },
    { id: 'brain-dump', name: 'Brain Dump', icon: '💨', description: 'A distraction-free space to offload your thoughts.', isImplemented: true, isOnline: false, category: 'Creativity' },
    { id: 'decision-spinner', name: 'Decision Spinner', icon: '🎡', description: 'Let fate decide with a customizable wheel.', isImplemented: true, isOnline: false, category: 'Creativity' },
    { id: 'password-generator', name: 'Password Generator', icon: '🔐', description: 'Create strong, secure passwords for your accounts.', isImplemented: true, isOnline: false, category: 'Utility' },
    { id: 'unit-converter', name: 'Unit Converter', icon: '📏', description: 'Quickly convert between common units of measurement.', isImplemented: true, isOnline: false, category: 'Utility' },
    { id: 'bill-splitter', name: 'Bill Splitter', icon: '💸', description: 'Easily divide bills and tips with friends.', isImplemented: true, isOnline: false, category: 'Utility' },
    { id: 'ai-idea-generator', name: 'AI Idea Generator', icon: '💡', description: 'Get creative ideas from AI for any topic.', isImplemented: true, isOnline: true, category: 'AI' },
    { id: 'ai-goal-setter', name: 'AI Goal Setter', icon: '🌱', description: 'Break down large goals into actionable steps with AI.', isImplemented: true, isOnline: true, category: 'AI' },
    { id: 'ai-meeting-summarizer', name: 'AI Meeting Summarizer', icon: '📋', description: 'Summarize meeting notes to extract key decisions and actions.', isImplemented: true, isOnline: true, category: 'AI' },
  ];

  filteredTools = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();

    return this.tools.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(query) || tool.description.toLowerCase().includes(query);
      if (!matchesSearch) return false;

      if (category === 'All') {
        return true;
      }
      
      if (category === 'AI') {
        return tool.isOnline;
      }

      return tool.category === category;
    });
  });

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  selectCategory(category: ToolCategory) {
    this.selectedCategory.set(category);
  }
}