import { Injectable, signal } from '@angular/core';

type TrailBlazerState = 'watching' | 'playing' | 'feedback';

export interface TrailCell {
    id: number;
    state: 'idle' | 'path' | 'correct' | 'incorrect';
}

@Injectable({ providedIn: 'root' })
export class TrailBlazerStateService {
    gameState = signal<TrailBlazerState>('watching');
    grid = signal<TrailCell[]>([]);
    path = signal<number[]>([]);
    userPath = signal<number[]>([]);
    
    round = signal(1);
    lives = signal(3);

    reset() {
        this.gameState.set('watching');
        this.grid.set([]);
        this.path.set([]);
        this.userPath.set([]);
        this.round.set(1);
        this.lives.set(3);
    }
}
