import { Component, ChangeDetectionStrategy, input, output, signal, inject, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Difficulty, AIRiddlesReport } from '../games.types';
import { GeminiService } from '../../../services/gemini.service';
import { SettingsService } from '../../../services/settings.service';
import { SoundService } from '../../../services/sound.service';
import { AiRiddlesStateService } from '../../../services/state/ai-riddles-state.service';

@Component({
  selector: 'app-ai-riddles',
  templateUrl: './ai-riddles.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiRiddlesComponent implements OnInit, OnDestroy {
  difficulty = input.required<Difficulty>();
  gameFinished = output<AIRiddlesReport>();
  
  geminiService = inject(GeminiService);
  settingsService = inject(SettingsService);
  soundService = inject(SoundService);
  state = inject(AiRiddlesStateService);

  // Expose state signals to template
  gameState = this.state.gameState;
  riddleSet = this.state.riddleSet;
  userAnswer = this.state.userAnswer;
  round = this.state.round;
  score = this.state.score;
  timeLeft = this.state.timeLeft;
  streak = this.state.streak;
  scoreUpdated = this.state.scoreUpdated;
  numberOfRiddles = this.state.numberOfRiddles;
  topic = this.state.topic;
  isGeneratingTopic = this.state.isGeneratingTopic;
  hint = this.state.hint;
  hintLoading = this.state.hintLoading;
  hintUsed = this.state.hintUsed;

  currentRiddle = computed(() => {
    if (this.riddleSet().length > 0 && this.round() <= this.riddleSet().length) {
      return this.riddleSet()[this.round() - 1];
    }
    return null;
  });

  ngOnInit() {
     if (this.settingsService.apiKeyValidationState() !== 'valid' && this.gameState() !== 'error') {
        this.gameState.set('error');
    }
    if (this.gameState() === 'playing') {
        this.startTimer(); // Resume timer if returning to an active game
    }
  }

  ngOnDestroy() {
    clearInterval(this.state.timerId);
  }

  async generateRandomTopic() {
    this.isGeneratingTopic.set(true);
    try {
        const responseText = await this.geminiService.generateRandomTopic();
        const data = JSON.parse(responseText);
        this.topic.set(data.topic);
    } catch (e) {
        console.error("Could not generate topic", e);
        this.topic.set("Science");
    } finally {
        this.isGeneratingTopic.set(false);
    }
  }

  async startGame() {
    this.gameState.set('loading');
    clearInterval(this.state.timerId);
    this.round.set(1);
    this.score.set(0);
    this.streak.set(0);
    this.hint.set(null);
    this.hintUsed.set(false);

    try {
      const responseText = await this.geminiService.generateRiddleSet(this.topic(), this.numberOfRiddles(), this.difficulty());
      const riddleData = JSON.parse(responseText);
      this.riddleSet.set(riddleData.riddles);
      if (this.riddleSet().length > 0) {
        this.gameState.set('playing');
        this.startTimer();
      } else {
        throw new Error("AI did not return any riddles.");
      }
    } catch (e) {
      this.gameState.set('error');
      console.error(e);
    }
  }

  startTimer() {
    const timeSettings = { Easy: 45, Medium: 30, Hard: 20 };
    if(this.timeLeft() <=0) this.timeLeft.set(timeSettings[this.difficulty()]);

    clearInterval(this.state.timerId);
    this.state.timerId = setInterval(() => {
      this.timeLeft.update(t => t - 1);
      if (this.timeLeft() <= 0) {
        clearInterval(this.state.timerId);
        this.gameState.set('incorrect');
        this.streak.set(0);
        this.handleFeedback();
      }
    }, 1000);
  }

  async submitAnswer() {
    if (!this.userAnswer() || this.gameState() !== 'playing' || !this.currentRiddle()) return;
    
    clearInterval(this.state.timerId);
    this.gameState.set('checking');

    const isCorrect = await this.geminiService.checkRiddleAnswer(this.currentRiddle()!.riddle, this.userAnswer());
    
    if (isCorrect) {
      this.soundService.playSuccess();
      this.streak.update(s => s + 1);
      const bonus = this.streak() * 10;
      this.score.update(s => s + 100 + this.timeLeft() * 5 + bonus);
      this.scoreUpdated.set(true);
      setTimeout(() => this.scoreUpdated.set(false), 500);
      this.gameState.set('correct');
    } else {
      this.soundService.playFailure();
      this.streak.set(0);
      this.gameState.set('incorrect');
    }

    this.handleFeedback();
  }
  
  async handleFeedback(skipped = false) {
    await new Promise(res => setTimeout(res, skipped ? 1500 : 2000)); 
    
    if (this.round() >= this.riddleSet().length) {
       this.gameOver();
    } else {
       this.round.update(r => r + 1);
       this.userAnswer.set('');
       this.hint.set(null);
       this.hintUsed.set(false);
       this.gameState.set('playing');
       this.startTimer();
    }
  }

  async getHint() {
    if (!this.currentRiddle() || this.hintUsed() || this.hintLoading()) return;
    this.hintLoading.set(true);
    try {
        const responseText = await this.geminiService.generateHint(this.currentRiddle()!.riddle);
        const hintData = JSON.parse(responseText);
        this.hint.set(hintData.hint);
        this.hintUsed.set(true);
    } catch (e) {
        this.hint.set("Could not get a hint right now.");
    } finally {
        this.hintLoading.set(false);
    }
  }

  skip() {
    clearInterval(this.state.timerId);
    this.gameState.set('incorrect');
    this.streak.set(0);
    this.handleFeedback(true); 
  }

  gameOver() {
    clearInterval(this.state.timerId);
    const correctAnswers = this.score() > 0 ? this.score() / 100 : 0;
    const report: AIRiddlesReport = {
      type: 'AIRiddles',
      stats: [
        { label: 'Final Score', value: this.score() },
        { label: 'Riddles Solved', value: `${correctAnswers} / ${this.numberOfRiddles()}` },
        { label: 'Difficulty', value: this.difficulty() },
      ],
    };
    this.gameFinished.emit(report);
    this.state.reset();
  }
}