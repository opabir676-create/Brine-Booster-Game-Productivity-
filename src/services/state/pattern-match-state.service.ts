import { Injectable, signal } from '@angular/core';

export interface Pattern {
    cells: string[]; // Array of colors
}

export interface GridItem {
    id: number;
    pattern: Pattern;
    isTarget: boolean;
}

type PatternMatchState = 'setup' | 'playing' | 'feedback';

@Injectable({ providedIn: 'root' })
export class PatternMatchStateService {
    gameState = signal<PatternMatchState>('setup');
    grid = signal<GridItem[]>([]);
    targetPattern = signal<Pattern | null>(null);
    feedback = signal<'correct' | 'incorrect' | ''>('');
    
    round = signal(1);
    score = signal(0);
    timeLeft = signal(10);
    lives = signal(3);
    
    timerId: any;
    responseTimes: number[] = [];
    roundStartTime = 0;
    correctClicks = signal(0);
    totalClicks = signal(0);

    reset() {
        clearInterval(this.timerId);
        this.gameState.set('setup');
        this.grid.set([]);
        this.targetPattern.set(null);
        this.feedback.set('');
        this.round.set(1);
        this.score.set(0);
        this.timeLeft.set(10);
        this.lives.set(3);
        this.responseTimes = [];
        this.roundStartTime = 0;
        this.correctClicks.set(0);
        this.totalClicks.set(0);
    }
}