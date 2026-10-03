import { Injectable, signal } from '@angular/core';
import type { Chat } from '@google/genai';

export type AICreativeStoryState = 'setup' | 'loading' | 'playing' | 'finished' | 'error';

export interface StoryTurn {
    author: 'user' | 'model';
    text: string;
}

@Injectable({ providedIn: 'root' })
export class AICreativeStoryStateService {
    gameState = signal<AICreativeStoryState>('setup');
    story = signal<StoryTurn[]>([]);
    turn = signal(0);
    maxTurns = signal(10);
    
    // This will hold the live chat session
    chatSession = signal<Chat | null>(null);

    reset() {
        this.gameState.set('setup');
        this.story.set([]);
        this.turn.set(0);
        this.maxTurns.set(10);
        this.chatSession.set(null);
    }
}