import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GeminiService } from '../../../services/gemini.service';
import { SettingsService } from '../../../services/settings.service';
import { ProgressService } from '../../../services/progress.service';
import { ModalService } from '../../../services/modal.service';
import { SavedItemsService } from '../../../services/saved-items.service';

type GeneratorState = 'idle' | 'loading' | 'success' | 'error';

interface GoalStep {
  step: number;
  title: string;
  description: string;
  timeframe: string;
}

@Component({
  selector: 'app-ai-goal-setter',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ai-goal-setter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiGoalSetterComponent {
  geminiService = inject(GeminiService);
  settingsService = inject(SettingsService);
  progressService = inject(ProgressService);
  modalService = inject(ModalService);
  savedItemsService = inject(SavedItemsService);

  state = signal<GeneratorState>('idle');
  goalPrompt = signal('');
  goalPlan = signal<GoalStep[]>([]);
  error = signal('');
  
  isCopied = signal(false);
  isSaved = signal(false);

  get isApiKeyValid() {
    return this.settingsService.apiKeyValidationState() === 'valid';
  }

  async generatePlan() {
    if (!this.isApiKeyValid) {
      this.modalService.showApiKeyModal();
      return;
    }
    if (!this.goalPrompt().trim() || this.state() === 'loading') return;

    this.state.set('loading');
    this.goalPlan.set([]);
    this.error.set('');
    this.isCopied.set(false);
    this.isSaved.set(false);

    try {
      const responseText = await this.geminiService.generateGoalPlan(this.goalPrompt());
      const response = JSON.parse(responseText);
      this.goalPlan.set(response.plan || []);
      this.state.set('success');
      this.progressService.addGoalSetterReward();
    } catch (e: any) {
      this.state.set('error');
      this.error.set(e.message || 'An unknown error occurred.');
      console.error(e);
    }
  }

  copyPlan() {
    if (this.goalPlan().length === 0) return;
    const textToCopy = `Goal: ${this.goalPrompt()}\n\n` + this.goalPlan().map(step => 
      `Step ${step.step}: ${step.title}\nDescription: ${step.description}\nTimeframe: ${step.timeframe}`
    ).join('\n\n');

    navigator.clipboard.writeText(textToCopy).then(() => {
      this.isCopied.set(true);
      setTimeout(() => this.isCopied.set(false), 2000);
    });
  }

  savePlan() {
    if (this.goalPlan().length === 0) return;
    const contentToSave = {
      goal: this.goalPrompt(),
      plan: this.goalPlan()
    };
    this.savedItemsService.saveItem({
      type: 'goal-plan',
      title: `Plan for "${this.goalPrompt()}"`,
      content: contentToSave
    });
    this.isSaved.set(true);
    setTimeout(() => this.isSaved.set(false), 2000);
  }
}
