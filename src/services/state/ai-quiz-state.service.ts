import { Injectable, signal } from '@angular/core';

type QuizState = 'setup' | 'loading' | 'playing' | 'feedback' | 'error';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

@Injectable({ providedIn: 'root' })
export class AiQuizStateService {
  gameState = signal<QuizState>('setup');
  questionSet = signal<QuizQuestion[]>([]);
  selectedAnswer = signal<string | null>(null);
  isCorrect = signal(false);
  correctAnswers = signal(0);
  round = signal(1);
  score = signal(0);
  streak = signal(0);
  scoreUpdated = signal(false);
  
  topic = signal('');
  numberOfQuestions = signal(5);
  isGeneratingTopic = signal(false);

  hint = signal<string | null>(null);
  hintLoading = signal(false);
  hintUsed = signal(false);

  reset() {
    this.gameState.set('setup');
    this.questionSet.set([]);
    this.selectedAnswer.set(null);
    this.isCorrect.set(false);
    this.correctAnswers.set(0);
    this.round.set(1);
    this.score.set(0);
    this.streak.set(0);
    this.scoreUpdated.set(false);
    this.topic.set('');
    this.numberOfQuestions.set(5);
    this.isGeneratingTopic.set(false);
    this.hint.set(null);
    this.hintLoading.set(false);
    this.hintUsed.set(false);
  }
}