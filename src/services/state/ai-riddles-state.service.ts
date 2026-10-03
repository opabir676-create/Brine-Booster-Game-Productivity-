import { Injectable, signal } from '@angular/core';

type RiddleState = 'setup' | 'loading' | 'playing' | 'checking' | 'correct' | 'incorrect' | 'error';

interface Riddle {
  riddle: string;
  answer: string;
}

@Injectable({ providedIn: 'root' })
export class AiRiddlesStateService {
  gameState = signal<RiddleState>('setup');
  riddleSet = signal<Riddle[]>([]);
  userAnswer = signal('');
  round = signal(1);
  score = signal(0);
  timeLeft = signal(30);
  streak = signal(0);
  scoreUpdated = signal(false);
  
  numberOfRiddles = signal(5);
  topic = signal('');
  isGeneratingTopic = signal(false);

  hint = signal<string | null>(null);
  hintLoading = signal(false);
  hintUsed = signal(false);
  
  timerId: any;

  reset() {
    clearInterval(this.timerId);
    this.gameState.set('setup');
    this.riddleSet.set([]);
    this.userAnswer.set('');
    this.round.set(1);
    this.score.set(0);
    this.timeLeft.set(30);
    this.streak.set(0);
    this.scoreUpdated.set(false);
    this.numberOfRiddles.set(5);
    this.topic.set('');
    this.isGeneratingTopic.set(false);
    this.hint.set(null);
    this.hintLoading.set(false);
    this.hintUsed.set(false);
  }
}