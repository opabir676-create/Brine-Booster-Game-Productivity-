import { Injectable, signal } from '@angular/core';

export interface LadderPuzzle {
    start: string;
    end: string;
    path: (string | null)[]; // null represents a blank for the user to fill
    solution: string[];
}

type WordLadderState = 'playing' | 'finished';

@Injectable({ providedIn: 'root' })
export class WordLadderStateService {
    gameState = signal<WordLadderState>('playing');
    puzzles = signal<LadderPuzzle[]>([]);
    currentPuzzleIndex = signal(0);
    userGuesses = signal<{ [key: number]: string }>({}); // { rungIndex: guess }
    
    score = signal(0);
    timer = signal(0);
    timerId: any;

    reset() {
        clearInterval(this.timerId);
        this.gameState.set('playing');
        this.puzzles.set([]);
        this.currentPuzzleIndex.set(0);
        this.userGuesses.set({});
        this.score.set(0);
        this.timer.set(0);
    }
}
