import { Injectable, signal } from '@angular/core';

export type Peg = 'correct' | 'present' | 'absent';

export interface Guess {
  colors: (string | null)[];
  feedback: Peg[];
}

type CodeBreakerGameState = 'playing' | 'won' | 'lost';

@Injectable({ providedIn: 'root' })
export class CodeBreakerStateService {
  gameState = signal<CodeBreakerGameState>('playing');
  secretCode = signal<string[]>([]);
  guesses = signal<Guess[]>([]);
  activeRow = signal(0);
  maxGuesses = signal(10);
  codeLength = signal(4);
  availableColors = signal<string[]>([]);
  
  // For animation
  revealFeedback = signal(false);

  reset() {
    this.gameState.set('playing');
    this.secretCode.set([]);
    this.guesses.set([]);
    this.activeRow.set(0);
    this.maxGuesses.set(10);
    this.codeLength.set(4);
    this.availableColors.set([]);
    this.revealFeedback.set(false);
  }
}