import { Injectable, signal } from '@angular/core';

interface MovingObject {
  id: number;
  x: number;
  y: number;
  isTarget: boolean;
}

type FocusState = 'setup' | 'prepare' | 'watching' | 'selecting' | 'feedback';

@Injectable({ providedIn: 'root' })
export class FocusFlowStateService {
  gameState = signal<FocusState>('setup');
  objects = signal<MovingObject[]>([]);
  feedback = signal<'correct' | 'incorrect' | ''>('');
  selectedId = signal<number | null>(null);
  round = signal(1);
  score = signal(0);
  lives = signal(3);

  reset() {
    this.gameState.set('setup');
    this.objects.set([]);
    this.feedback.set('');
    this.selectedId.set(null);
    this.round.set(1);
    this.score.set(0);
    this.lives.set(3);
  }
}