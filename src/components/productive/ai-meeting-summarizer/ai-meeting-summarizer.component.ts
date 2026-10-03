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

interface ActionItem {
  owner: string;
  task: string;
}

interface SummaryResult {
  summary: string;
  keyDecisions: string[];
  actionItems: ActionItem[];
}

@Component({
  selector: 'app-ai-meeting-summarizer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ai-meeting-summarizer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiMeetingSummarizerComponent {
  geminiService = inject(GeminiService);
  settingsService = inject(SettingsService);
  progressService = inject(ProgressService);
  modalService = inject(ModalService);
  savedItemsService = inject(SavedItemsService);

  state = signal<GeneratorState>('idle');
  transcript = signal('');
  summaryResult = signal<SummaryResult | null>(null);
  error = signal('');
  
  isCopied = signal(false);
  isSaved = signal(false);

  get isApiKeyValid() {
    return this.settingsService.apiKeyValidationState() === 'valid';
  }

  async generateSummary() {
    if (!this.isApiKeyValid) {
      this.modalService.showApiKeyModal();
      return;
    }
    if (!this.transcript().trim() || this.state() === 'loading') return;

    this.state.set('loading');
    this.summaryResult.set(null);
    this.error.set('');
    this.isCopied.set(false);
    this.isSaved.set(false);

    try {
      const responseText = await this.geminiService.summarizeMeeting(this.transcript());
      const response = JSON.parse(responseText);
      this.summaryResult.set(response);
      this.state.set('success');
      this.progressService.addMeetingSummarizerReward();
    } catch (e: any) {
      this.state.set('error');
      this.error.set(e.message || 'An unknown error occurred.');
      console.error(e);
    }
  }

  copySummary() {
    const result = this.summaryResult();
    if (!result) return;

    let textToCopy = `MEETING SUMMARY\n====================\n\n`;
    textToCopy += `Summary:\n${result.summary}\n\n`;

    if (result.keyDecisions?.length > 0) {
      textToCopy += `Key Decisions:\n${result.keyDecisions.map(d => `- ${d}`).join('\n')}\n\n`;
    }

    if (result.actionItems?.length > 0) {
      textToCopy += `Action Items:\n${result.actionItems.map(item => `- [${item.owner}] ${item.task}`).join('\n')}`;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      this.isCopied.set(true);
      setTimeout(() => this.isCopied.set(false), 2000);
    });
  }

  saveSummary() {
    const result = this.summaryResult();
    if (!result) return;

    this.savedItemsService.saveItem({
      type: 'meeting-summary',
      title: 'Meeting Summary',
      content: {
        transcript: this.transcript(),
        summary: result
      }
    });
    this.isSaved.set(true);
    setTimeout(() => this.isSaved.set(false), 2000);
  }
}
