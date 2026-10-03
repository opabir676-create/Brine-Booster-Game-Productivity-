import { Component, ChangeDetectionStrategy, input, output, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Difficulty, AIWordScrambleReport } from '../games.types';
import { GeminiService } from '../../../services/gemini.service';
import { SettingsService } from '../../../services/settings.service';
import { SoundService } from '../../../services/sound.service';
import { AiWordScrambleStateService, ScrambledWord } from '../../../services/state/ai-word-scramble-state.service';

@Component({
  selector: 'app-ai-word-scramble',
  templateUrl: './ai-word-scramble.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiWordScrambleComponent implements OnInit, OnDestroy {
  difficulty = input.required<Difficulty>();
  gameFinished = output<AIWordScrambleReport>();

  geminiService = inject(GeminiService);
  settingsService = inject(SettingsService);
  soundService = inject(SoundService);
  state = inject(AiWordScrambleStateService);

  // Expose state signals
  gameState = this.state.gameState;
  userGuess = this.state.userGuess;
  feedback = this.state.feedback;
  round = this.state.round;
  score = this.state.score;
  timeLeft = this.state.timeLeft;
  lives = this.state.lives;
  isHintVisible = this.state.isHintVisible;
  
  private config = {
      Easy: { words: 5, time: 25 },
      Medium: { words: 7, time: 20 },
      Hard: { words: 10, time: 15 },
  };

  currentWord = computed<ScrambledWord | null>(() => {
    const set = this.state.wordSet();
    const currentRound = this.round();
    if (set.length > 0 && currentRound <= set.length) {
      return set[currentRound - 1];
    }
    return null;
  });

  ngOnInit() {
    if (this.settingsService.apiKeyValidationState() !== 'valid') {
        this.gameState.set('error');
    } else if (this.gameState() === 'setup') {
        this.startGame();
    }
  }

  ngOnDestroy() {
    clearInterval(this.state.timerId);
  }

  async startGame() {
    this.gameState.set('loading');
    try {
        const { words } = this.config[this.difficulty()];
        const responseText = await this.geminiService.generateScrambledWordSet(words, this.difficulty());
        const data = JSON.parse(responseText);
        this.state.wordSet.set(data.words);
        if (this.state.wordSet().length > 0) {
            this.gameState.set('playing');
            this.startTimer();
        } else {
            throw new Error("AI did not return any words.");
        }
    } catch(e) {
        this.gameState.set('error');
        console.error(e);
    }
  }

  startTimer() {
    clearInterval(this.state.timerId);
    this.timeLeft.set(this.config[this.difficulty()].time);
    this.state.timerId = setInterval(() => {
        this.timeLeft.update(t => t-1);
        if(this.timeLeft() <= 0) {
            this.handleIncorrectAnswer();
        }
    }, 1000);
  }

  submitGuess() {
    if(!this.userGuess().trim() || this.gameState() !== 'playing') return;

    const guess = this.userGuess().trim().toLowerCase();
    const answer = this.currentWord()?.word.toLowerCase();

    if(guess === answer) {
        this.soundService.playSuccess();
        this.feedback.set('correct');
        this.score.update(s => s + 100 + this.timeLeft() * 5);
        this.moveToNext();
    } else {
        this.handleIncorrectAnswer();
    }
  }

  handleIncorrectAnswer() {
    this.soundService.playFailure();
    this.feedback.set('incorrect');
    this.lives.update(l => l - 1);
    if(this.lives() <= 0) {
        this.gameOver();
    } else {
        this.moveToNext();
    }
  }

  moveToNext() {
    clearInterval(this.state.timerId);
    this.gameState.set('feedback');

    setTimeout(() => {
        if(this.round() >= this.state.wordSet().length) {
            this.gameOver();
            return;
        }
        this.round.update(r => r + 1);
        this.userGuess.set('');
        this.feedback.set('');
        this.isHintVisible.set(false);
        this.gameState.set('playing');
        this.startTimer();
    }, 2000);
  }

  gameOver() {
    clearInterval(this.state.timerId);
    this.gameState.set('feedback'); // Keep showing feedback on last question

    const correctAnswers = this.score() > 0 ? this.round() - this.lives() : 0;
    
    const report: AIWordScrambleReport = {
        type: 'AIWordScramble',
        stats: [
            { label: 'Final Score', value: this.score() },
            { label: 'Words Solved', value: `${correctAnswers} / ${this.state.wordSet().length}` },
            { label: 'Lives Left', value: this.lives() },
            { label: 'Difficulty', value: this.difficulty() }
        ]
    };
    // Use a timeout to let the final feedback show before emitting the report
    setTimeout(() => this.gameFinished.emit(report), 500);
  }
}
