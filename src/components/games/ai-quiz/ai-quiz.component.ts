import { Component, ChangeDetectionStrategy, input, output, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Difficulty, AIQuizReport } from '../games.types';
import { GeminiService } from '../../../services/gemini.service';
import { SettingsService } from '../../../services/settings.service';
import { SoundService } from '../../../services/sound.service';
import { AiQuizStateService } from '../../../services/state/ai-quiz-state.service';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

@Component({
  selector: 'app-ai-quiz',
  templateUrl: './ai-quiz.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiQuizComponent implements OnInit {
  difficulty = input.required<Difficulty>();
  gameFinished = output<AIQuizReport>();

  geminiService = inject(GeminiService);
  settingsService = inject(SettingsService);
  soundService = inject(SoundService);
  state = inject(AiQuizStateService);

  // Expose state signals
  gameState = this.state.gameState;
  questionSet = this.state.questionSet;
  selectedAnswer = this.state.selectedAnswer;
  isCorrect = this.state.isCorrect;
  correctAnswers = this.state.correctAnswers;
  round = this.state.round;
  score = this.state.score;
  streak = this.state.streak;
  scoreUpdated = this.state.scoreUpdated;
  topic = this.state.topic;
  numberOfQuestions = this.state.numberOfQuestions;
  isGeneratingTopic = this.state.isGeneratingTopic;
  hint = this.state.hint;
  hintLoading = this.state.hintLoading;
  hintUsed = this.state.hintUsed;

  currentQuestion = computed<QuizQuestion | null>(() => {
    if (this.questionSet().length > 0 && this.round() <= this.questionSet().length) {
      return this.questionSet()[this.round() - 1];
    }
    return null;
  });

  ngOnInit() {
    if (this.settingsService.apiKeyValidationState() !== 'valid' && this.gameState() !== 'error') {
      this.gameState.set('error');
    }
  }

  async generateRandomTopic() {
    this.isGeneratingTopic.set(true);
    try {
        const responseText = await this.geminiService.generateRandomTopic();
        const data = JSON.parse(responseText);
        this.topic.set(data.topic);
    } catch (e) {
        console.error("Could not generate topic", e);
        this.topic.set("World History");
    } finally {
        this.isGeneratingTopic.set(false);
    }
  }

  async startQuiz() {
    if (!this.topic().trim()) return;
    this.gameState.set('loading');
    this.round.set(1);
    this.score.set(0);
    this.streak.set(0);
    this.state.correctAnswers.set(0);

    try {
      const responseText = await this.geminiService.generateQuizSet(this.topic(), this.numberOfQuestions());
      const data = JSON.parse(responseText);
      
      const validatedQuestions = data.questions.map((q: QuizQuestion) => {
        if (q.options && !q.options.includes(q.answer)) {
            q.options[Math.floor(Math.random() * q.options.length)] = q.answer;
        }
        return q;
      });

      this.questionSet.set(validatedQuestions);

      if (this.questionSet().length > 0) {
        this.gameState.set('playing');
      } else {
        throw new Error("AI did not return any questions.");
      }
    } catch (e) {
      this.gameState.set('error');
      console.error(e);
    }
  }

  selectAnswer(option: string) {
    if (this.gameState() !== 'playing') return;
    this.selectedAnswer.set(option);
    this.isCorrect.set(option === this.currentQuestion()?.answer);
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
        if (this.round() >= this.questionSet().length) {
            this.gameOver();
        } else {
          this.round.update(r => r + 1);
          this.selectedAnswer.set(null);
          this.hint.set(null);
          this.hintUsed.set(false);
          this.gameState.set('playing');
        }
      }, 2000);
  }

  async getHint() {
    const q = this.currentQuestion();
    if (!q || this.hintUsed() || this.hintLoading()) return;
    this.hintLoading.set(true);
    try {
        const responseText = await this.geminiService.generateQuizHint(q.question, q.options, q.answer);
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
    const report: AIQuizReport = {
      type: 'AIQuiz',
      stats: [
        { label: 'Final Score', value: this.score() },
        { label: 'Correct Answers', value: `${this.correctAnswers()} / ${this.numberOfQuestions()}` },
        { label: 'Topic', value: this.topic() },
      ],
    };
    this.gameFinished.emit(report);
    this.state.reset();
  }
}