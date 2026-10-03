import { Component, ChangeDetectionStrategy, input, output, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Difficulty, ReactionTimeReport } from '../games.types';
import { SoundService } from '../../../services/sound.service';
import { ReactionTimeStateService } from '../../../services/state/reaction-time-state.service';

@Component({
  selector: 'app-reaction-time',
  templateUrl: './reaction-time.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReactionTimeComponent implements OnInit, OnDestroy {
  difficulty = input.required<Difficulty>(); // Not used, but part of the interface
  gameFinished = output<ReactionTimeReport>();

  soundService = inject(SoundService);
  state = inject(ReactionTimeStateService);

  // Expose state signals
  gameState = this.state.gameState;
  round = this.state.round;
  maxRounds = this.state.maxRounds;
  results = this.state.results;

  ngOnInit() {
    if (this.state.gameState() === 'setup') {
      this.startRound();
    }
  }

  ngOnDestroy() {
    clearTimeout(this.state.timeoutId);
  }

  startRound() {
    this.state.round.update(r => r + 1);
    this.state.gameState.set('waiting');

    const randomDelay = Math.random() * 3000 + 1000; // 1-4 seconds
    this.state.timeoutId = setTimeout(() => {
      this.state.gameState.set('ready');
      this.state.startTime = performance.now();
    }, randomDelay);
  }

  handleClick() {
    const currentState = this.state.gameState();
    clearTimeout(this.state.timeoutId);

    if (currentState === 'waiting') {
      this.soundService.playFailure();
      this.state.gameState.set('tooSoon');
      setTimeout(() => this.checkNextStep(), 2000);
    } else if (currentState === 'ready') {
      const endTime = performance.now();
      const reactionTime = Math.round(endTime - this.state.startTime);
      this.state.results.update(res => [...res, reactionTime]);
      this.soundService.playClick();
      this.state.gameState.set('clicked');
      setTimeout(() => this.checkNextStep(), 2000);
    }
  }

  checkNextStep() {
    if (this.state.round() >= this.state.maxRounds()) {
      this.gameOver();
    } else {
      this.startRound();
    }
  }

  gameOver() {
    const validResults = this.results();
    const averageTime = validResults.length > 0 ? validResults.reduce((a, b) => a + b, 0) / validResults.length : 0;
    const bestTime = validResults.length > 0 ? Math.min(...validResults) : 0;
    
    // Score inversely proportional to reaction time.
    const score = validResults.length > 0 ? Math.max(0, Math.round((500 - averageTime) * 10)) : 0;

    const report: ReactionTimeReport = {
        type: 'ReactionTime',
        stats: [
            { label: 'Final Score', value: score },
            { label: 'Average Time', value: `${averageTime.toFixed(0)}ms` },
            { label: 'Best Time', value: `${bestTime.toFixed(0)}ms` },
            { label: 'Rounds', value: `${this.state.maxRounds()}` },
        ]
    };
    this.gameFinished.emit(report);
  }
  
  getLastResult(): number {
    const res = this.results();
    return res.length > 0 ? res[res.length - 1] : 0;
  }
}
