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

@Component({
  selector: 'app-ai-idea-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ai-idea-generator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiIdeaGeneratorComponent {
  geminiService = inject(GeminiService);
  settingsService = inject(SettingsService);
  progressService = inject(ProgressService);
  modalService = inject(ModalService);
  savedItemsService = inject(SavedItemsService);

  state = signal<GeneratorState>('idle');
  prompt = signal('');
  ideas = signal<string[]>([]);
  error = signal('');
  numberOfIdeas = signal(5);

  copiedIndex = signal<number | null>(null);
  isSaved = signal(false);

  get isApiKeyValid() {
    return this.settingsService.apiKeyValidationState() === 'valid';
  }

  async generateIdeas() {
    if (!this.isApiKeyValid) {
      this.modalService.showApiKeyModal();
      return;
    }
    if (!this.prompt().trim() || this.state() === 'loading') return;

    this.state.set('loading');
    this.ideas.set([]);
    this.error.set('');
    this.isSaved.set(false);

    try {
      const responseText = await this.geminiService.generateIdeas(this.prompt(), this.numberOfIdeas());
      const response = JSON.parse(responseText);
      this.ideas.set(response.ideas || []);
      this.state.set('success');
      this.progressService.addIdeaGeneratorReward();
    } catch (e: any) {
      this.state.set('error');
      this.error.set(e.message || 'An unknown error occurred.');
      console.error(e);
    }
  }

  copyIdea(idea: string, index: number) {
    navigator.clipboard.writeText(idea).then(() => {
      this.copiedIndex.set(index);
      setTimeout(() => this.copiedIndex.set(null), 2000);
    });
  }

  saveIdeas() {
    if (this.ideas().length === 0) return;
    const contentToSave = {
      prompt: this.prompt(),
      ideas: this.ideas()
    };
    this.savedItemsService.saveItem({
      type: 'idea',
      title: `Ideas for "${this.prompt()}"`,
      content: contentToSave,
    });
    this.isSaved.set(true);
    setTimeout(() => this.isSaved.set(false), 2000);
  }
}
