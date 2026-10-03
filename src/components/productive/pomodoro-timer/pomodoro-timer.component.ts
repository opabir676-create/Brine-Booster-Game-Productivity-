import { Component, ChangeDetectionStrategy, signal, computed, OnDestroy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../../../services/settings.service';
import { SoundService } from '../../../services/sound.service';
import { ProgressService } from '../../../services/progress.service';
import { PomodoroTimerStateService, TimerMode } from '../../../services/state/pomodoro-timer-state.service';

@Component({
  selector: 'app-pomodoro-timer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pomodoro-timer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PomodoroTimerComponent implements OnInit, OnDestroy {
  settingsService = inject(SettingsService);
  soundService = inject(SoundService);
  progressService = inject(ProgressService);
  state = inject(PomodoroTimerStateService);

  // Expose state signals
  mode = this.state.mode;
  timeLeft = this.state.timeLeft;
  initialTime = this.state.initialTime;
  isActive = this.state.isActive;
  
  private timerId: any;
  
  progress = computed(() => {
    if (this.initialTime() === 0) return 100;
    return 100 - (this.timeLeft() / this.initialTime()) * 100;
  });

  minutes = computed(() => Math.floor(this.timeLeft() / 60).toString().padStart(2, '0'));
  seconds = computed(() => (this.timeLeft() % 60).toString().padStart(2, '0'));
  
  constructor() {}

  ngOnInit() {
    if (this.isActive()) {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - this.state.lastTickTimestamp()) / 1000);
      const newTimeLeft = this.timeLeft() - elapsedSeconds;
      
      if (newTimeLeft <= 0) {
        this.timeLeft.set(0);
        this.handleTimerEnd(true); // Handle offline completion
      } else {
        this.timeLeft.set(newTimeLeft);
        this.startInterval();
      }
    } else {
      this.resetTimer(false);
    }
  }

  ngOnDestroy() {
    clearInterval(this.timerId);
  }

  setMode(newMode: TimerMode) {
    this.soundService.playClick();
    this.mode.set(newMode);
    this.resetTimer(false); // Don't play sound on mode change reset
  }

  startPauseTimer() {
    this.soundService.playClick();
    this.isActive.update(active => !active);
    if (this.isActive()) {
      this.state.lastTickTimestamp.set(Date.now());
      this.startInterval();
    } else {
      clearInterval(this.timerId);
    }
  }
  
  startInterval() {
      clearInterval(this.timerId);
      this.timerId = setInterval(() => {
        this.timeLeft.update(t => {
          if (t > 0) {
            this.state.lastTickTimestamp.set(Date.now());
            return t - 1;
          }
          this.handleTimerEnd();
          return 0;
        });
      }, 1000);
  }

  resetTimer(playSound = true) {
    if(playSound) this.soundService.playClick();
    this.isActive.set(false);
    clearInterval(this.timerId);
    let newTime = 25 * 60;
    switch (this.mode()) {
      case 'work':
        newTime = this.settingsService.pomodoroWorkMinutes() * 60;
        break;
      case 'shortBreak':
        newTime = this.settingsService.pomodoroShortBreakMinutes() * 60;
        break;
      case 'longBreak':
        newTime = this.settingsService.pomodoroLongBreakMinutes() * 60;
        break;
    }
    this.initialTime.set(newTime);
    this.timeLeft.set(newTime);
  }

  private handleTimerEnd(wasOffline = false) {
    if (!wasOffline) this.soundService.playNotify();
    
    this.isActive.set(false);
    clearInterval(this.timerId);

    if (this.mode() === 'work') {
      this.progressService.addPomodoroReward();
    }
    
    if(this.mode() === 'work') {
        this.setMode('shortBreak');
    } else {
        this.setMode('work');
    }
  }
}