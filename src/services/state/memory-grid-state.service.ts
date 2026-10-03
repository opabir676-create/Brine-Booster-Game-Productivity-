import { Injectable, signal } from '@angular/core';

type TileState = 'idle' | 'active' | 'correct' | 'incorrect';
type GameState = 'setup' | 'watching' | 'playing' | 'gameover';

interface Tile {
  id: number;
  state: TileState;
}

@Injectable({ providedIn: 'root' })
export class MemoryGridStateService {
  gridSize = signal(3);
  tiles = signal<Tile[]>([]);
  sequence = signal<number[]>([]);
  playerSequence = signal<number[]>([]);
  gameState = signal<GameState>('setup');
  round = signal(1);
  reactionTimes: number[] = [];
  startTime = 0;
  
  totalClicks = signal(0);
  correctClicks = signal(0);
  
  reset() {
    this.gridSize.set(3);
    this.tiles.set([]);
    this.sequence.set([]);
    this.playerSequence.set([]);
    this.gameState.set('setup');
    this.round.set(1);
    this.reactionTimes = [];
    this.startTime = 0;
    this.totalClicks.set(0);
    this.correctClicks.set(0);
  }
}