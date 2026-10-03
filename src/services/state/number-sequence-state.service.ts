import { Injectable, signal } from '@angular/core';

export interface SequenceProblem {
  sequence: (number | string)[]; // e.g., [2, 4, '?', 8]
  answer: number;
}

type SequenceGameState = 'setup' | 'playing' | 'feedback';

@Injectable({ providedIn: 'root' })
export class NumberSequenceStateService {
    gameState = signal<SequenceGameState>('setup');
    currentProblem = signal<SequenceProblem | null>(null);
    userAnswer = signal('');
    feedback = signal<'correct' | 'incorrect' | ''>('');
    
    round = signal(1);
    score = signal(0);
    lives = signal(3);

    reset() {
        this.gameState.set('setup');
        this.currentProblem.set(null);
        this.userAnswer.set('');
        this.feedback.set('');
        this.round.set(1);
        this.score.set(0);
        this.lives.set(3);
    }
}
