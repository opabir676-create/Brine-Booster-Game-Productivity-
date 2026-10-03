import { Injectable, signal } from '@angular/core';

export type AISpotTheDifferenceState = 'setup' | 'loading' | 'playing' | 'finished' | 'error';
export type Click = { x: number; y: number };

@Injectable({ providedIn: 'root' })
export class AISpotTheDifferenceStateService {
    gameState = signal<AISpotTheDifferenceState>('setup');
    
    image1 = signal<string | null>(null);
    image2 = signal<string | null>(null);
    differences = signal<string[]>([]);
    
    userClicks = signal<Click[]>([]);
    
    reset() {
        this.gameState.set('setup');
        this.image1.set(null);
        this.image2.set(null);
        this.differences.set([]);
        this.userClicks.set([]);
    }
}