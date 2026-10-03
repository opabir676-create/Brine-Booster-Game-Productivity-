import { Component, ChangeDetectionStrategy, input, output, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Difficulty, CardFlipperReport } from '../games.types';
import { SoundService } from '../../../services/sound.service';
import { CardFlipperStateService, Card } from '../../../services/state/card-flipper-state.service';
import { SettingsService } from '../../../services/settings.service';

const SYMBOLS = ['🌟', '🧠', '🚀', '💡', '🧩', '🎯', '🔥', '⚛️', '🧬', '⚡️'];

@Component({
  selector: 'app-card-flipper',
  templateUrl: './card-flipper.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardFlipperComponent implements OnInit, OnDestroy {
  difficulty = input.required<Difficulty>();
  gameFinished = output<CardFlipperReport>();

  soundService = inject(SoundService);
  state = inject(CardFlipperStateService);
  settingsService = inject(SettingsService);

  // Expose state signals
  cards = this.state.cards;
  moves = this.state.moves;
  timer = this.state.timer;

  private config = {
    Easy: { pairs: 6, cols: 4 }, // 4x3 grid
    Medium: { pairs: 8, cols: 4 }, // 4x4 grid
    Hard: { pairs: 10, cols: 5 }, // 5x4 grid
  };

  ngOnInit() {
    if (!this.state.isGameActive()) {
      this.setupGame();
    }
  }

  ngOnDestroy() {
    clearInterval(this.state.timerId);
  }

  setupGame() {
    const { pairs } = this.config[this.difficulty()];
    // Shuffle the main symbols array to get a random set for each game
    const shuffledSymbols = [...SYMBOLS].sort(() => 0.5 - Math.random());
    const gameSymbols = shuffledSymbols.slice(0, pairs);
    let newCards: Card[] = [];

    // Create pairs
    for (let i = 0; i < pairs; i++) {
      newCards.push({ id: i * 2, symbol: gameSymbols[i], state: 'down' });
      newCards.push({ id: i * 2 + 1, symbol: gameSymbols[i], state: 'down' });
    }

    // Shuffle cards
    for (let i = newCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
    }

    this.state.cards.set(newCards);
    this.state.isGameActive.set(true);
    this.startTimer();
  }

  startTimer() {
    clearInterval(this.state.timerId);
    this.state.timerId = setInterval(() => {
      this.state.timer.update(t => t + 1);
    }, 1000);
  }

  flipCard(card: Card) {
    if (card.state !== 'down' || this.state.flippedCards().length >= 2) {
      return;
    }

    this.soundService.playClick();
    
    // Flip this card
    this.state.cards.update(cards => {
        const c = cards.find(c => c.id === card.id);
        if(c) c.state = 'up';
        return [...cards];
    });

    this.state.flippedCards.update(flipped => [...flipped, card]);

    if (this.state.flippedCards().length === 2) {
      this.state.moves.update(m => m + 1);
      this.checkForMatch();
    }
  }
  
  checkForMatch() {
    const [card1, card2] = this.state.flippedCards();
    if (card1.symbol === card2.symbol) {
        // Match
        this.soundService.playSuccess();
        this.state.justMatchedIds.set([card1.id, card2.id]);
        this.state.flippedCards.set([]);

        // After animation, set state to matched and clear animation trigger
        setTimeout(() => {
            this.state.cards.update(cards => {
                cards.filter(c => c.id === card1.id || c.id === card2.id).forEach(c => c.state = 'matched');
                return [...cards];
            });
            this.state.justMatchedIds.set([]);
            this.checkWinCondition();
        }, 800); // Duration of match animation

    } else {
        // No match
        this.state.noMatchIds.set([card1.id, card2.id]);
        
        setTimeout(() => {
            this.soundService.playFailure();
            this.state.cards.update(cards => {
                const c1 = cards.find(c => c.id === card1.id);
                if(c1) c1.state = 'down';
                const c2 = cards.find(c => c.id === card2.id);
                if(c2) c2.state = 'down';
                return [...cards];
            });
            this.state.flippedCards.set([]);
            this.state.noMatchIds.set([]);
        }, 1000);
    }
  }
  
  checkWinCondition() {
    const allMatched = this.state.cards().every(c => c.state === 'matched');
    if (allMatched) {
        clearInterval(this.state.timerId);
        this.gameOver();
    }
  }

  gameOver() {
    const { pairs } = this.config[this.difficulty()];
    // Score based on time and moves. Lower is better.
    const score = Math.max(0, 5000 - (this.timer() * 10) - (this.moves() * 20));

    const report: CardFlipperReport = {
        type: 'CardFlipper',
        stats: [
            { label: 'Final Score', value: score },
            { label: 'Time', value: `${this.timer()}s` },
            { label: 'Moves', value: this.moves() },
            { label: 'Pairs Found', value: `${pairs}` },
        ]
    };
    this.gameFinished.emit(report);
  }

  getGridCols(): string {
      return `repeat(${this.config[this.difficulty()].cols}, 1fr)`;
  }
}