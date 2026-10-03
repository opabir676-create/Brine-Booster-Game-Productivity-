import { Component, ChangeDetectionStrategy, input, output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Difficulty, NumberSequenceReport } from '../games.types';
import { SoundService } from '../../../services/sound.service';
import { NumberSequenceStateService, SequenceProblem } from '../../../services/state/number-sequence-state.service';

@Component({
  selector: 'app-number-sequence',
  templateUrl: './number-sequence.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberSequenceComponent implements OnInit {
  difficulty = input.required<Difficulty>();
  gameFinished = output<NumberSequenceReport>();

  soundService = inject(SoundService);
  state = inject(NumberSequenceStateService);

  // Expose state signals
  gameState = this.state.gameState;
  currentProblem = this.state.currentProblem;
  userAnswer = this.state.userAnswer;
  feedback = this.state.feedback;
  round = this.state.round;
  score = this.state.score;
  lives = this.state.lives;

  ngOnInit() {
    if (this.gameState() === 'setup') {
        this.state.gameState.set('playing');
        this.nextRound();
    }
  }

  nextRound() {
    this.feedback.set('');
    this.userAnswer.set('');
    this.currentProblem.set(this.generateProblem());
  }

  generateProblem(): SequenceProblem {
    const type = Math.floor(Math.random() * 3); // 0: Arithmetic, 1: Geometric, 2: Fibonacci-like

    let problem: SequenceProblem;
    switch(type) {
        case 1: problem = this.generateGeometric(); break;
        case 2: problem = this.generateFibonacci(); break;
        default: problem = this.generateArithmetic(); break;
    }
    return problem;
  }
  
  private generateArithmetic(): SequenceProblem {
      const start = Math.floor(Math.random() * 10) + 1;
      const diff = this.difficulty() === 'Easy' ? (Math.floor(Math.random() * 5) + 1) : (Math.floor(Math.random() * 10) + 2);
      const sequence = [start, start + diff, start + 2 * diff, start + 3 * diff, start + 4 * diff];
      const missingIndex = Math.floor(Math.random() * 5);
      const answer = sequence[missingIndex];
      sequence[missingIndex] = '?' as any;
      return { sequence: sequence, answer };
  }
  
  private generateGeometric(): SequenceProblem {
      const start = Math.floor(Math.random() * 3) + 1;
      const ratio = this.difficulty() === 'Hard' ? (Math.floor(Math.random() * 3) + 2) : 2;
      const sequence = [start, start * ratio, start * (ratio**2), start * (ratio**3), start * (ratio**4)];
      const missingIndex = Math.floor(Math.random() * 4) + 1; // Avoid first element
      const answer = sequence[missingIndex];
      sequence[missingIndex] = '?' as any;
      return { sequence, answer };
  }
  
  private generateFibonacci(): SequenceProblem {
      const start1 = Math.floor(Math.random() * 5) + 1;
      const start2 = Math.floor(Math.random() * 5) + start1;
      const sequence = [start1, start2, start1 + start2, start2 + (start1 + start2), (start1+start2) + (start2+(start1+start2))];
      const missingIndex = Math.floor(Math.random() * 3) + 2; // Can't guess first two
      const answer = sequence[missingIndex];
      sequence[missingIndex] = '?' as any;
      return { sequence, answer };
  }

  submitAnswer() {
    const answer = parseInt(this.userAnswer(), 10);
    if (isNaN(answer) || this.gameState() !== 'playing') return;

    if (answer === this.currentProblem()?.answer) {
        this.soundService.playSuccess();
        this.feedback.set('correct');
        this.score.update(s => s + 100);
        this.round.update(r => r + 1);
        setTimeout(() => this.nextRound(), 1500);
    } else {
        this.soundService.playFailure();
        this.feedback.set('incorrect');
        this.lives.update(l => l - 1);
        if (this.lives() <= 0) {
            setTimeout(() => this.gameOver(), 2000);
        } else {
            setTimeout(() => this.nextRound(), 2000);
        }
    }
  }

  gameOver() {
    this.gameState.set('feedback');
    const report: NumberSequenceReport = {
      type: 'NumberSequence',
      stats: [
        { label: 'Final Score', value: this.score() },
        { label: 'Sequences Solved', value: this.round() - 1 },
        { label: 'Lives Remaining', value: this.lives() },
        { label: 'Difficulty', value: this.difficulty() },
      ],
    };
    this.gameFinished.emit(report);
    this.state.reset();
  }
}
