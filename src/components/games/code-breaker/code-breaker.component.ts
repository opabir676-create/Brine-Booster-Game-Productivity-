import { Component, ChangeDetectionStrategy, input, output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Difficulty, CodeBreakerReport } from '../games.types';
import { SoundService } from '../../../services/sound.service';
import { CodeBreakerStateService, Guess } from '../../../services/state/code-breaker-state.service';

const COLOR_PALETTES = {
  Easy: ['#ef4444', '#3b82f6', '#22c55e', '#f97316'],
  Medium: ['#ef4444', '#3b82f6', '#22c55e', '#f97316', '#a855f7', '#eab308'],
  Hard: ['#ef4444', '#3b82f6', '#22c55e', '#f97316', '#a855f7', '#eab308', '#ec4899', '#64748b'],
};

@Component({
  selector: 'app-code-breaker',
  templateUrl: './code-breaker.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeBreakerComponent implements OnInit {
  difficulty = input.required<Difficulty>();
  gameFinished = output<CodeBreakerReport>();

  soundService = inject(SoundService);
  state = inject(CodeBreakerStateService);

  // Expose state signals
  gameState = this.state.gameState;
  guesses = this.state.guesses;
  activeRow = this.state.activeRow;
  maxGuesses = this.state.maxGuesses;
  codeLength = this.state.codeLength;
  availableColors = this.state.availableColors;
  revealFeedback = this.state.revealFeedback;
  
  private config = {
    Easy: { length: 3, guesses: 10 },
    Medium: { length: 4, guesses: 8 },
    Hard: { length: 5, guesses: 8 },
  };
  
  ngOnInit() {
    if (this.guesses().length === 0) {
      this.setupGame();
    }
  }

  setupGame() {
    const { length, guesses } = this.config[this.difficulty()];
    const colors = COLOR_PALETTES[this.difficulty()];

    this.state.codeLength.set(length);
    this.state.maxGuesses.set(guesses);
    this.state.availableColors.set(colors);
    this.state.secretCode.set(this.generateSecretCode(colors, length));
    
    const initialGuesses: Guess[] = [];
    for (let i = 0; i < guesses; i++) {
      initialGuesses.push({
        colors: Array(length).fill(null),
        feedback: [],
      });
    }
    this.state.guesses.set(initialGuesses);
  }
  
  generateSecretCode(colors: string[], length: number): string[] {
    const code = [];
    for (let i = 0; i < length; i++) {
      code.push(colors[Math.floor(Math.random() * colors.length)]);
    }
    return code;
  }
  
  selectColor(color: string) {
    if (this.gameState() !== 'playing') return;

    this.guesses.update(currentGuesses => {
      const activeGuess = currentGuesses[this.activeRow()];
      const firstEmptyIndex = activeGuess.colors.indexOf(null);
      if (firstEmptyIndex !== -1) {
        activeGuess.colors[firstEmptyIndex] = color;
        this.soundService.playClick();
      }
      return [...currentGuesses];
    });
  }

  deleteLastColor() {
     if (this.gameState() !== 'playing') return;
     this.guesses.update(currentGuesses => {
       const activeGuess = currentGuesses[this.activeRow()];
       // Find the last non-null index
       let lastColorIndex = -1;
       for(let i = activeGuess.colors.length - 1; i >= 0; i--) {
           if (activeGuess.colors[i] !== null) {
               lastColorIndex = i;
               break;
           }
       }

       if (lastColorIndex !== -1) {
           activeGuess.colors[lastColorIndex] = null;
       }
       return [...currentGuesses];
     });
  }

  submitGuess() {
    const currentGuess = this.guesses()[this.activeRow()];
    if (currentGuess.colors.includes(null)) return; // Not a full guess

    this.soundService.playSuccess();
    const feedback = this.evaluateGuess(currentGuess.colors as string[]);
    this.guesses.update(guesses => {
      guesses[this.activeRow()].feedback = feedback;
      return [...guesses];
    });
    
    this.revealFeedback.set(true);
    setTimeout(() => {
        this.revealFeedback.set(false);
        this.checkGameState(feedback);
    }, 500);
  }

  evaluateGuess(guess: string[]): ('correct' | 'present')[] {
    const secret = [...this.state.secretCode()];
    const tempGuess = [...guess];
    const feedback: ('correct' | 'present')[] = [];

    // First pass for correct positions
    for (let i = 0; i < tempGuess.length; i++) {
      if (tempGuess[i] === secret[i]) {
        feedback.push('correct');
        tempGuess[i] = 'checked';
        secret[i] = 'checked';
      }
    }

    // Second pass for present colors
    for (let i = 0; i < tempGuess.length; i++) {
      if (tempGuess[i] !== 'checked') {
        const indexInSecret = secret.indexOf(tempGuess[i]);
        if (indexInSecret !== -1) {
          feedback.push('present');
          secret[indexInSecret] = 'checked';
        }
      }
    }
    
    // Sort feedback for consistency
    return feedback.sort((a, b) => a === 'correct' ? -1 : 1);
  }
  
  checkGameState(feedback: ('correct'|'present')[]) {
    if (feedback.length === this.codeLength() && feedback.every(f => f === 'correct')) {
        this.gameState.set('won');
        this.soundService.playNotify();
        this.createReport(true);
    } else if (this.activeRow() + 1 >= this.maxGuesses()) {
        this.gameState.set('lost');
        this.soundService.playFailure();
        this.createReport(false);
    } else {
        this.activeRow.update(r => r + 1);
    }
  }

  createReport(won: boolean) {
      const guessesUsed = this.activeRow() + 1;
      const guessesLeft = this.maxGuesses() - guessesUsed;
      const score = won ? (guessesLeft * 100) + (this.maxGuesses() * 20) : 0;
      
      const report: CodeBreakerReport = {
          type: 'CodeBreaker',
          stats: [
              { label: 'Final Score', value: score },
              { label: 'Result', value: won ? 'Won' : 'Lost' },
              { label: 'Guesses Used', value: guessesUsed },
              { label: 'Guesses Left', value: won ? guessesLeft : 0 },
          ],
      };
      this.gameFinished.emit(report);
  }
}