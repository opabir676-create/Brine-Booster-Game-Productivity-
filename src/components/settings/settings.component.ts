import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  settingsService = inject(SettingsService);
  geminiService = inject(GeminiService);
  
  apiKeyInput = signal(this.settingsService.apiKey());

  readonly MIN_DURATION = 0.2;
  readonly MAX_DURATION = 5.0;
  
  cardLightingSpeedPercent = computed(() => {
    const duration = this.settingsService.cardLightingSpeed();
    // Inverse linear interpolation to convert duration to a 0-100 speed value
    const speed = 100 * (this.MAX_DURATION - duration) / (this.MAX_DURATION - this.MIN_DURATION);
    return Math.round(speed);
  });

  languages = [
    'Arabic', 'Bengali', 'Bulgarian', 'Chinese (Simplified)', 'Chinese (Traditional)', 
    'Croatian', 'Czech', 'Danish', 'Dutch', 'English', 'Estonian', 'Finnish', 
    'French', 'German', 'Greek', 'Hebrew', 'Hindi', 'Hungarian', 'Indonesian', 
    'Italian', 'Japanese', 'Korean', 'Latvian', 'Lithuanian', 'Norwegian', 
    'Polish', 'Portuguese', 'Romanian', 'Russian', 'Slovak', 'Slovenian', 
    'Spanish', 'Swedish', 'Thai', 'Turkish', 'Ukrainian', 'Urdu', 'Vietnamese'
  ];

  shimmerAnimations: { key: 'slide' | 'pulse' | 'diag' | 'radar', name: string }[] = [
    { key: 'slide', name: 'Slide' },
    { key: 'pulse', name: 'Pulse' },
    { key: 'diag', name: 'Diagonal' },
    { key: 'radar', name: 'Radar' },
  ];

  borderAnimations: { key: 'rotate' | 'pulse' | 'chase' | 'sweep' | 'meteor' | 'electric', name: string }[] = [
    { key: 'rotate', name: 'Rotate' },
    { key: 'pulse', name: 'Pulse' },
    { key: 'chase', name: 'Chase' },
    { key: 'sweep', name: 'Sweep' },
    { key: 'meteor', name: 'Meteor' },
    { key: 'electric', name: 'Electric' },
  ];

  updateApiKey() {
    this.settingsService.apiKey.set(this.apiKeyInput());
  }

  deleteApiKey() {
    this.apiKeyInput.set('');
    this.settingsService.apiKey.set('');
  }
  
  onLanguageChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.settingsService.language.set(value);
  }

  onUiScaleChange(event: Event) {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.settingsService.uiScale.set(value);
  }

  onLightingChange(event: Event) {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.settingsService.lightingIntensity.set(value);
  }

  onSmokeIntensityChange(event: Event) {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.settingsService.cardSmokeIntensity.set(value);
  }

  onCardLightingChange(event: Event) {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.settingsService.cardLightingIntensity.set(value);
  }
  
  onCardBorderThicknessChange(event: Event) {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.settingsService.cardBorderThickness.set(value);
  }

  onCardLightingSpeedPercentChange(event: Event) {
    const speedPercent = (event.target as HTMLInputElement).valueAsNumber;
    const durationRange = this.MAX_DURATION - this.MIN_DURATION;
    const duration = this.MAX_DURATION - (speedPercent / 100) * durationRange;
    // Set it and clamp to ensure it's within bounds
    this.settingsService.cardLightingSpeed.set(Math.max(this.MIN_DURATION, Math.min(this.MAX_DURATION, duration)));
  }

  onCardTiltChange(event: Event) {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.settingsService.cardTiltDegree.set(value);
  }

  onCardHoverIntensityChange(event: Event) {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.settingsService.cardHoverIntensity.set(value);
  }

  onCardShimmerIntensityChange(event: Event) {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.settingsService.cardShimmerIntensity.set(value);
  }

  onGridLineIntensityChange(event: Event) {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.settingsService.gridLineIntensity.set(value);
  }

  onPomodoroWorkChange(event: Event) {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.settingsService.pomodoroWorkMinutes.set(value);
  }
  
  onPomodoroShortBreakChange(event: Event) {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.settingsService.pomodoroShortBreakMinutes.set(value);
  }
  
  onPomodoroLongBreakChange(event: Event) {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.settingsService.pomodoroLongBreakMinutes.set(value);
  }

  onSpeedMathDurationChange(event: Event) {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.settingsService.speedMathDuration.set(value);
  }
  
  onReactionTimeRoundsChange(event: Event) {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.settingsService.reactionTimeRounds.set(value);
  }

  onCardFlipSpeedChange(event: Event) {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.settingsService.cardFlipAnimationSpeed.set(value);
  }

}