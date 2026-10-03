import { Injectable, signal } from '@angular/core';

export type AITwoTruthsLieState = 'setup' | 'loading' | 'playing' | 'error';

export interface Statement {
    statement: string;
    is_lie: boolean;
}

export interface StatementSet {
    statements: Statement[];
    selected: Statement | null;
    isScored: boolean;
}

@Injectable({ providedIn: 'root' })
export class AITwoTruthsLieStateService {
    gameState = signal<AITwoTruthsLieState>('setup');
    
    topic = signal('');
    isGeneratingTopic = signal(false);
    numberOfSets = signal(3);
    
    statementSets = signal<StatementSet[]>([]);
    
    score = signal(0);
    correctAnswers = signal(0);
    incorrectAnswers = signal(0);
    
    reset() {
        this.gameState.set('setup');
        this.topic.set('');
        this.isGeneratingTopic.set(false);
        this.statementSets.set([]);
        this.score.set(0);
        this.correctAnswers.set(0);
        this.incorrectAnswers.set(0);
    }
}