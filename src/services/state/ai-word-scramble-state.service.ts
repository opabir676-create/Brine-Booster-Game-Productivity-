import { Injectable, signal } from '@angular/core';

export interface ScrambledWord {
    word: string;
    scrambled: string;
    hint: string;
}

export type AIWordScrambleState = 'setup' | 'loading' | 'playing' | 'feedback' | 'error';

@Injectable({ providedIn: 'root' })
export class AiWordScrambleStateService {
    gameState = signal<AIWordScrambleState>('setup');
    wordSet = signal<ScrambledWord[]>([]);
    userGuess = signal('');
    feedback = signal<'correct' | 'incorrect' | ''>('');
    
    round = signal(1);
    score = signal(0);
    timeLeft = signal(20);
    lives = signal(3);
    
    timerId: any;
    isHintVisible = signal(false);

    reset() {
        clearInterval(this.timerId);
        this.gameState.set('setup');
        this.wordSet.set([]);
        this.userGuess.set('');
        this.feedback.set('');
        this.round.set(1);
        this.score.set(0);
        this.timeLeft.set(20);
        this.lives.set(3);
        this.isHintVisible.set(false);
    }
}
