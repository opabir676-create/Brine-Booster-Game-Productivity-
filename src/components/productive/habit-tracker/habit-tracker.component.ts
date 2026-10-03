import { Component, ChangeDetectionStrategy, signal, OnInit, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProgressService } from '../../../services/progress.service';

interface Habit {
  id: number;
  name: string;
  completed: { [date: string]: boolean }; // date as 'YYYY-MM-DD'
}

type UndoAction = {
    action: 'delete';
    data: { habit: Habit };
} | {
    action: 'toggle';
    data: { habitId: number; date: Date; wasCompleted: boolean };
};

@Component({
  selector: 'app-habit-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './habit-tracker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HabitTrackerComponent implements OnInit, OnDestroy {
  progressService = inject(ProgressService);
  habits = signal<Habit[]>([]);
  weekDates = signal<Date[]>([]);
  newHabitName = signal('');
  
  bonusClaimedToday = signal(this.isBonusClaimedForDate(this.getTodayString()));
  
  undoState = signal<UndoAction | null>(null);
  private undoTimeout: any;
  
  allHabitsCompletedToday = computed(() => {
    if (this.habits().length === 0) return false;
    const todayStr = this.getTodayString();
    return this.habits().every(habit => !!habit.completed[todayStr]);
  });

  ngOnInit() {
    this.loadHabits();
    this.generateWeekDates();
  }
  
  ngOnDestroy() {
    clearTimeout(this.undoTimeout);
  }

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }
  
  private isBonusClaimedForDate(dateStr: string): boolean {
     if (typeof window === 'undefined') return false;
     const claimedDate = window.localStorage.getItem('bb_habitBonusClaimed');
     return claimedDate === dateStr;
  }

  private loadHabits() {
    if (typeof window === 'undefined') return;
    const storedHabits = window.localStorage.getItem('bb_habits');
    if (storedHabits) {
      this.habits.set(JSON.parse(storedHabits));
    } else {
      // Some default habits
      this.habits.set([
        { id: 1, name: 'Read for 15 mins', completed: {} },
        { id: 2, name: 'Exercise', completed: {} },
        { id: 3, name: 'Meditate', completed: {} },
      ]);
    }
  }

  private saveHabits() {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('bb_habits', JSON.stringify(this.habits()));
  }

  private generateWeekDates() {
    const today = new Date();
    const currentDay = today.getDay(); // Sunday - 0, Monday - 1
    const weekStart = new Date(today);
    // Adjust to start of the week (Monday)
    const dayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    weekStart.setDate(today.getDate() + dayOffset);

    const dates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        dates.push(date);
    }
    this.weekDates.set(dates);
  }

  addHabit() {
    if (!this.newHabitName().trim()) return;
    this.habits.update(habits => [
      ...habits,
      {
        id: Date.now(),
        name: this.newHabitName().trim(),
        completed: {},
      },
    ]);
    this.newHabitName.set('');
    this.saveHabits();
    this.clearUndo();
  }
  
  deleteHabit(habitId: number) {
     const habitToDelete = this.habits().find(h => h.id === habitId);
     if (habitToDelete) {
        this.setUndoState({ action: 'delete', data: { habit: habitToDelete }});
        this.habits.update(habits => habits.filter(h => h.id !== habitId));
        this.saveHabits();
     }
  }

  toggleCompletion(habitId: number, date: Date) {
    const dateString = this.formatDate(date);
    const habit = this.habits().find(h => h.id === habitId);
    if (!habit) return;

    const wasCompleted = !!habit.completed[dateString];
    this.setUndoState({ action: 'toggle', data: { habitId, date, wasCompleted } });

    this.habits.update(habits => {
      const newHabits = habits.map(h => {
        if (h.id === habitId) {
          const newCompleted = { ...h.completed };
          newCompleted[dateString] = !newCompleted[dateString];
          return { ...h, completed: newCompleted };
        }
        return h;
      });
      return newHabits;
    });
    this.saveHabits();
  }
  
  claimBonus() {
    if (this.allHabitsCompletedToday() && !this.bonusClaimedToday()) {
        this.progressService.addHabitStreakReward();
        this.bonusClaimedToday.set(true);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('bb_habitBonusClaimed', this.getTodayString());
        }
    }
  }

  isCompleted(habit: Habit, date: Date): boolean {
    return !!habit.completed[this.formatDate(date)];
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
  }

  isToday(date: Date): boolean {
    return this.formatDate(new Date()) === this.formatDate(date);
  }

  // --- Undo Logic ---
  private setUndoState(state: UndoAction) {
    this.undoState.set(state);
    clearTimeout(this.undoTimeout);
    this.undoTimeout = setTimeout(() => this.undoState.set(null), 5000);
  }

  private clearUndo() {
    this.undoState.set(null);
    clearTimeout(this.undoTimeout);
  }

  undoLastAction() {
    const state = this.undoState();
    if (!state) return;

    if (state.action === 'delete') {
      this.habits.update(h => [...h, state.data.habit].sort((a, b) => a.id - b.id));
    } else if (state.action === 'toggle') {
      const { habitId, date, wasCompleted } = state.data;
      const dateString = this.formatDate(date);
      this.habits.update(habits => {
        return habits.map(habit => {
          if (habit.id === habitId) {
            const newCompleted = { ...habit.completed };
            newCompleted[dateString] = wasCompleted; // Revert to original state
            return { ...habit, completed: newCompleted };
          }
          return habit;
        });
      });
    }

    this.saveHabits();
    this.clearUndo();
  }
}