import { Component, ChangeDetectionStrategy, input, output, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Difficulty, ColorClashReport } from '../games.types';
import { SoundService } from '../../../services/sound.service';
import { ColorClashStateService, ColorWord } from '../../../services/state/color-clash-state.service';

interface ColorOption {
    name: string;
    hex: string;
}

const COLORS: ColorOption[] = [
    { name: 'Red', hex: '#ef4444' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Green', hex: '#22c55e' },
    { name: 'Yellow', hex: '#eab308' },
    { name: 'Purple', hex: '#a855f7' },
    { name: 'Orange', hex: '#f97316' },
];

@Component({
  selector: 'app-color-clash',
  templateUrl: './color-clash.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorClashComponent implements OnInit, OnDestroy {
  difficulty = input.required<Difficulty>();
  gameFinished = output<ColorClashReport>();

  soundService = inject(SoundService);
  state = inject(ColorClashStateService);

  // Expose state signals
  gameState = this.state.gameState;
  currentColorWord = this.state.currentColorWord;
  score = this.state.score;
  timeLeft = this.state.timeLeft;
  
  colorOptions: ColorOption[] = [];

  ngOnInit() {
    this.setupGame();
    if (this.state.gameState() === 'playing') {
        this.nextTurn();
        this.startTimer();
    }
  }

  ngOnDestroy() {
    clearInterval(this.state.timerId);
  }

  setupGame() {
    const numOptions = this.difficulty() === 'Easy' ? 4 : (this.difficulty() === 'Medium' ? 5 : 6);
    this.colorOptions = [...COLORS].sort(() => 0.5 - Math.random()).slice(0, numOptions);
  }

  startTimer() {
    this.state.timerId = setInterval(() => {
      this.state.timeLeft.update(t => t - 1);
      if (this.state.timeLeft() <= 0) {
        this.gameOver();
      }
    }, 1000);
  }

  nextTurn() {
    const wordColor = this.colorOptions[Math.floor(Math.random() * this.colorOptions.length)];
    let inkColor = this.colorOptions[Math.floor(Math.random() * this.colorOptions.length)];
    
    // 25% chance of being congruent, otherwise ensure incongruent
    if (Math.random() > 0.25 && this.colorOptions.length > 1) {
        while (inkColor.name === wordColor.name) {
             inkColor = this.colorOptions[Math.floor(Math.random() * this.colorOptions.length)];
        }
    }
    
    this.state.currentColorWord.set({ word: wordColor.name, colorHex: inkColor.hex });
  }

  handleAnswer(chosenColorHex: string) {
    if (this.gameState() !== 'playing') return;

    if (chosenColorHex === this.state.currentColorWord()?.colorHex) {
      this.soundService.playClick();
      this.state.score.update(s => s + 10);
      this.state.correctAnswers.update(c => c + 1);
    } else {
      this.soundService.playFailure();
      this.state.score.update(s => Math.max(0, s - 5));
      this.state.timeLeft.update(t => Math.max(0, t - 1));
      this.state.incorrectAnswers.update(i => i + 1);
    }
    this.nextTurn();
  }

  gameOver() {
    clearInterval(this.state.timerId);
    this.state.gameState.set('finished');

    const totalAnswers = this.state.correctAnswers() + this.state.incorrectAnswers();
    const accuracy = totalAnswers > 0 ? (this.state.correctAnswers() / totalAnswers) * 100 : 0;

    const report: ColorClashReport = {
        type: 'ColorClash',
        stats: [
            { label: 'Final Score', value: this.score() },
            { label: 'Correct', value: this.state.correctAnswers() },
            { label: 'Incorrect', value: this.state.incorrectAnswers() },
            { label: 'Accuracy', value: `${accuracy.toFixed(1)}%` }
        ]
    };
    this.gameFinished.emit(report);
  }
}
