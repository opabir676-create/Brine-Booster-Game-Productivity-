import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SavedItemsService, SavedItem } from '../../services/saved-items.service';

@Component({
  selector: 'app-saved-items',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './saved-items.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedItemsComponent {
  savedItemsService = inject(SavedItemsService);
  items = this.savedItemsService.savedItems;

  copiedId = signal<number | null>(null);

  deleteItem(id: number) {
    this.savedItemsService.deleteItem(id);
  }

  copyContent(item: SavedItem) {
    let textToCopy = '';
    switch (item.type) {
      case 'idea':
        textToCopy = `Ideas for "${item.content.prompt}"\n\n${item.content.ideas.map((idea: string) => `- ${idea}`).join('\n')}`;
        break;
      case 'goal-plan':
        textToCopy = `Goal: ${item.content.goal}\n\n${item.content.plan.map((step: any) => `Step ${step.step}: ${step.title}\n${step.description}`).join('\n\n')}`;
        break;
      case 'meeting-summary':
        const summary = item.content.summary;
        textToCopy = `MEETING SUMMARY\n====================\n\nSummary:\n${summary.summary}\n\n`;
        if (summary.keyDecisions?.length > 0) {
          textToCopy += `Key Decisions:\n${summary.keyDecisions.map((d: string) => `- ${d}`).join('\n')}\n\n`;
        }
        if (summary.actionItems?.length > 0) {
          textToCopy += `Action Items:\n${summary.actionItems.map((ai: any) => `- [${ai.owner}] ${ai.task}`).join('\n')}`;
        }
        break;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      this.copiedId.set(item.id);
      setTimeout(() => this.copiedId.set(null), 2000);
    });
  }
}
