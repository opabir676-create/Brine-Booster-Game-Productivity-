import { Component, ChangeDetectionStrategy, input, output, inject, OnInit, OnDestroy, viewChild, ElementRef, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Difficulty, AICreativeStoryReport } from '../games.types';
import { GeminiService } from '../../../services/gemini.service';
import { SettingsService } from '../../../services/settings.service';
import { SoundService } from '../../../services/sound.service';
import { AICreativeStoryStateService, StoryTurn } from '../../../services/state/ai-creative-story-state.service';
import type { Chat } from '@google/genai';

@Component({
  selector: 'app-ai-creative-story',
  templateUrl: './ai-creative-story.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AICreativeStoryComponent implements OnInit, OnDestroy {
  difficulty = input.required<Difficulty>();
  gameFinished = output<AICreativeStoryReport>();

  geminiService = inject(GeminiService);
  settingsService = inject(SettingsService);
  soundService = inject(SoundService);
  state = inject(AICreativeStoryStateService);

  // Expose state signals
  gameState = this.state.gameState;
  story = this.state.story;
  turn = this.state.turn;
  maxTurns = this.state.maxTurns;
  
  userInput = signal('');
  isAiThinking = signal(false);

  storyContainer = viewChild<ElementRef>('storyContainer');
  
  constructor() {
    effect(() => {
        this.story(); // depend on story
        this.scrollToBottom();
    });
  }


  ngOnInit() {
    if (this.settingsService.apiKeyValidationState() !== 'valid') {
        this.gameState.set('error');
    }
  }

  ngOnDestroy() {
    // State is reset via game-player, no specific cleanup here
  }
  
  async startGame() {
    this.gameState.set('loading');
    const systemInstruction = `You are a creative storyteller. We will write a story together, one sentence at a time. I will write a sentence, then you will write the next sentence to continue the story. Your sentences should be imaginative, concise, and build upon my contribution. Your very first message should be a single, intriguing opening sentence to start our story.`;
    
    const chat = this.geminiService.createChat(systemInstruction);
    if (!chat) {
        this.gameState.set('error');
        return;
    }
    this.state.chatSession.set(chat);
    
    try {
        const response = await chat.sendMessage({ message: "Start the story." });
        this.state.story.set([{ author: 'model', text: response.text }]);
        this.state.turn.set(1);
        this.gameState.set('playing');
    } catch(e) {
        console.error("Error starting story chat:", e);
        this.gameState.set('error');
    }
  }

  async addSentence() {
    const text = this.userInput().trim();
    if (!text || this.isAiThinking() || this.gameState() !== 'playing') return;
    
    this.soundService.playClick();
    this.isAiThinking.set(true);
    this.userInput.set('');
    this.state.story.update(s => [...s, { author: 'user', text }]);
    this.state.turn.update(t => t + 1);
    
    if (this.state.turn() >= this.maxTurns()) {
        this.gameOver();
        return;
    }

    const chat = this.state.chatSession();
    if (!chat) {
        this.gameState.set('error');
        return;
    }

    try {
        const response = await chat.sendMessage({ message: text });
        this.state.story.update(s => [...s, { author: 'model', text: response.text }]);
        this.state.turn.update(t => t + 1);
         if (this.state.turn() >= this.maxTurns()) {
            this.gameOver();
        }
    } catch (e) {
        console.error("Error continuing story:", e);
        this.state.story.update(s => [...s, { author: 'model', text: "I seem to have lost my train of thought..."}]);
    } finally {
        this.isAiThinking.set(false);
    }
  }
  
  gameOver() {
    this.gameState.set('finished');
    const score = this.story().length * 50;
    const report: AICreativeStoryReport = {
        type: 'AICreativeStory',
        stats: [
            { label: 'Final Score', value: score },
            { label: 'Turns Taken', value: this.turn() },
            { label: 'Story Length', value: `${this.story().length} sentences` },
        ]
    };
    this.gameFinished.emit(report);
  }
  
  playAgain() {
    this.state.reset();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
        const el = this.storyContainer()?.nativeElement;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    }, 0);
  }
}