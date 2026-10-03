import { Injectable, signal, inject } from '@angular/core';
import { SettingsService } from '../../services/settings.service';

export type ReactionState = 'setup' | 'waiting' | 'ready' | 'clicked' | 'tooSoon';

@Injectable({ providedIn: 'root' })
export class ReactionTimeStateService {
  private settingsService = inject(SettingsService);

  gameState = signal<ReactionState>('setup');
  round = signal(0);
  maxRounds = signal(this.settingsService.reactionTimeRounds());
  results = signal<number[]>([]);
  
  startTime = 0;
  timeoutId: any;

  reset() {
    clearTimeout(this.timeoutId);
    this.gameState.set('setup');
    this.round.set(0);
    this.results.set([]);
    this.startTime = 0;
  }
}