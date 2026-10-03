import { Injectable, signal, inject } from '@angular/core';
import { SettingsService } from '../../services/settings.service';

export interface MathProblem {
  problem: string; // e.g., "5 + 3"
  answer: number;
}

type SpeedMathGameState = 'ready' | 'playing' | 'finished';

@Injectable({ providedIn: 'root' })
export class SpeedMathStateService {
  private settingsService = inject(SettingsService);

  gameState = signal<SpeedMathGameState>('ready');
  currentProblem = signal<MathProblem | null>(null);
  userAnswer = signal('');
  score = signal(0);
  timeLeft = signal(this.settingsService.speedMathDuration());
  
  timerId: any;

  reset() {
    clearInterval(this.timerId);
    this.gameState.set('ready');
    this.currentProblem.set(null);
    this.userAnswer.set('');
    this.score.set(0);
    this.timeLeft.set(this.settingsService.speedMathDuration());
  }
}