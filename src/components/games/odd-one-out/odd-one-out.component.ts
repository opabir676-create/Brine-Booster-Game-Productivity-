import { Component, ChangeDetectionStrategy, input, output, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Difficulty, OddOneOutReport } from '../games.types';
import { SoundService } from '../../../services/sound.service';
import { OddOneOutStateService, OddOneOutItem } from '../../../services/state/odd-one-out-state.service';

const ICONS = ['🌟', '🧠', '🚀', '💡', '🧩', '🎯', '🔥', '⚛️', '🧬', '⚡️', '🪐', '✨'];

@Component({
  selector: 'app-odd-one-out',
  templateUrl: './odd-one-out.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OddOneOutComponent implements OnInit, OnDestroy {
  difficulty = input.required<Difficulty>();
  gameFinished = output<OddOneOutReport>();

  soundService = inject(SoundService);
  state = inject(OddOneOutStateService);
  
  // Expose state signals
  gameState = this.state.gameState;
  items = this.state.items;
  score = this.state.score;
  timeLeft = this.state.timeLeft;
  streak = this.state.streak;

  private config = {
      Easy: { gridSize: 9, rotation: 90 },
      Medium: { gridSize: 16, rotation: 45 },
      Hard: { gridSize: 25, rotation: 20 },
  };

  ngOnInit() {
    if (this.items().length === 0) {
        this.nextRound();
        this.startTimer();
    }
  }

  ngOnDestroy() {
    clearInterval(this.state.timerId);
  }

  startTimer() {
    this.state.timerId = setInterval(() => {
        this.timeLeft.update(t => t-1);
        if(this.timeLeft() <= 0) {
            this.gameOver();
        }
    }, 1000);
  }

  nextRound() {
    const { gridSize, rotation } = this.config[this.difficulty()];
    const newItems: OddOneOutItem[] = [];
    
    const standardIcon = ICONS[Math.floor(Math.random() * ICONS.length)];
    const oddOneIndex = Math.floor(Math.random() * gridSize);
    const oddRotation = rotation * (Math.floor(Math.random() * 3) + 1);

    for (let i = 0; i < gridSize; i++) {
        const isOdd = i === oddOneIndex;
        newItems.push({
            id: i,
            icon: standardIcon,
            transform: isOdd ? `rotate(${oddRotation}deg)` : 'rotate(0deg)',
            isOdd: isOdd,
        });
    }
    this.items.set(newItems);
  }

  handleItemClick(item: OddOneOutItem) {
    if (this.gameState() !== 'playing') return;

    if (item.isOdd) {
        this.soundService.playSuccess();
        this.streak.update(s => s + 1);
        const timeBonus = Math.max(0, 5 - (60 - this.timeLeft())); // Bonus for speed
        this.score.update(s => s + 50 + this.streak() * 5 + timeBonus);
        this.timeLeft.update(t => t + 3); // Add time for correct answer
        this.nextRound();
    } else {
        this.soundService.playFailure();
        this.streak.set(0);
        this.timeLeft.update(t => Math.max(0, t - 2)); // Penalty for wrong answer
    }
  }
  
  gameOver() {
    clearInterval(this.state.timerId);
    this.state.gameState.set('finished');

    const report: OddOneOutReport = {
        type: 'OddOneOut',
        stats: [
            { label: 'Final Score', value: this.score() },
            { label: 'Correctly Found', value: Math.floor(this.score() / 50) }, // Approximate
            { label: 'Longest Streak', value: this.streak() }, // This should be tracked separately for accuracy
        ]
    };
    this.gameFinished.emit(report);
  }
  
  getGridCols(): number {
      return Math.sqrt(this.config[this.difficulty()].gridSize);
  }
}
