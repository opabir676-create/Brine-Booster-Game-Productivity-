import { Injectable, signal, effect, inject } from '@angular/core';
import { SettingsService } from '../../services/settings.service';

export type TimerMode = 'work' | 'shortBreak' | 'longBreak';

@Injectable({ providedIn: 'root' })
export class PomodoroTimerStateService {
  private settingsService = inject(SettingsService);

  private getItem<T>(key: string, defaultValue: T): T {
    if (typeof window !== 'undefined') {
      const storedValue = window.localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    }
    return defaultValue;
  }
  
  mode = signal<TimerMode>(this.getItem('bb_pomodoro_mode', 'work'));
  isActive = signal<boolean>(this.getItem('bb_pomodoro_isActive', false));
  timeLeft = signal<number>(this.getItem('bb_pomodoro_timeLeft', this.settingsService.pomodoroWorkMinutes() * 60));
  initialTime = signal<number>(this.getItem('bb_pomodoro_initialTime', this.settingsService.pomodoroWorkMinutes() * 60));
  lastTickTimestamp = signal<number>(this.getItem('bb_pomodoro_lastTick', Date.now()));

  constructor() {
    effect(() => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('bb_pomodoro_mode', JSON.stringify(this.mode()));
        window.localStorage.setItem('bb_pomodoro_isActive', JSON.stringify(this.isActive()));
        window.localStorage.setItem('bb_pomodoro_timeLeft', JSON.stringify(this.timeLeft()));
        window.localStorage.setItem('bb_pomodoro_initialTime', JSON.stringify(this.initialTime()));
        window.localStorage.setItem('bb_pomodoro_lastTick', JSON.stringify(this.lastTickTimestamp()));
      }
    });
  }
}