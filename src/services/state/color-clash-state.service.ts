import { Injectable, signal } from '@angular/core';

export interface ColorWord {
    word: string; // "RED"
    colorHex: string; // "#0000FF" (blue)
}

type ColorClashState = 'playing' | 'finished';

@Injectable({ providedIn: 'root' })
export class ColorClashStateService {
    gameState = signal<ColorClashState>('playing');
    currentColorWord = signal<ColorWord | null>(null);
    score = signal(0);
    timeLeft = signal(60);
    timerId: any;
    
    correctAnswers = signal(0);
    incorrectAnswers = signal(0);
    
    reset() {
        clearInterval(this.timerId);
        this.gameState.set('playing');
        this.currentColorWord.set(null);
        this.score.set(0);
        this.timeLeft.set(60);
        this.correctAnswers.set(0);
        this.incorrectAnswers.set(0);
    }
}
