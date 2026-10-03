import { Injectable, signal } from '@angular/core';

type SpatialSpinState = 'playing' | 'feedback';

export interface ShapeOption {
  id: number;
  path: string;
  transform: string;
  isCorrect: boolean;
}

@Injectable({ providedIn: 'root' })
export class SpatialSpinStateService {
    gameState = signal<SpatialSpinState>('playing');
    targetShapePath = signal('');
    options = signal<ShapeOption[]>([]);
    feedback = signal<'correct' | 'incorrect' | ''>('');
    selectedOptionId = signal<number | null>(null);
    
    round = signal(1);
    score = signal(0);
    lives = signal(3);

    reset() {
        this.gameState.set('playing');
        this.targetShapePath.set('');
        this.options.set([]);
        this.feedback.set('');
        this.selectedOptionId.set(null);
        this.round.set(1);
        this.score.set(0);
        this.lives.set(3);
    }
}
