import { Injectable, signal } from '@angular/core';
import { GAMES_LIST } from '../components/games/games.data';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
}

const MOCK_NAMES = ['Cortex', 'Synapse', 'Neuron', 'Axon', 'Dendrite', 'Glitch', 'Vector', 'Pixel', 'Cypher', 'Byte'];

@Injectable({ providedIn: 'root' })
export class LeaderboardService {

  private getItem<T>(key: string, defaultValue: T): T {
    if (typeof window !== 'undefined') {
      const storedValue = window.localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    }
    return defaultValue;
  }

  private leaderboards = signal<{ [gameId: string]: LeaderboardEntry[] }>(this.getItem('bb_leaderboards', {}));

  constructor() {
    // Initialize with mock data if empty
    if (Object.keys(this.leaderboards()).length === 0) {
      this.generateInitialMockData();
    }
  }

  private generateInitialMockData() {
    const gameIds = GAMES_LIST.filter(g => g.isPlayable).map(g => g.id);
    const newBoards: { [gameId: string]: LeaderboardEntry[] } = {};
    gameIds.forEach(id => {
      const entries: LeaderboardEntry[] = [];
      for (let i = 0; i < 10; i++) {
        entries.push({
          rank: i + 1,
          name: MOCK_NAMES[i],
          score: Math.floor(Math.random() * (2000 - 500 + 1)) + 500,
        });
      }
      newBoards[id] = entries.sort((a, b) => b.score - a.score).map((e, i) => ({ ...e, rank: i + 1 }));
    });
    this.leaderboards.set(newBoards);
    this.saveLeaderboards();
  }
  
  private saveLeaderboards() {
     if (typeof window !== 'undefined') {
        window.localStorage.setItem('bb_leaderboards', JSON.stringify(this.leaderboards()));
     }
  }
  
  getLeaderboard(gameId: string): LeaderboardEntry[] {
    return this.leaderboards()[gameId] || [];
  }

  addScore(gameId: string, score: number, name: string) {
    this.leaderboards.update(boards => {
      if (!boards[gameId]) {
        boards[gameId] = [];
      }
      
      const newEntry = { rank: 0, name, score };
      const updatedBoard = [...boards[gameId], newEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10) // Keep top 10
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
        
      boards[gameId] = updatedBoard;
      return { ...boards };
    });
    this.saveLeaderboards();
  }
}