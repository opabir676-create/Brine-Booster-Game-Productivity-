import { Component, ChangeDetectionStrategy, input, output, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Difficulty, AIGuessThePromptReport } from '../games.types';
import { GeminiService } from '../../../services/gemini.service';
import { SettingsService } from '../../../services/settings.service';
import { SoundService } from '../../../services/sound.service';
import { AIGuessThePromptStateService } from '../../../services/state/ai-guess-the-prompt-state.service';

@Component({
  selector: 'app-ai-guess-the-prompt',
  templateUrl: './ai-guess-the-prompt.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AIGuessThePromptComponent implements OnInit {
  difficulty = input.required<Difficulty>();
  gameFinished = output<AIGuessThePromptReport>();

  geminiService = inject(GeminiService);
  settingsService = inject(SettingsService);
  soundService = inject(SoundService);
  state = inject(AIGuessThePromptStateService);

  // Expose state signals
  gameState = this.state.gameState;
  currentImage = this.state.currentImage;
  userPrompt = this.state.userPrompt;
  score = this.state.score;
  evaluation = this.state.evaluation;
  correctPrompt = this.state.correctPrompt;


  ngOnInit() {
    if (this.settingsService.apiKeyValidationState() !== 'valid') {
        this.gameState.set('error');
    }
  }

  async startGame() {
    this.gameState.set('loading');
    try {
        const generatedPrompt = await this.geminiService.generateImagePrompt();
        this.state.correctPrompt.set(generatedPrompt);
        
        const imageData = await this.geminiService.generateImageForPromptGame(generatedPrompt);
        this.currentImage.set(imageData.imageUrl);

        this.gameState.set('playing');
    } catch (e) {
        console.error("Error generating game data:", e);
        this.gameState.set('error');
    }
  }
  
  async submitPrompt() {
    if (this.gameState() !== 'playing' || !this.userPrompt().trim() || !this.correctPrompt()) return;
    
    this.gameState.set('evaluating');
    try {
        const responseText = await this.geminiService.evaluatePromptSimilarity(this.correctPrompt()!, this.userPrompt());
        const result = JSON.parse(responseText);
        this.state.evaluation.set(result);
        this.score.set(result.similarityScore);
        this.soundService.playSuccess();
        this.createReport(result.similarityScore);
        this.gameState.set('report');
    } catch (e) {
        console.error("Error evaluating prompt:", e);
        this.gameState.set('error');
    }
  }
  
  downloadImage() {
    const imageUrl = this.currentImage();
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = 'brine-booster-ai-art.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  createReport(finalScore: number) {
    const report: AIGuessThePromptReport = {
        type: 'AIGuessThePrompt',
        stats: [
            { label: 'Final Score', value: finalScore },
            { label: 'Similarity', value: `${finalScore}%` },
            { label: 'Difficulty', value: this.difficulty() }
        ]
    };
    this.gameFinished.emit(report);
  }

  playAgain() {
    this.state.reset();
  }
}