import { Component, ChangeDetectionStrategy, inject, computed, signal, effect } from '@angular/core';
import { ProgressService } from '../../services/progress.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Game } from '../games/games.types';
import { GAMES_LIST } from '../games/games.data';
import { GeminiService } from '../../services/gemini.service';
import { SettingsService } from '../../services/settings.service';

const defaultDescriptions: { [key: string]: string } = {
  coins: "Complete your Daily Challenge for a big bonus. Achieve new high scores in games to earn performance rewards. Finish Pomodoro sessions to get rewarded for your focus. Build and maintain your daily habit streak.",
  xp: "Playing games is the primary way to get XP. Harder difficulties in games yield more XP. Solving AI-powered Puzzles and Quizzes gives a great XP boost.",
  streak: "Your streak increases by one for each consecutive day you play at least one game or complete a productivity task. Keep it going for extra rewards!",
};

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  progressService = inject(ProgressService);
  private geminiService = inject(GeminiService);
  private settingsService = inject(SettingsService);

  userStats = this.progressService.stats;
  dailyChallenge = this.progressService.dailyChallenge;

  private allGamesList: Game[] = GAMES_LIST;

  descriptions = signal(defaultDescriptions);
  isLoadingDescriptions = signal(false);

  constructor() {
    effect(async () => {
      const lang = this.settingsService.language();
      if (lang === 'English') {
        this.descriptions.set(defaultDescriptions);
        return;
      }

      if (this.settingsService.apiKeyValidationState() !== 'valid') {
        return;
      }
      
      const cacheKey = `bb_stat_desc_${lang}`;
      if (typeof sessionStorage !== 'undefined') {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          this.descriptions.set(JSON.parse(cached));
          return;
        }
      }

      this.isLoadingDescriptions.set(true);
      try {
        const textsToTranslate = Object.entries(defaultDescriptions).map(([key, text]) => ({ key, text }));
        const translationJson = await this.geminiService.translateTexts(textsToTranslate, lang);
        const result = JSON.parse(translationJson);
        
        const newDescriptions: { [key: string]: string } = {};
        for(const item of result.translations) {
          newDescriptions[item.key] = item.translated_text;
        }

        this.descriptions.set(newDescriptions);
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify(newDescriptions));
        }

      } catch (e) {
        console.error("Failed to translate descriptions", e);
        this.descriptions.set(defaultDescriptions); // Fallback to English
      } finally {
        this.isLoadingDescriptions.set(false);
      }

    }, { allowSignalWrites: true });
  }


  gamesPlayedToday = computed(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const history = this.userStats().gameHistory;
    let count = 0;
    for (const gameId in history) {
      for (const entry of history[gameId]) {
        const entryDate = new Date(entry.date).toISOString().split('T')[0];
        if (entryDate === todayStr) {
          count++;
        }
      }
    }
    return count;
  });

  dailyActivityChartData = computed(() => {
    const history = this.userStats().gameHistory;
    const activityByDate: { [key: string]: number } = {};
    const dates: Date[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date);
      activityByDate[date.toISOString().split('T')[0]] = 0;
    }
    
    for (const gameId in history) {
      for (const entry of history[gameId]) {
        const entryDateStr = new Date(entry.date).toISOString().split('T')[0];
        if (activityByDate[entryDateStr] !== undefined) {
          activityByDate[entryDateStr]++;
        }
      }
    }

    const activityCounts = dates.map(d => activityByDate[d.toISOString().split('T')[0]]);
    const maxActivity = Math.max(...activityCounts, 1);
    
    const width = 300;
    const height = 100;
    const paddingY = 10;
    
    let linePoints = activityCounts.map((count, index) => {
      const x = (width / (activityCounts.length > 1 ? activityCounts.length - 1 : 1)) * index;
      const y = (height - paddingY) - ((count / maxActivity) * (height - (paddingY * 2)));
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');

    if (activityCounts.length < 2) linePoints = `0,${height - paddingY} ${width},${height - paddingY}`;

    const fillPoints = `0,${height} ${linePoints} ${width},${height}`;
    
    return { line: linePoints, fill: fillPoints };
  });

  chartXAxisLabels = computed(() => {
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('default', { weekday: 'short' }));
    }
    return labels;
  });

  topGames = computed(() => {
      const bestScores = this.userStats().bestScoresByGame;
      return Object.entries(bestScores)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([id, score]) => ({
            name: this.getGameNameById(id),
            score: (score as number).toLocaleString()
        }));
  });

  getGameNameById(id: string): string {
    return this.allGamesList.find(g => g.id === id)?.name || 'Unknown Game';
  }

  completeChallenge() {
    this.progressService.completeDailyChallenge();
  }
}