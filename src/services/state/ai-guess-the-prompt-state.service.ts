import { Injectable, signal } from '@angular/core';

export type AIGuessThePromptState = 'setup' | 'loading' | 'playing' | 'evaluating' | 'report' | 'error';

export interface EvaluationResult {
    similarityScore: number;
    feedback: string;
}

@Injectable({ providedIn: 'root' })
export class AIGuessThePromptStateService {
    gameState = signal<AIGuessThePromptState>('setup');
    
    currentImage = signal<string | null>(null);
    correctPrompt = signal<string | null>(null);
    userPrompt = signal('');
    evaluation = signal<EvaluationResult | null>(null);
    score = signal(0);
    
    reset() {
        this.gameState.set('setup');
        this.currentImage.set(null);
        this.correctPrompt.set(null);
        this.userPrompt.set('');
        this.evaluation.set(null);
        this.score.set(0);
    }
}