import { Component, ChangeDetectionStrategy, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface JournalEntry {
  date: string; // YYYY-MM-DD
  content: string;
}

@Component({
  selector: 'app-daily-journal',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './daily-journal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyJournalComponent implements OnInit {
  entries = signal<JournalEntry[]>([]);
  currentEntryContent = signal('');
  isEditingToday = signal(true);
  
  todayString = new Date().toISOString().split('T')[0];

  ngOnInit() {
    this.loadEntries();
    const todayEntry = this.entries().find(e => e.date === this.todayString);
    if (todayEntry) {
      this.currentEntryContent.set(todayEntry.content);
    }
  }

  handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.currentEntryContent.set(target.value);
  }

  private loadEntries() {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('bb_journalEntries');
      if (stored) {
        this.entries.set(JSON.parse(stored));
      }
    }
  }

  saveEntry() {
    this.entries.update(entries => {
      const existingIndex = entries.findIndex(e => e.date === this.todayString);
      if (existingIndex > -1) {
        // Update today's entry
        entries[existingIndex] = { date: this.todayString, content: this.currentEntryContent() };
        return [...entries];
      } else {
        // Add new entry for today
        return [{ date: this.todayString, content: this.currentEntryContent() }, ...entries];
      }
    });
    
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('bb_journalEntries', JSON.stringify(this.entries()));
    }
    this.isEditingToday.set(false);
  }

  startEditing() {
    this.isEditingToday.set(true);
  }
}