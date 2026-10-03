import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LeaderboardService, LeaderboardEntry } from '../../services/leaderboard.service';
import { Game } from '../games/games.types';
import { GAMES_LIST } from '../games/games.data';
import { ProgressService } from '../../services/progress.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './leaderboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardComponent {
  leaderboardService = inject(LeaderboardService);
  progressService = inject(ProgressService);
  
  games: Game[] = GAMES_LIST.filter(g => g.isPlayable);
  selectedGameId = signal<string>(this.games[0]?.id || '');

  leaderboardData = computed(() => {
    return this.leaderboardService.getLeaderboard(this.selectedGameId());
  });
  
  userBestScore = computed(() => {
    return this.progressService.stats().bestScoresByGame[this.selectedGameId()] || 0;
  });

  onGameChange(event: Event) {
    const gameId = (event.target as HTMLSelectElement).value;
    this.selectedGameId.set(gameId);
  }
}