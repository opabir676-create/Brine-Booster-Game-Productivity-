import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProgressService, UserStats, Goal } from '../../services/progress.service';
import { Game } from '../games/games.types';
import { GAMES_LIST } from '../games/games.data';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './progress.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressComponent {
  progressService = inject(ProgressService);
  fb = inject(FormBuilder);
  
  stats = this.progressService.stats;
  goals = this.progressService.goals;
  
  allGames: Game[] = GAMES_LIST;

  // Goal Form State
  goalCategories: Goal['category'][] = ['games', 'Logic', 'Memory', 'Focus', 'AI', 'pomodoro'];
  
  goalForm = this.fb.nonNullable.group({
      description: ['', Validators.required],
      type: ['weekly' as 'weekly' | 'monthly', Validators.required],
      target: [5, [Validators.required, Validators.min(1)]],
      category: ['games' as Goal['category'], Validators.required]
  });
  
  getGameName(gameId: string): string {
    return this.allGames.find(g => g.id === gameId)?.name || 'Unknown Game';
  }
  
  getGameHistoryKeys(): string[] {
    return Object.keys(this.stats().gameHistory);
  }

  hasAccuracyData(gameId: string): boolean {
    return this.stats().gameHistory[gameId]?.some(entry => entry.accuracy !== undefined && entry.accuracy !== null);
  }

  hasReactionData(gameId: string): boolean {
    return this.stats().gameHistory[gameId]?.some(entry => entry.avgReactionTime !== undefined && entry.avgReactionTime !== null);
  }
  
  addGoal() {
      if (this.goalForm.invalid) return;
      const goalData = this.goalForm.getRawValue();
      if (!goalData.description.trim() || goalData.target < 1) return;
      this.progressService.addGoal(goalData);
      // Reset form
      this.goalForm.reset({ description: '', type: 'weekly', target: 5, category: 'games' });
  }

  deleteGoal(id: number) {
    this.progressService.deleteGoal(id);
  }
}