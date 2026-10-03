import { Injectable, signal } from '@angular/core';

type PuzzleState = 'setup' | 'loading' | 'playing' | 'feedback' | 'error';

interface Puzzle {
  puzzle_description: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

@Injectable({ providedIn: 'root' })
export class AiPuzzlesStateService {
  gameState = signal<PuzzleState>('setup');
  puzzleSet = signal<Puzzle[]>([]);
  selectedAnswer = signal<string | null>(null);
  isCorrect = signal(false);
  correctAnswers = signal(0);
  round = signal(1);
  score = signal(0);
  streak = signal(0);
  scoreUpdated = signal(false);
  
  numberOfPuzzles = signal(5);
  
  hint = signal<string | null>(null);
  hintLoading = signal(false);
  hintUsed = signal(false);

  reset() {
    this.gameState.set('setup');
    this.puzzleSet.set([]);
    this.selectedAnswer.set(null);
    this.isCorrect.set(false);
    this.correctAnswers.set(0);
    this.round.set(1);
    this.score.set(0);
    this.streak.set(0);
    this.scoreUpdated.set(false);
    this.numberOfPuzzles.set(5);
    this.hint.set(null);
    this.hintLoading.set(false);
    this.hintUsed.set(false);
  }
}