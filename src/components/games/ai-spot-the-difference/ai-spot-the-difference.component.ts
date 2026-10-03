import { Component, ChangeDetectionStrategy, input, output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Difficulty, AISpotTheDifferenceReport } from '../games.types';
import { GeminiService } from '../../../services/gemini.service';
import { SettingsService } from '../../../services/settings.service';
import { SoundService } from '../../../services/sound.service';
import { AISpotTheDifferenceStateService, Click } from '../../../services/state/ai-spot-the-difference-state.service';

@Component({
  selector: 'app-ai-spot-the-difference',
  templateUrl: './ai-spot-the-difference.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AISpotTheDifferenceComponent implements OnInit {
  difficulty = input.required<Difficulty>();
  gameFinished = output<AISpotTheDifferenceReport>();

  geminiService = inject(GeminiService);
  settingsService = inject(SettingsService);
  soundService = inject(SoundService);
  state = inject(AISpotTheDifferenceStateService);

  // Expose state signals
  gameState = this.state.gameState;
  image1 = this.state.image1;
  image2 = this.state.image2;
  differences = this.state.differences;
  userClicks = this.state.userClicks;

  ngOnInit() {
    if (this.settingsService.apiKeyValidationState() !== 'valid') {
        this.gameState.set('error');
    }
  }

  async startGame() {
    this.gameState.set('loading');
    try {
        const gameDataText = await this.geminiService.generateSpotTheDifferenceGame(this.difficulty());
        const gameData = JSON.parse(gameDataText);
        
        this.state.differences.set(gameData.differences);

        const [imageData1, imageData2] = await Promise.all([
            this.geminiService.generateImageForPromptGame(gameData.prompt1),
            this.geminiService.generateImageForPromptGame(gameData.prompt2)
        ]);
        
        this.image1.set(imageData1.imageUrl);
        this.image2.set(imageData2.imageUrl);

        this.gameState.set('playing');
    } catch (e) {
        console.error("Error generating game data:", e);
        this.gameState.set('error');
    }
  }

  handleImageClick(event: MouseEvent) {
    if (this.gameState() !== 'playing' || this.userClicks().length >= 5) {
        return;
    }
    this.soundService.playClick();
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    this.state.userClicks.update(clicks => [...clicks, { x, y }]);
    
    if (this.userClicks().length >= 5) {
        this.gameOver();
    }
  }

  gameOver() {
    this.gameState.set('finished');
    const score = 500; // Base score for completion
    
    const report: AISpotTheDifferenceReport = {
        type: 'AISpotTheDifference',
        stats: [
            { label: 'Final Score', value: score },
            { label: 'Differences Found', value: `${this.userClicks().length} / 5` },
            { label: 'Difficulty', value: this.difficulty() }
        ]
    };
    this.gameFinished.emit(report);
  }

  playAgain() {
    this.state.reset();
  }
}