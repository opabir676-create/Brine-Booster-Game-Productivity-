import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { GeminiService } from '../../services/gemini.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-api-key-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 animate-futuristic-fade-in flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div (click)="close()" class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      <!-- Modal Card -->
      <div class="futuristic-card w-full max-w-md relative">
        <div class="card-content">
          <div class="relative z-10 p-6 flex flex-col gap-4">
            <h2 class="text-2xl font-bold text-glow" [style.color]="'var(--theme-color-primary)'">AI Feature Locked</h2>
            <p class="text-gray-300">This feature requires a Gemini API key. Please enter your key below to proceed. You can get a key from <a href="https://aistudio.google.com/app/apikey" target="_blank" class="underline hover:text-white" [style.color]="'var(--theme-color-primary)'">Google AI Studio</a>.</p>
            
            <input 
              type="password" 
              [value]="apiKeyInput()"
              (input)="apiKeyInput.set($event.target.value)"
              placeholder="Enter your Gemini API key" 
              class="w-full futuristic-input">
            
            <button (click)="saveAndValidate()" class="w-full mt-2 futuristic-btn btn-primary" [disabled]="settingsService.apiKeyValidationState() === 'validating'">
              @if (settingsService.apiKeyValidationState() === 'validating') {
                <span>Validating...</span>
              } @else {
                <span>Save & Validate Key</span>
              }
            </button>

            <div class="mt-2 h-6 text-center">
              @switch (settingsService.apiKeyValidationState()) {
                @case ('valid') { <p class="text-green-400">Success! AI features unlocked.</p> }
                @case ('invalid') { <p class="text-red-400">Invalid API Key. Please check and try again.</p> }
                @case ('idle') { 
                  <p class="text-gray-400">Enter a key to get started.</p>
                }
              }
            </div>

            <button (click)="close()" class="absolute top-2 right-2 p-2 rounded-full hover:bg-white/10 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ApiKeyModalComponent {
  modalService = inject(ModalService);
  settingsService = inject(SettingsService);
  geminiService = inject(GeminiService);
  
  apiKeyInput = signal('');

  constructor() {
    effect(() => {
      // If key becomes valid, close modal after a short delay
      if (this.settingsService.apiKeyValidationState() === 'valid') {
        setTimeout(() => {
          this.modalService.hideApiKeyModal();
        }, 1500);
      }
    });
  }

  saveAndValidate() {
    this.settingsService.apiKey.set(this.apiKeyInput());
    // Validation is triggered by an effect in GeminiService
  }

  close() {
    this.modalService.hideApiKeyModal();
  }
}
