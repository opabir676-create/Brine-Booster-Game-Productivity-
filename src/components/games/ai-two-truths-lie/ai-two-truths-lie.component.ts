import { Component, ChangeDetectionStrategy, input, output, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Difficulty, AITwoTruthsLieReport } from '../games.types';
import { GeminiService } from '../../../services/gemini.service';
import { SettingsService } from '../../../services/settings.service';
import { SoundService } from '../../../services/sound.service';
import { AITwoTruthsLieStateService, Statement, StatementSet } from '../../../services/state/ai-two-truths-lie-state.service';

@Component({
  selector: 'app-ai-two-truths-lie',
  templateUrl: './ai-two-truths-lie.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AITwoTruthsLieComponent implements OnInit {
  difficulty = input.required<Difficulty>();
  gameFinished = output<AITwoTruthsLieReport>();

  geminiService = inject(GeminiService);
  settingsService = inject(SettingsService);
  soundService = inject(SoundService);
  state = inject(AITwoTruthsLieStateService);

  // Expose state signals
  gameState = this.state.gameState;
  topic = this.state.topic;
  isGeneratingTopic = this.state.isGeneratingTopic;
  statementSets = this.state.statementSets;
  score = this.state.score;
  numberOfSets = this.state.numberOfSets;
  correctAnswers = this.state.correctAnswers;
  incorrectAnswers = this.state.incorrectAnswers;

  ngOnInit() {
    if (this.settingsService.apiKeyValidationState() !== 'valid') {
      this.gameState.set('error');
    }
  }

  async generateRandomTopic() {
    this.isGeneratingTopic.set(true);
    try {
        const responseText = await this.geminiService.generateRandomTopic();
        const data = JSON.parse(responseText);
        this.topic.set(data.topic);
    } catch (e) {
        console.error("Could not generate topic", e);
        this.topic.set("The Ocean"); // Fallback topic
    } finally {
        this.isGeneratingTopic.set(false);
    }
  }

  async startGame() {
    if (!this.topic().trim()) return;
    this.gameState.set('loading');
    try {
        const responseText = await this.geminiService.generateTwoTruthsAndALie(this.topic(), this.numberOfSets());
        const data = JSON.parse(responseText);

        if (!data.sets || data.sets.length === 0) {
          throw new Error("AI returned no data.");
        }
        
        const newSets: StatementSet[] = data.sets.map((set: { statements: Statement[]}) => {
           if (!set.statements || set.statements.length !== 3 || set.statements.filter(s => s.is_lie).length !== 1) {
             // Skip invalid sets
             return null;
           }
           return {
            statements: [...set.statements].sort(() => 0.5 - Math.random()), // Shuffle each set
            selected: null,
            isScored: false
           };
        }).filter((s: StatementSet | null): s is StatementSet => s !== null);

        if(newSets.length === 0) {
            throw new Error("AI returned invalid data format for all sets.");
        }
        
        this.state.statementSets.set(newSets);
        this.gameState.set('playing');
    } catch (e) {
        console.error("Error generating statements:", e);
        this.gameState.set('error');
    }
  }

  selectAnswer(setIndex: number, statement: Statement) {
    const targetSet = this.statementSets()[setIndex];
    if (!targetSet || targetSet.selected) return; // Already answered

    this.state.statementSets.update(sets => {
        sets[setIndex].selected = statement;
        return [...sets];
    });

    if (statement.is_lie) {
        this.soundService.playSuccess();
        this.score.update(s => s + 100);
        this.correctAnswers.update(c => c + 1);
    } else {
        this.soundService.playFailure();
        this.incorrectAnswers.update(i => i + 1);
    }

    if (this.correctAnswers() + this.incorrectAnswers() === this.statementSets().length) {
      this.gameOver();
    }
  }

  gameOver() {
    const report: AITwoTruthsLieReport = {
        type: 'AITwoTruthsLie',
        stats: [
            { label: 'Final Score', value: this.score() },
            { label: 'Correct Answers', value: `${this.correctAnswers()} / ${this.statementSets().length}` },
            { label: 'Topic', value: this.topic() },
            { label: 'Difficulty', value: this.difficulty() }
        ]
    };
    this.gameFinished.emit(report);
  }
}