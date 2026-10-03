import { Component, ChangeDetectionStrategy, input, output, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Difficulty, AIMoralDilemmasReport } from '../games.types';
import { GeminiService } from '../../../services/gemini.service';
import { SettingsService } from '../../../services/settings.service';
import { SoundService } from '../../../services/sound.service';
import { AIMoralDilemmasStateService, Dilemma } from '../../../services/state/ai-moral-dilemmas-state.service';

@Component({
  selector: 'app-ai-moral-dilemmas',
  templateUrl: './ai-moral-dilemmas.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AIMoralDilemmasComponent implements OnInit {
  difficulty = input.required<Difficulty>();
  gameFinished = output<AIMoralDilemmasReport>();

  geminiService = inject(GeminiService);
  settingsService = inject(SettingsService);
  soundService = inject(SoundService);
  state = inject(AIMoralDilemmasStateService);

  // Expose state signals
  gameState = this.state.gameState;
  dilemmas = this.state.dilemmas;
  currentDilemmaIndex = this.state.currentDilemmaIndex;
  feedbackText = this.state.feedbackText;
  score = this.state.score;
  
  private config = {
      Easy: { rounds: 3 },
      Medium: { rounds: 5 },
      Hard: { rounds: 7 },
  };

  currentDilemma = computed<Dilemma | null>(() => {
    const set = this.dilemmas();
    const index = this.currentDilemmaIndex();
    if (set.length > 0 && index < set.length) {
      return set[index];
    }
    return null;
  });

  ngOnInit() {
    if (this.settingsService.apiKeyValidationState() !== 'valid') {
        this.gameState.set('error');
    }
  }

  async startGame() {
    this.gameState.set('loading');
    try {
        const rounds = this.config[this.difficulty()].rounds;
        const responseText = await this.geminiService.generateMoralDilemma(rounds);
        const data = JSON.parse(responseText);
        this.state.dilemmas.set(data.dilemmas);
        if (this.state.dilemmas().length > 0) {
            this.gameState.set('playing');
        } else {
            throw new Error("AI did not return any dilemmas.");
        }
    } catch(e) {
        this.gameState.set('error');
        console.error(e);
    }
  }

  async selectChoice(choice: string) {
    const dilemma = this.currentDilemma();
    if (!dilemma || this.gameState() !== 'playing') return;

    this.gameState.set('feedback');
    this.soundService.playClick();
    
    try {
        const responseText = await this.geminiService.evaluateMoralChoice(dilemma.dilemma, choice);
        const data = JSON.parse(responseText);
        this.state.feedbackText.set(data.analysis);
        this.score.update(s => s + 100);
    } catch(e) {
        this.state.feedbackText.set("Could not get feedback at this time.");
    }
  }
  
  nextDilemma() {
      if (this.currentDilemmaIndex() + 1 >= this.dilemmas().length) {
          this.gameOver();
      } else {
          this.state.currentDilemmaIndex.update(i => i + 1);
          this.state.feedbackText.set(null);
          this.gameState.set('playing');
      }
  }

  gameOver() {
    this.gameState.set('finished');
    const report: AIMoralDilemmasReport = {
        type: 'AIMoralDilemmas',
        stats: [
            { label: 'Final Score', value: this.score() },
            { label: 'Dilemmas Faced', value: `${this.dilemmas().length}` },
            { label: 'Difficulty', value: this.difficulty() }
        ]
    };
    this.gameFinished.emit(report);
  }
  
  playAgain() {
    this.state.reset();
  }
}