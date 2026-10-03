import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-brain-dump',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './brain-dump.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrainDumpComponent {
  content = signal('');

  charCount = computed(() => this.content().length);
  wordCount = computed(() => {
    const trimmedContent = this.content().trim();
    if (trimmedContent === '') return 0;
    return trimmedContent.split(/\s+/).length;
  });

  constructor() {
    if (typeof window !== 'undefined') {
      this.content.set(localStorage.getItem('bb_brainDumpContent') || '');
    }

    effect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('bb_brainDumpContent', this.content());
      }
    });
  }

  clearContent() {
    this.content.set('');
  }
}