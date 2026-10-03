import { Injectable, signal } from '@angular/core';
import { UserStats } from './progress.service';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: (stats: UserStats) => boolean;
}

const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_game', name: 'First Step', description: 'Play your first game.', icon: '🚀', isUnlocked: (stats) => stats.gamesPlayed >= 1 },
  { id: 'streak_3', name: 'On a Roll', description: 'Maintain a 3-day streak.', icon: '🔥', isUnlocked: (stats) => stats.streak >= 3 },
  { id: 'streak_7', name: 'Week of Willpower', description: 'Maintain a 7-day streak.', icon: '🗓️', isUnlocked: (stats) => stats.streak >= 7 },
  { id: 'xp_1000', name: 'Brainiac', description: 'Earn 1,000 XP.', icon: '💡', isUnlocked: (stats) => stats.xp >= 1000 },
  { id: 'xp_5000', name: 'Cognitive Champion', description: 'Earn 5,000 XP.', icon: '🏆', isUnlocked: (stats) => stats.xp >= 5000 },
  { id: 'coin_1000', name: 'Coin Collector', description: 'Collect 1,000 coins.', icon: '💰', isUnlocked: (stats) => stats.coin >= 1000 },
  { id: 'ai_challenger', name: 'AI Challenger', description: 'Play any AI-powered game.', icon: '🤖', isUnlocked: (stats) => stats.gameHistory['ai-riddles']?.length > 0 || stats.gameHistory['ai-quiz']?.length > 0 || stats.gameHistory['ai-puzzles']?.length > 0 },
  { id: 'high_scorer', name: 'High Scorer', description: 'Achieve a best score of over 500 in any game.', icon: '🎯', isUnlocked: (stats) => Object.values(stats.bestScoresByGame).some(score => score >= 500) },
  { id: 'game_master_3', name: 'Versatile Mind', description: 'Play 3 different games.', icon: '🎲', isUnlocked: (stats) => Object.keys(stats.gameHistory).length >= 3 },
  { id: 'game_master_5', name: 'Polymath', description: 'Play 5 different games.', icon: '🧠', isUnlocked: (stats) => Object.keys(stats.gameHistory).length >= 5 },
  { id: 'perfect_focus', name: 'Perfect Focus', description: 'Complete a Pomodoro session.', icon: '🍅', isUnlocked: () => false }, // Placeholder, logic needs to be added in progress service
  { id: 'habit_hero', name: 'Habit Hero', description: 'Complete all daily habits.', icon: '📈', isUnlocked: () => false }, // Placeholder
];

@Injectable({ providedIn: 'root' })
export class AchievementsService {
  private getItem<T>(key: string, defaultValue: T): T {
    if (typeof window !== 'undefined') {
      const storedValue = window.localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    }
    return defaultValue;
  }
  
  unlockedAchievements = signal<string[]>(this.getItem('bb_unlockedAchievements', []));
  
  allAchievements = ALL_ACHIEVEMENTS;

  constructor() {}

  checkAchievements(stats: UserStats) {
    const newUnlocks: string[] = [];
    this.allAchievements.forEach(achievement => {
      if (!this.unlockedAchievements().includes(achievement.id) && achievement.isUnlocked(stats)) {
        newUnlocks.push(achievement.id);
      }
    });

    if (newUnlocks.length > 0) {
      this.unlockedAchievements.update(current => [...current, ...newUnlocks]);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('bb_unlockedAchievements', JSON.stringify(this.unlockedAchievements()));
      }
      // TODO: In a real app, we might emit an event here to show a notification.
    }
  }
}
