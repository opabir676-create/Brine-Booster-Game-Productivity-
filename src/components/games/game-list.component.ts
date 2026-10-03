import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Game } from './games.types';
import { GAMES_LIST } from './games.data';
import { ProgressService } from '../../services/progress.service';

type Category = 'All' | 'Favorites' | 'Memory' | 'Logic' | 'Focus' | 'AI';

@Component({
  selector: 'app-game-list',
  templateUrl: './game-list.component.html',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameListComponent {
  searchQuery = signal('');
  selectedCategory = signal<Category>('All');
  progressService = inject(ProgressService);
  
  games: Game[] = GAMES_LIST;

  categories: Category[] = ['All', 'Favorites', 'Memory', 'Logic', 'Focus', 'AI'];

  filteredGames = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();
    const favoriteIds = this.progressService.stats().favoriteGames || [];

    return this.games.filter(game => {
      const matchesSearch = game.name.toLowerCase().includes(query);
      if (!matchesSearch) return false;

      switch (category) {
        case 'All':
          return true;
        case 'Favorites':
          return favoriteIds.includes(game.id);
        default:
          return game.category === category;
      }
    });
  });

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  selectCategory(category: Category) {
    this.selectedCategory.set(category);
  }
}
