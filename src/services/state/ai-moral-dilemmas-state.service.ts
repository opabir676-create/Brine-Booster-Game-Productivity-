import { Injectable, signal } from '@angular/core';

export type AIMoralDilemmasState = 'setup' | 'loading' | 'playing' | 'feedback' | 'finished' | 'error';

export interface Dilemma {
    dilemma: string;
    options: string[];
}

@Injectable({ providedIn: 'root' })
export class AIMoralDilemmasStateService {
    gameState = signal<AIMoralDilemmasState>('setup');
    
    dilemmas = signal<Dilemma[]>([]);
    currentDilemmaIndex = signal(0);
    feedbackText = signal<string | null>(null);

    score = signal(0);

    reset() {
        this.gameState.set('setup');
        this.dilemmas.set([]);
        this.currentDilemmaIndex.set(0);
        this.feedbackText.set(null);
        this.score.set(0);
    }
}