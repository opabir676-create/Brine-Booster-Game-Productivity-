import { Component, ChangeDetectionStrategy, input, output, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Difficulty, AIPuzzlesReport } from '../games.types';
import { GeminiService } from '../../../services/gemini.service';
import { SettingsService } from '../../../services/settings.service';
import { SoundService } from '../../../services/sound.service';
import { AiPuzzlesStateService } from '../../../services/state/ai-puzzles-state.service';

interface Puzzle {
  puzzle_description: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

@Component({
  selector: 'app-ai-puzzles',
  templateUrl: './ai-puzzles.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiPuzzlesComponent implements OnInit {
  difficulty = input.required<Difficulty>();
  gameFinished = output<AIPuzzlesReport>();

  geminiService = inject(GeminiService);
  settingsService = inject(SettingsService);
  soundService = inject(SoundService);
  state = inject(AiPuzzlesStateService);

  // Expose state signals
  gameState = this.state.gameState;
  puzzleSet = this.state.puzzleSet;
  selectedAnswer = this.state.selectedAnswer;
  isCorrect = this.state.isCorrect;
  correctAnswers = this.state.correctAnswers;
  round = this.state.round;
  score = this.state.score;
  streak = this.state.streak;
  scoreUpdated = this.state.scoreUpdated;
  numberOfPuzzles = this.state.numberOfPuzzles;
  hint = this.state.hint;
  hintLoading = this.state.hintLoading;
  hintUsed = this.state.hintUsed;

  currentPuzzle = computed<Puzzle | null>(() => {
    if (this.puzzleSet().length > 0 && this.round() <= this.puzzleSet().length) {
      return this.puzzleSet()[this.round() - 1];
    }
    return null;
  });

  ngOnInit() {
    if (this.settingsService.apiKeyValidationState() !== 'valid' && this.gameState() !== 'error') {
      this.gameState.set('error');
    }
  }

  async startPuzzles() {
    this.gameState.set('loading');
    this.round.set(1);
    this.score.set(0);
    this.streak.set(0);
    this.state.correctAnswers.set(0);

    try {
      const responseText = await this.geminiService.generateLogicPuzzleSet(this.numberOfPuzzles(), this.difficulty());
      const puzzleData = JSON.parse(responseText);
      
      const validPuzzles = puzzleData.puzzles.filter((p: Puzzle) => p.question && p.puzzle_description);
      
      this.puzzleSet.set(validPuzzles);

      if (this.puzzleSet().length > 0) {
        this.gameState.set('playing');
      } else {
        throw new Error("AI did not return any valid puzzles.");
      }
    } catch (e) {
      this.gameState.set('error');
      console.error(e);
    }
  }

  selectAnswer(option: string) {
    if (this.gameState() !== 'playing') return;
    this.selectedAnswer.set(option);
    this.isCorrect.set(option === this.currentPuzzle()?.correct_answer);
    if (this.isCorrect()) {
      this.soundService.playSuccess();
      this.streak.update(s => s + 1);
      this.correctAnswers.update(c => c + 1);
      const bonus = this.streak() * 10;
      this.score.update(s => s + 100 + bonus);
      this.scoreUpdated.set(true);
      setTimeout(() => this.scoreUpdated.set(false), 500);
    } else {
      this.soundService.playFailure();
      this.streak.set(0);
    }
    this.gameState.set('feedback');
    this.moveToNext();
  }
  
  skip() {
    if (this.gameState() !== 'playing') return;
    this.selectedAnswer.set(null);
    this.isCorrect.set(false);
    this.streak.set(0);
    this.gameState.set('feedback');
    this.moveToNext();
  }

  moveToNext() {
      setTimeout(() => {
        if (this.round() >= this.puzzleSet().length) {
          this.gameOver();
        } else {
          this.round.update(r => r + 1);
          this.selectedAnswer.set(null);
          this.hint.set(null);
          this.hintUsed.set(false);
          this.gameState.set('playing');
        }
      }, 2500);
  }
  
  async getHint() {
    const p = this.currentPuzzle();
    if (!p || this.hintUsed() || this.hintLoading()) return;
    this.hintLoading.set(true);
    const context = `${p.puzzle_description}. ${p.question}`;
    try {
        const responseText = await this.geminiService.generateHint(context);
        const hintData = JSON.parse(responseText);
        this.hint.set(hintData.hint);
        this.hintUsed.set(true);
    } catch (e) {
        this.hint.set("Could not get a hint right now.");
    } finally {
        this.hintLoading.set(false);
    }
  }

  gameOver() {
    const report: AIPuzzlesReport = {
      type: 'AIPuzzles',
      stats: [
        { label: 'Final Score', value: this.score() },
        { label: 'Puzzles Solved', value: `${this.correctAnswers()} / ${this.numberOfPuzzles()}` },
        { label: 'Difficulty', value: this.difficulty() },
      ],
    };
    this.gameFinished.emit(report);
    this.state.reset();
  }
}