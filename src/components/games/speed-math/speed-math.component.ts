import { Component, ChangeDetectionStrategy, input, output, inject, OnDestroy, OnInit, viewChild, ElementRef, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Difficulty, SpeedMathReport } from '../games.types';
import { SoundService } from '../../../services/sound.service';
import { SpeedMathStateService, MathProblem } from '../../../services/state/speed-math-state.service';

@Component({
  selector: 'app-speed-math',
  templateUrl: './speed-math.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeedMathComponent implements OnInit, OnDestroy {
  difficulty = input.required<Difficulty>();
  gameFinished = output<SpeedMathReport>();

  soundService = inject(SoundService);
  state = inject(SpeedMathStateService);
  
  // Expose state signals
  gameState = this.state.gameState;
  currentProblem = this.state.currentProblem;
  userAnswer = this.state.userAnswer;
  score = this.state.score;
  timeLeft = this.state.timeLeft;
  
  answerInput = viewChild<ElementRef>('answerInput');

  constructor() {
    afterNextRender(() => {
        this.answerInput()?.nativeElement.focus();
    });
  }

  ngOnInit() {
    if (this.gameState() === 'ready') {
      this.startGame();
    }
  }

  ngOnDestroy() {
    clearInterval(this.state.timerId);
  }

  startGame() {
    this.state.gameState.set('playing');
    this.nextProblem();
    this.startTimer();
    
    // Ensure input is focused when game starts
    setTimeout(() => this.answerInput()?.nativeElement.focus(), 0);
  }

  startTimer() {
    this.state.timerId = setInterval(() => {
      this.state.timeLeft.update(t => t - 1);
      if (this.state.timeLeft() <= 0) {
        this.gameOver();
      }
    }, 1000);
  }

  nextProblem() {
    this.currentProblem.set(this.generateProblem());
    this.userAnswer.set('');
  }

  generateProblem(): MathProblem {
    const operations = this.difficulty() === 'Easy' ? ['+'] : ['+', '-', '*'];
    const op = operations[Math.floor(Math.random() * operations.length)];
    let num1, num2;
    
    const maxNum = this.difficulty() === 'Easy' ? 10 : (this.difficulty() === 'Medium' ? 20 : 30);

    switch(op) {
      case '+':
        num1 = Math.floor(Math.random() * maxNum) + 1;
        num2 = Math.floor(Math.random() * maxNum) + 1;
        return { problem: `${num1} + ${num2}`, answer: num1 + num2 };
      case '-':
        num1 = Math.floor(Math.random() * maxNum) + 1;
        num2 = Math.floor(Math.random() * num1) + 1; // Ensure positive result
        return { problem: `${num1} - ${num2}`, answer: num1 - num2 };
      case '*':
        num1 = Math.floor(Math.random() * 10) + 2;
        num2 = Math.floor(Math.random() * (this.difficulty() === 'Hard' ? 12 : 10)) + 2;
        return { problem: `${num1} × ${num2}`, answer: num1 * num2 };
    }
    // Fallback
    return { problem: `5 + 3`, answer: 8 };
  }

  submitAnswer() {
    const answer = parseInt(this.userAnswer(), 10);
    if (isNaN(answer)) return;

    if (answer === this.currentProblem()?.answer) {
      this.soundService.playClick();
      this.score.update(s => s + 10);
      this.nextProblem();
    } else {
      this.soundService.playFailure();
      // Optional: Add a time penalty for wrong answers
      this.timeLeft.update(t => Math.max(0, t - 2));
      this.nextProblem();
    }
  }

  gameOver() {
    clearInterval(this.state.timerId);
    this.state.gameState.set('finished');

    const report: SpeedMathReport = {
        type: 'SpeedMath',
        stats: [
            { label: 'Final Score', value: this.score() },
            { label: 'Correct', value: this.score() / 10 },
            { label: 'Difficulty', value: this.difficulty() }
        ]
    };
    this.gameFinished.emit(report);
  }
}
