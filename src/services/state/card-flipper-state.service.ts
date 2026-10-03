import { Injectable, signal } from '@angular/core';

export type CardState = 'down' | 'up' | 'matched';

export interface Card {
  id: number;
  symbol: string;
  state: CardState;
}

@Injectable({ providedIn: 'root' })
export class CardFlipperStateService {
  cards = signal<Card[]>([]);
  flippedCards = signal<Card[]>([]);
  moves = signal(0);
  timer = signal(0);
  timerId: any;
  isGameActive = signal(false);

  // For animation state
  justMatchedIds = signal<number[]>([]);
  noMatchIds = signal<number[]>([]);

  reset() {
    clearInterval(this.timerId);
    this.cards.set([]);
    this.flippedCards.set([]);
    this.moves.set(0);
    this.timer.set(0);
    this.isGameActive.set(false);
    this.justMatchedIds.set([]);
    this.noMatchIds.set([]);
  }
}