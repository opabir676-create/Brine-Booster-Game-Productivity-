import { Component, ChangeDetectionStrategy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Note {
  id: number;
  content: string;
  color: string;
}

@Component({
  selector: 'app-quick-notes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './quick-notes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickNotesComponent {
  notes = signal<Note[]>([]);
  private colors = ['#fde047', '#a78bfa', '#6ee7b7', '#fca5a5', '#93c5fd'];

  constructor() {
    this.loadNotes();
    effect(() => {
      this.saveNotes();
    });
  }

  private loadNotes() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bb_quickNotes');
      if (stored) {
        this.notes.set(JSON.parse(stored));
      } else {
        this.notes.set([
          {id: Date.now(), content: 'This is a quick note!', color: this.getRandomColor() }
        ]);
      }
    }
  }

  private saveNotes() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bb_quickNotes', JSON.stringify(this.notes()));
    }
  }

  private getRandomColor(): string {
    return this.colors[Math.floor(Math.random() * this.colors.length)];
  }

  addNote() {
    this.notes.update(notes => [
      { id: Date.now(), content: '', color: this.getRandomColor() },
      ...notes
    ]);
  }

  deleteNote(id: number) {
    this.notes.update(notes => notes.filter(n => n.id !== id));
  }

  updateNote(id: number, event: Event) {
    const content = (event.target as HTMLTextAreaElement).value;
    this.notes.update(notes => 
      notes.map(n => n.id === id ? { ...n, content } : n)
    );
  }
  
  trackById(index: number, item: Note): number {
    return item.id;
  }
}