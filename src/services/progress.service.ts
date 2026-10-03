import { Injectable, signal, effect, inject } from '@angular/core';
import { GameReport, Game } from '../components/games/games.types';
import { GAMES_LIST } from '../components/games/games.data';
import { AchievementsService } from './achievements.service';
import { LeaderboardService } from './leaderboard.service';

export interface GameHistoryEntry {
    score: number;
    date: number;
    accuracy?: string;
    avgReactionTime?: string;
}

export interface UserStats {
    coin: number;
    xp: number;
    streak: number; // days
    gamesPlayed: number;
    bestScore: number;
    bestScoresByGame: { [gameId: string]: number };
    achievements: string[]; // List of unlocked achievement IDs
    gameHistory: { [gameId: string]: GameHistoryEntry[] };
    lastStreakUpdate: string; // YYYY-MM-DD
    favoriteGames?: string[];
}

export interface DailyChallenge {
    date: string; // YYYY-MM-DD
    gameId: string;
    description: string;
    link: string;
    reward: { xp: number; coin: number };
    completed: boolean;
}

export interface Goal {
  id: number;
  description: string;
  type: 'weekly' | 'monthly';
  target: number;
  progress: number;
  category: 'Logic' | 'Memory' | 'Focus' | 'AI' | 'pomodoro' | 'games';
  startDate: number;
}


@Injectable({ providedIn: 'root' })
export class ProgressService {
    private achievementsService = inject(AchievementsService);
    private leaderboardService = inject(LeaderboardService);

    private getItem<T>(key: string, defaultValue: T): T {
        if (typeof window !== 'undefined') {
            const storedValue = window.localStorage.getItem(key);
            if (storedValue) {
                try {
                    const parsedValue = JSON.parse(storedValue);
                    
                    // For non-array objects, merge with defaults to ensure all keys exist and are not null.
                    if (typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue) && typeof parsedValue === 'object' && parsedValue !== null) {
                        const merged = { ...defaultValue, ...parsedValue };
                        // Ensure required fields from default are not null/undefined in the final object.
                        for (const k of Object.keys(defaultValue)) {
                            if (merged[k as keyof T] == null) {
                                merged[k as keyof T] = defaultValue[k as keyof T];
                            }
                        }
                        return merged;
                    }
                    
                    // For primitives, arrays, or null, return parsed value or default.
                    return parsedValue ?? defaultValue;
                } catch (e) {
                    console.error(`Error parsing localStorage key "${key}":`, e);
                    return defaultValue;
                }
            }
        }
        return defaultValue;
    }

    stats = signal<UserStats>(this.getItem('bb_userStats', {
        coin: 0,
        xp: 0,
        streak: 0,
        gamesPlayed: 0,
        bestScore: 0,
        bestScoresByGame: {},
        achievements: [],
        gameHistory: {},
        lastStreakUpdate: '',
        favoriteGames: [],
    }));

    goals = signal<Goal[]>(this.getItem('bb_goals', []));
    dailyChallenge = signal<DailyChallenge | null>(null);
    private allGames: Game[] = GAMES_LIST.filter(g => g.isPlayable);

    constructor() {
        this.loadDailyChallenge();
        this.checkAndResetGoals();

        effect(() => {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem('bb_userStats', JSON.stringify(this.stats()));
                window.localStorage.setItem('bb_goals', JSON.stringify(this.goals()));
            }
        });
    }

    private getTodayString(): string {
        return new Date().toISOString().split('T')[0];
    }

    private loadDailyChallenge() {
        const storedChallenge = this.getItem<DailyChallenge | null>('bb_dailyChallenge', null);
        if (storedChallenge && storedChallenge.date === this.getTodayString()) {
            this.dailyChallenge.set(storedChallenge);
        } else {
            this.generateNewDailyChallenge();
        }
    }

    private generateNewDailyChallenge() {
        const randomGame = this.allGames[Math.floor(Math.random() * this.allGames.length)];
        const newChallenge: DailyChallenge = {
            date: this.getTodayString(),
            gameId: randomGame.id,
            description: `Play a round of ${randomGame.name}`,
            link: `/games/${randomGame.id}`,
            reward: { xp: 100, coin: 25 },
            completed: false,
        };
        this.dailyChallenge.set(newChallenge);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('bb_dailyChallenge', JSON.stringify(newChallenge));
        }
    }
    
    completeDailyChallenge() {
        const challenge = this.dailyChallenge();
        if (challenge && !challenge.completed) {
            challenge.completed = true;
            this.stats.update(stats => ({
                ...stats,
                xp: stats.xp + challenge.reward.xp,
                coin: stats.coin + challenge.reward.coin,
            }));
            this.dailyChallenge.set({ ...challenge });
            if (typeof window !== 'undefined') {
                window.localStorage.setItem('bb_dailyChallenge', JSON.stringify(challenge));
            }
            this.achievementsService.checkAchievements(this.stats());
        }
    }


    private calculateFinalScore(report: GameReport): number {
        if (!report) return 0;
        let score = 0;
        switch (report.type) {
            case 'CardFlipper':
            case 'ReactionTime':
            case 'LogicBlocks':
            case 'AIRiddles':
            case 'FocusFlow':
            case 'AIQuiz':
            case 'AIPuzzles':
            case 'NumberSequence':
            case 'SpeedMath':
            case 'PatternMatch':
            case 'CodeBreaker':
            case 'SpatialSpin':
            case 'ColorClash':
            case 'AIWordScramble':
            case 'AIGuessThePrompt':
            case 'AITwoTruthsLie':
            case 'AISpotTheDifference':
            case 'AIMoralDilemmas':
            case 'AICreativeStory':
            case 'WordLadder':
            case 'TrailBlazer':
            case 'OddOneOut':
            case 'SudokuMini':
                score = report.stats.find(s => s.label === 'Final Score')?.value as number || 0;
                break;
            case 'MemoryGrid':
                const memRounds = report.stats.find(s => s.label === 'Rounds Completed')?.value as number || 0;
                score = Math.floor(memRounds * (report.accuracy / 10));
                break;
        }
        return score;
    }

    updateStatsFromGame(report: GameReport, gameId: string) {
        if (!report) return;

        let earnedXp = 0;
        let earnedCoins = 0;
        const finalScore = this.calculateFinalScore(report);
        
        const rounds = report.stats.find(s => s.label.includes('Round') || s.label.includes('Solved') || s.label.includes('Correct') || s.label.includes('Guesses Used') || s.label.includes('Dilemmas'))?.value as number || 0;

        switch (report.type) {
            case 'CardFlipper':
                const moves = report.stats.find(s => s.label === 'Moves')?.value as number || 0;
                earnedXp = (200 - moves) * 2; // Fewer moves = more XP
                earnedCoins = Math.floor(finalScore / 15);
                break;
            case 'ReactionTime':
                const avgTime = parseFloat(report.stats.find(s => s.label === 'Average Time')?.value as string) || 1000;
                earnedXp = Math.max(0, 500 - Math.floor(avgTime)) * 2; // Faster time = more XP
                earnedCoins = Math.floor(finalScore / 10);
                break;
            case 'LogicBlocks':
                earnedXp = rounds * 15;
                earnedCoins = Math.floor(finalScore / 20);
                break;
            case 'MemoryGrid':
                earnedXp = rounds * 10;
                earnedCoins = rounds * 5;
                break;
            case 'AIWordScramble':
            case 'AIRiddles':
            case 'FocusFlow':
                earnedXp = rounds * 12;
                earnedCoins = Math.floor(finalScore / 15);
                break;
            case 'AIQuiz':
            case 'AIPuzzles':
                earnedXp = rounds * 20;
                earnedCoins = Math.floor(finalScore / 10);
                break;
            case 'AIGuessThePrompt':
                earnedXp = rounds * 25; // Image based, more XP
                earnedCoins = Math.floor(finalScore / 10);
                break;
            case 'AITwoTruthsLie':
            case 'AIMoralDilemmas':
                earnedXp = rounds * 20;
                earnedCoins = Math.floor(finalScore / 12);
                break;
            case 'AISpotTheDifference':
                earnedXp = 100; // Flat XP for completion
                earnedCoins = 20;
                break;
            case 'AICreativeStory':
                 const turns = report.stats.find(s => s.label === 'Turns Taken')?.value as number || 0;
                 earnedXp = turns * 8;
                 earnedCoins = Math.floor(finalScore / 25);
                 break;
            case 'NumberSequence':
                earnedXp = rounds * 22;
                earnedCoins = Math.floor(finalScore / 8);
                break;
            case 'SpeedMath':
                const correct = report.stats.find(s => s.label === 'Correct')?.value as number || 0;
                earnedXp = correct * 5;
                earnedCoins = Math.floor(finalScore / 15);
                break;
            case 'PatternMatch':
                earnedXp = rounds * 15;
                earnedCoins = Math.floor(finalScore / 20);
                break;
            case 'CodeBreaker':
                earnedXp = (10 - rounds) * 18; // More XP for fewer guesses
                earnedCoins = Math.floor(finalScore / 12);
                break;
            case 'SpatialSpin':
                 earnedXp = rounds * 18;
                 earnedCoins = Math.floor(finalScore / 10);
                 break;
            case 'ColorClash':
                 const correctAnswers = report.stats.find(s => s.label === 'Correct')?.value as number || 0;
                 earnedXp = correctAnswers * 4;
                 earnedCoins = Math.floor(finalScore / 20);
                 break;
            case 'WordLadder':
                const puzzlesSolved = report.stats.find(s => s.label === 'Puzzles Solved')?.value as number || 0;
                earnedXp = puzzlesSolved * 25;
                earnedCoins = Math.floor(finalScore / 10);
                break;
            case 'TrailBlazer':
                const trailRounds = report.stats.find(s => s.label === 'Rounds Completed')?.value as number || 0;
                earnedXp = trailRounds * 15;
                earnedCoins = Math.floor(finalScore / 10);
                break;
            case 'OddOneOut':
                const found = report.stats.find(s => s.label === 'Correctly Found')?.value as number || 0;
                earnedXp = found * 6;
                earnedCoins = Math.floor(finalScore / 20);
                break;
            case 'SudokuMini':
                const mistakes = report.stats.find(s => s.label === 'Mistakes')?.value as number || 0;
                // Fewer mistakes and faster time (higher score) leads to more XP.
                earnedXp = Math.max(10, 50 - mistakes * 5);
                earnedCoins = Math.floor(finalScore / 40);
                break;
        }

        const today = this.getTodayString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        this.stats.update(currentStats => {
            const newStats = { ...currentStats };
            
            newStats.gamesPlayed = (newStats.gamesPlayed || 0) + 1;
            newStats.xp += earnedXp;
            newStats.coin += earnedCoins;

            // Streak logic
            if (newStats.lastStreakUpdate !== today) {
                if (newStats.lastStreakUpdate === yesterdayStr) {
                    newStats.streak = (newStats.streak || 0) + 1; // Continue streak
                } else {
                    newStats.streak = 1; // Reset or start streak
                }
                newStats.lastStreakUpdate = today;
            }

            const oldBestForGame = newStats.bestScoresByGame[gameId] || 0;
            if (finalScore > oldBestForGame) {
                newStats.bestScoresByGame[gameId] = Math.floor(finalScore);
                this.leaderboardService.addScore(gameId, Math.floor(finalScore), 'User');
            }
            
            // Create and update game history entry
            const newHistoryEntry: GameHistoryEntry = {
                score: Math.floor(finalScore),
                date: Date.now()
            };
        
            if (report.type === 'MemoryGrid' || report.type === 'PatternMatch' || report.type === 'ColorClash') {
                newHistoryEntry.accuracy = report.stats.find(s => s.label === 'Accuracy')?.value as string;
                newHistoryEntry.avgReactionTime = report.stats.find(s => s.label === 'Avg. Reaction')?.value as string;
            } else if (report.type === 'AIQuiz' || report.type === 'AIPuzzles' || report.type === 'NumberSequence') {
                const correctAnswersStat = report.stats.find(s => s.label.includes('Correct') || s.label.includes('Solved'))?.value.toString();
                if (correctAnswersStat) {
                    const parts = correctAnswersStat.split('/');
                    if (parts.length === 2) {
                        const correct = parseInt(parts[0].trim(), 10);
                        const total = parseInt(parts[1].trim(), 10);
                        if (!isNaN(correct) && !isNaN(total) && total > 0) {
                             newHistoryEntry.accuracy = `${((correct / total) * 100).toFixed(1)}%`;
                        }
                    }
                }
            }

            if (!newStats.gameHistory[gameId]) {
                newStats.gameHistory[gameId] = [];
            }
            newStats.gameHistory[gameId].push(newHistoryEntry);
            // Keep history to a reasonable size
            if(newStats.gameHistory[gameId].length > 20) {
                newStats.gameHistory[gameId].shift();
            }


            if (finalScore > newStats.bestScore) {
                newStats.bestScore = Math.floor(finalScore);
            }
            return newStats;
        });

        // Check for daily challenge completion
        const challenge = this.dailyChallenge();
        if (challenge && !challenge.completed && challenge.gameId === gameId) {
            this.completeDailyChallenge();
        }

        // Update goals
        const gameCategory = this.allGames.find(g => g.id === gameId)?.category;
        if (gameCategory) {
            this.updateGoalProgress(gameCategory, 1);
        }

        // Check for achievements
        this.achievementsService.checkAchievements(this.stats());
    }

    addPomodoroReward() {
        this.stats.update(stats => ({
            ...stats,
            xp: stats.xp + 25,
            coin: stats.coin + 5,
        }));
        this.updateGoalProgress('pomodoro', 1);
        this.achievementsService.checkAchievements(this.stats());
    }

    addHabitStreakReward() {
         this.stats.update(stats => ({
            ...stats,
            xp: stats.xp + 50,
            coin: stats.coin + 10,
        }));
        this.achievementsService.checkAchievements(this.stats());
    }

    addIdeaGeneratorReward() {
        this.stats.update(stats => ({
            ...stats,
            xp: stats.xp + 5,
            coin: stats.coin + 2,
        }));
        this.achievementsService.checkAchievements(this.stats());
    }
    
    addGoalSetterReward() {
        this.stats.update(stats => ({
            ...stats,
            xp: stats.xp + 15,
            coin: stats.coin + 5,
        }));
        this.achievementsService.checkAchievements(this.stats());
    }

    addMeetingSummarizerReward() {
        this.stats.update(stats => ({
            ...stats,
            xp: stats.xp + 15,
            coin: stats.coin + 5,
        }));
        this.achievementsService.checkAchievements(this.stats());
    }


    // --- Goal Methods ---
    
    private checkAndResetGoals() {
        const now = new Date();
        const updatedGoals = this.goals().map(goal => {
            const startDate = new Date(goal.startDate);
            let shouldReset = false;
            if (goal.type === 'weekly') {
                const endOfWeek = new Date(startDate);
                endOfWeek.setDate(startDate.getDate() + 7);
                if (now >= endOfWeek) shouldReset = true;
            } else { // monthly
                const endOfMonth = new Date(startDate);
                endOfMonth.setMonth(startDate.getMonth() + 1);
                if (now >= endOfMonth) shouldReset = true;
            }

            if (shouldReset) {
                return { ...goal, progress: 0, startDate: now.getTime() };
            }
            return goal;
        }).filter(Boolean); // Filter out any potentially null goals
        this.goals.set(updatedGoals as Goal[]);
    }

    addGoal(goal: Omit<Goal, 'id' | 'progress' | 'startDate'>) {
        const newGoal: Goal = {
            ...goal,
            id: Date.now(),
            progress: 0,
            startDate: Date.now()
        };
        this.goals.update(goals => [...goals, newGoal]);
    }

    deleteGoal(goalId: number) {
        this.goals.update(goals => goals.filter(g => g.id !== goalId));
    }

    private updateGoalProgress(category: Goal['category'] | 'games', amount: number) {
        this.checkAndResetGoals();
        this.goals.update(goals => goals.map(goal => {
            const categoryMatch = goal.category === category;
            const allGamesMatch = goal.category === 'games' && category !== 'pomodoro';
            
            if ((categoryMatch || allGamesMatch) && goal.progress < goal.target) {
                return { ...goal, progress: Math.min(goal.target, goal.progress + amount) };
            }
            return goal;
        }));
    }

    toggleFavorite(gameId: string) {
        this.stats.update(stats => {
            const favorites = stats.favoriteGames || [];
            if (favorites.includes(gameId)) {
                return { ...stats, favoriteGames: favorites.filter(id => id !== gameId) };
            } else {
                return { ...stats, favoriteGames: [...favorites, gameId] };
            }
        });
    }
}