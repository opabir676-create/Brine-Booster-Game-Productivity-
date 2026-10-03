import { Injectable, signal } from '@angular/core';

export interface OddOneOutItem {
    id: number;
    icon: string;
    transform: string;
    isOdd: boolean;
}

type OddOneOutState = 'playing' | 'finished';

@Injectable({ providedIn: 'root' })
export class OddOneOutStateService {
    gameState = signal<OddOneOutState>('playing');
    items = signal<OddOneOutItem[]>([]);
    
    score = signal(0);
    timeLeft = signal(60);
    timerId: any;
    
    streak = signal(0);

    reset() {
        clearInterval(this.timerId);
        this.gameState.set('playing');
        this.items.set([]);
        this.score.set(0);
        this.timeLeft.set(60);
        this.streak.set(0);
    }
}
