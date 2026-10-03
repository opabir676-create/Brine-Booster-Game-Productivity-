import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'cyber-wave' | 'nebula-rose' | 'emerald-matrix';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  // Helper to get from localStorage
  private getItem<T>(key: string, defaultValue: T): T {
    if (typeof window !== 'undefined') {
      const storedValue = window.localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    }
    return defaultValue;
  }

  // API Key
  apiKey = signal<string>(this.getItem('bb_apiKey', ''));
  apiKeyValidationState = signal<'idle' | 'validating' | 'valid' | 'invalid'>('idle');

  // Customization
  animationsOn = signal<boolean>(this.getItem('bb_animationsOn', true));
  // New granular animation settings
  loadingAnimation = signal<boolean>(this.getItem('bb_loadingAnimation', true));
  backgroundAnimations = signal<boolean>(this.getItem('bb_backgroundAnimations', true));
  cardAnimations = signal<boolean>(this.getItem('bb_cardAnimations', true));
  uiAnimations = signal<boolean>(this.getItem('bb_uiAnimations', true));
  gameAnimations = signal<boolean>(this.getItem('bb_gameAnimations', true));
  
  language = signal<string>(this.getItem('bb_language', 'English'));
  font = signal<string>(this.getItem('bb_font', 'Poppins'));
  uiScale = signal<number>(this.getItem('bb_uiScale', 70));
  themeColor = signal<string>(this.getItem('bb_themeColor', '#00ff00'));
  lightingIntensity = signal<number>(this.getItem('bb_lightingIntensity', 100));
  soundOn = signal<boolean>(this.getItem('bb_soundOn', true));

  // Card Settings
  cardColor = signal<string>(this.getItem('bb_cardColor', 'rgba(20, 20, 35, 0.7)'));
  cardSmokeOn = signal<boolean>(this.getItem('bb_cardSmokeOn', true));
  cardSmokeIntensity = signal<number>(this.getItem('bb_cardSmokeIntensity', 3.0));
  cardGlowColor = signal<string>(this.getItem('bb_cardGlowColor', '#00ffff'));
  cardLightingIntensity = signal<number>(this.getItem('bb_cardLightingIntensity', 6));
  cardLightingSpeed = signal<number>(this.getItem('bb_cardLightingSpeed', 3.992)); // Animation duration in seconds
  cardBorderAnimation = signal<'rotate' | 'pulse' | 'chase' | 'sweep' | 'meteor' | 'electric'>(this.getItem('bb_cardBorderAnimation', 'rotate'));
  cardBorderThickness = signal<number>(this.getItem('bb_cardBorderThickness', 2)); // in pixels
  card3dOn = signal<boolean>(this.getItem('bb_card3dOn', false));
  cardTiltDegree = signal<number>(this.getItem('bb_cardTiltDegree', 2));
  cardHoverEffectOn = signal<boolean>(this.getItem('bb_cardHoverEffectOn', false));
  cardHoverIntensity = signal<number>(this.getItem('bb_cardHoverIntensity', 50));
  cardShimmerOn = signal<boolean>(this.getItem('bb_cardShimmerOn', false));
  cardShimmerIntensity = signal<number>(this.getItem('bb_cardShimmerIntensity', 10)); // Percentage
  cardShimmerAnimation = signal<'slide' | 'pulse' | 'diag' | 'radar'>(this.getItem('bb_cardShimmerAnimation', 'slide'));
  cardShimmerColor = signal<string>(this.getItem('bb_cardShimmerColor', '#FFFFFF'));


  // Background Grid Settings
  gridLinesOn = signal<boolean>(this.getItem('bb_gridLinesOn', true));
  gridLineIntensity = signal<number>(this.getItem('bb_gridLineIntensity', 10)); // Percentage

  // Game & Tool Durations
  pomodoroWorkMinutes = signal<number>(this.getItem('bb_pomodoro_work', 25));
  pomodoroShortBreakMinutes = signal<number>(this.getItem('bb_pomodoro_short', 5));
  pomodoroLongBreakMinutes = signal<number>(this.getItem('bb_pomodoro_long', 15));
  speedMathDuration = signal<number>(this.getItem('bb_speedMathDuration', 60)); // in seconds
  reactionTimeRounds = signal<number>(this.getItem('bb_reactionTimeRounds', 5));
  cardFlipAnimationOn = signal<boolean>(this.getItem('bb_cardFlipAnimationOn', true));
  cardFlipAnimationSpeed = signal<number>(this.getItem('bb_cardFlipAnimationSpeed', 0.6)); // in seconds
  cardMatchAnimationOn = signal<boolean>(this.getItem('bb_cardMatchAnimationOn', true));
  cardMatchAnimationType = signal<'pulse' | 'glow'>(this.getItem('bb_cardMatchAnimationType', 'glow'));


  constructor() {
    // Persist settings changes to localStorage
    effect(() => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('bb_apiKey', JSON.stringify(this.apiKey()));
        window.localStorage.setItem('bb_animationsOn', JSON.stringify(this.animationsOn()));
        window.localStorage.setItem('bb_loadingAnimation', JSON.stringify(this.loadingAnimation()));
        window.localStorage.setItem('bb_backgroundAnimations', JSON.stringify(this.backgroundAnimations()));
        window.localStorage.setItem('bb_cardAnimations', JSON.stringify(this.cardAnimations()));
        window.localStorage.setItem('bb_uiAnimations', JSON.stringify(this.uiAnimations()));
        window.localStorage.setItem('bb_gameAnimations', JSON.stringify(this.gameAnimations()));
        window.localStorage.setItem('bb_language', JSON.stringify(this.language()));
        window.localStorage.setItem('bb_font', JSON.stringify(this.font()));
        window.localStorage.setItem('bb_uiScale', JSON.stringify(this.uiScale()));
        window.localStorage.setItem('bb_themeColor', JSON.stringify(this.themeColor()));
        window.localStorage.setItem('bb_lightingIntensity', JSON.stringify(this.lightingIntensity()));
        window.localStorage.setItem('bb_soundOn', JSON.stringify(this.soundOn()));
        window.localStorage.setItem('bb_cardColor', JSON.stringify(this.cardColor()));
        window.localStorage.setItem('bb_cardSmokeOn', JSON.stringify(this.cardSmokeOn()));
        window.localStorage.setItem('bb_cardSmokeIntensity', JSON.stringify(this.cardSmokeIntensity()));
        window.localStorage.setItem('bb_cardGlowColor', JSON.stringify(this.cardGlowColor()));
        window.localStorage.setItem('bb_cardLightingIntensity', JSON.stringify(this.cardLightingIntensity()));
        window.localStorage.setItem('bb_cardLightingSpeed', JSON.stringify(this.cardLightingSpeed()));
        window.localStorage.setItem('bb_cardBorderAnimation', JSON.stringify(this.cardBorderAnimation()));
        window.localStorage.setItem('bb_cardBorderThickness', JSON.stringify(this.cardBorderThickness()));
        window.localStorage.setItem('bb_card3dOn', JSON.stringify(this.card3dOn()));
        window.localStorage.setItem('bb_cardTiltDegree', JSON.stringify(this.cardTiltDegree()));
        window.localStorage.setItem('bb_cardHoverEffectOn', JSON.stringify(this.cardHoverEffectOn()));
        window.localStorage.setItem('bb_cardHoverIntensity', JSON.stringify(this.cardHoverIntensity()));
        window.localStorage.setItem('bb_cardShimmerOn', JSON.stringify(this.cardShimmerOn()));
        window.localStorage.setItem('bb_cardShimmerIntensity', JSON.stringify(this.cardShimmerIntensity()));
        window.localStorage.setItem('bb_cardShimmerAnimation', JSON.stringify(this.cardShimmerAnimation()));
        window.localStorage.setItem('bb_cardShimmerColor', JSON.stringify(this.cardShimmerColor()));
        window.localStorage.setItem('bb_gridLinesOn', JSON.stringify(this.gridLinesOn()));
        window.localStorage.setItem('bb_gridLineIntensity', JSON.stringify(this.gridLineIntensity()));
        window.localStorage.setItem('bb_pomodoro_work', JSON.stringify(this.pomodoroWorkMinutes()));
        window.localStorage.setItem('bb_pomodoro_short', JSON.stringify(this.pomodoroShortBreakMinutes()));
        window.localStorage.setItem('bb_pomodoro_long', JSON.stringify(this.pomodoroLongBreakMinutes()));
        window.localStorage.setItem('bb_speedMathDuration', JSON.stringify(this.speedMathDuration()));
        window.localStorage.setItem('bb_reactionTimeRounds', JSON.stringify(this.reactionTimeRounds()));
        window.localStorage.setItem('bb_cardFlipAnimationOn', JSON.stringify(this.cardFlipAnimationOn()));
        window.localStorage.setItem('bb_cardFlipAnimationSpeed', JSON.stringify(this.cardFlipAnimationSpeed()));
        window.localStorage.setItem('bb_cardMatchAnimationOn', JSON.stringify(this.cardMatchAnimationOn()));
        window.localStorage.setItem('bb_cardMatchAnimationType', JSON.stringify(this.cardMatchAnimationType()));
      }
    });
  }
}