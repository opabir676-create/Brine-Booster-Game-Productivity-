import { Injectable, signal } from '@angular/core';

export interface SudokuCell {
    value: number | null;
    isOriginal: boolean;
    isInvalid: boolean;
}

type SudokuState = 'playing' | 'finished';

@Injectable({ providedIn: 'root' })
export class SudokuMiniStateService {
    gameState = signal<SudokuState>('playing');
    grid = signal<SudokuCell[]>([]);
    selectedCellIndex = signal<number | null>(null);
    mistakes = signal(0);
    
    timer = signal(0);
    timerId: any;

    reset() {
        clearInterval(this.timerId);
        this.gameState.set('playing');
        this.grid.set([]);
        this.selectedCellIndex.set(null);
        this.mistakes.set(0);
        this.timer.set(0);
    }
}
