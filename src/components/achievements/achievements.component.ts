import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AchievementsService } from '../../services/achievements.service';

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './achievements.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsComponent {
  achievementsService = inject(AchievementsService);

  achievements = computed(() => {
    const unlocked = this.achievementsService.unlockedAchievements();
    return this.achievementsService.allAchievements.map(ach => ({
      ...ach,
      unlocked: unlocked.includes(ach.id),
    }));
  });

  unlockedCount = computed(() => this.achievements().filter(a => a.unlocked).length);
  totalCount = computed(() => this.achievements().length);
}
