import { Component, ChangeDetectionStrategy, input, output, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Difficulty, PatternMatchReport } from '../games.types';
import { SoundService } from '../../../services/sound.service';
import { PatternMatchStateService, Pattern, GridItem } from '../../../services/state/pattern-match-state.service';

const COLORS = {
  Easy: ['#ef4444', '#3b82f6', '#22c55e', '#f97316'],
  Medium: ['#ef4444', '#3b82f6', '#22c55e', '#f97316', '#a855f7', '#eab308'],
  Hard: ['#ef4444', '#3b82f6', '#22c55e', '#f97316', '#a855f7', '#eab308', '#ec4899', '#64748b'],
};

@Component({
  selector: 'app-pattern-match',
  templateUrl: './pattern-match.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatternMatchComponent implements OnInit, OnDestroy {
  difficulty = input.required<Difficulty>();
  gameFinished = output<PatternMatchReport>();

  soundService = inject(SoundService);
  state = inject(PatternMatchStateService);

  // Expose state signals
  gameState = this.state.gameState;
  grid = this.state.grid;
  targetPattern = this.state.targetPattern;
  feedback = this.state.feedback;
  round = this.state.round;
  score = this.state.score;
  timeLeft = this.state.timeLeft;
  lives = this.state.lives;

  private config = {
    Easy: { gridSize: 4, patternSize: 4, time: 8 },
    Medium: { gridSize: 9, patternSize: 4, time: 10 },
    Hard: { gridSize: 9, patternSize: 4, time: 8 },
  };

  ngOnInit() {
    if (this.gameState() === 'setup') {
      this.state.gameState.set('playing');
      this.nextRound();
    }
  }

  ngOnDestroy() {
    clearInterval(this.state.timerId);
  }

  nextRound() {
    this.feedback.set('');
    this.generateGrid();
    this.startTimer();
    this.state.roundStartTime = Date.now();
  }
  
  generatePattern(colors: string[], size: number): Pattern {
    const cells: string[] = [];
    for (let i = 0; i < size; i++) {
        cells.push(colors[Math.floor(Math.random() * colors.length)]);
    }
    return { cells };
  }
  
  mutatePattern(pattern: Pattern, colors: string[]): Pattern {
      const newCells = [...pattern.cells];
      const indexToChange = Math.floor(Math.random() * newCells.length);
      let newColor = colors[Math.floor(Math.random() * colors.length)];
      // Ensure the new color is different
      while(newCells.length > 1 && newColor === newCells[indexToChange]) {
        newColor = colors[Math.floor(Math.random() * colors.length)];
      }
      newCells[indexToChange] = newColor;
      return { cells: newCells };
  }

  generateGrid() {
    const { gridSize, patternSize } = this.config[this.difficulty()];
    const colors = COLORS[this.difficulty()];
    const target = this.generatePattern(colors, patternSize);
    this.targetPattern.set(target);

    const newGrid: GridItem[] = [];
    const targetIndex = Math.floor(Math.random() * gridSize);

    for (let i = 0; i < gridSize; i++) {
        const isTarget = i === targetIndex;
        newGrid.push({
            id: i,
            pattern: isTarget ? target : this.mutatePattern(target, colors),
            isTarget: isTarget,
        });
    }
    this.grid.set(newGrid);
  }

  startTimer() {
    clearInterval(this.state.timerId);
    const { time } = this.config[this.difficulty()];
    this.timeLeft.set(time);

    this.state.timerId = setInterval(() => {
        this.timeLeft.update(t => t - 1);
        if (this.timeLeft() <= 0) {
            this.handleSelection({ isTarget: false }); // Time ran out, treat as incorrect
        }
    }, 1000);
  }
  
  handleSelection(item: { isTarget: boolean }) {
    if (this.gameState() !== 'playing') return;

    clearInterval(this.state.timerId);
    this.state.totalClicks.update(t => t + 1);
    this.gameState.set('feedback');

    if (item.isTarget) {
      this.soundService.playSuccess();
      this.feedback.set('correct');
      this.state.correctClicks.update(c => c + 1);
      this.score.update(s => s + 100 + this.timeLeft() * 10);
      this.state.responseTimes.push(Date.now() - this.state.roundStartTime);
      this.round.update(r => r + 1);
      setTimeout(() => {
        this.gameState.set('playing');
        this.nextRound();
      }, 1000);
    } else {
      this.soundService.playFailure();
      this.feedback.set('incorrect');
      this.lives.update(l => l - 1);
      if(this.lives() <= 0) {
        setTimeout(() => this.gameOver(), 1500);
      } else {
        setTimeout(() => {
            this.gameState.set('playing');
            this.nextRound();
        }, 1500);
      }
    }
  }

  gameOver() {
    this.gameState.set('feedback');
    
    const accuracy = this.state.totalClicks() > 0 ? (this.state.correctClicks() / this.state.totalClicks()) * 100 : 0;
    const avgReactionTime = this.state.responseTimes.length > 0 ? this.state.responseTimes.reduce((a,b) => a+b, 0) / this.state.responseTimes.length : 0;

    const chartData = this.state.responseTimes.map((time, index) => {
        const x = (100 / (this.state.responseTimes.length - 1 || 1)) * index;
        const maxTime = Math.max(...this.state.responseTimes, 1);
        const y = 45 - (time / maxTime * 40);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');

    const report: PatternMatchReport = {
        type: 'PatternMatch',
        stats: [
            { label: 'Final Score', value: this.score() },
            { label: 'Rounds Completed', value: this.round() - 1 },
            { label: 'Accuracy', value: `${accuracy.toFixed(1)}%` },
            { label: 'Avg. Reaction', value: `${avgReactionTime.toFixed(0)}ms` },
        ],
        accuracy: accuracy,
        avgReactionTime: avgReactionTime,
        chartData: chartData,
    };
    this.gameFinished.emit(report);
    this.state.reset();
  }

  getGridCols(): string {
      return `repeat(${Math.sqrt(this.config[this.difficulty()].gridSize)}, 1fr)`;
  }
}